// @ts-check
import { AlreadyExistsError } from '../errors/AlreadyExistsError.js'
import { UnsafeFilepathError } from '../errors/UnsafeFilepathError.js'
import { GitConfigManager } from '../managers/GitConfigManager.js'
import { GitIndexManager } from '../managers/GitIndexManager.js'
import { GitRefManager } from '../managers/GitRefManager.js'
import { GitConfig } from '../models/GitConfig.js'
import { _writeObject } from '../storage/writeObject.js'
import { join } from '../utils/join.js'
import { relative } from '../utils/relative.js'

import { _clone } from './clone.js'
import { _listSubmodules } from './listSubmodules.js'

/**
 * Reject absolute paths and any `.`/`..` segment so a caller-supplied submodule
 * path or name cannot escape the working tree or the modules directory once it
 * is fed through `join`.
 *
 * @param {string} value
 */
function assertSafeSubmodulePath(value) {
  const isAbsolute = value.startsWith('/') || /^[a-zA-Z]:/.test(value)
  const segments = value.split(/[/\\]/)
  if (
    isAbsolute ||
    segments.some(segment => segment === '.' || segment === '..')
  ) {
    throw new UnsafeFilepathError(value)
  }
}

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {object} args.cache
 * @param {HttpClient} args.http
 * @param {ProgressCallback} [args.onProgress]
 * @param {MessageCallback} [args.onMessage]
 * @param {AuthCallback} [args.onAuth]
 * @param {AuthFailureCallback} [args.onAuthFailure]
 * @param {AuthSuccessCallback} [args.onAuthSuccess]
 * @param {string} args.dir
 * @param {string} args.gitdir
 * @param {string} args.url
 * @param {string} args.path
 * @param {string} args.name
 * @param {string} [args.ref]
 * @param {string} [args.corsProxy]
 * @param {Object<string, string>} [args.headers]
 *
 * @returns {Promise<{name: string, path: string, url: string, oid: string}>}
 */
export async function _addSubmodule({
  fs,
  cache,
  http,
  onProgress,
  onMessage,
  onAuth,
  onAuthFailure,
  onAuthSuccess,
  dir,
  gitdir,
  url,
  path,
  name,
  ref,
  corsProxy,
  headers,
}) {
  // `path` and `name` are caller-controlled and flow into `join`, so guard
  // against traversal before deriving any paths from them.
  assertSafeSubmodulePath(path)
  assertSafeSubmodulePath(name)

  // Refuse to clobber a submodule that is already registered.
  const submodules = await _listSubmodules({ fs, dir })
  if (submodules.some(sm => sm.name === name || sm.path === path)) {
    throw new AlreadyExistsError('submodule', name, false)
  }

  const submoduleDir = join(dir, path)
  const submoduleGitdir = join(gitdir, 'modules', name)

  // Clone the submodule's repository, keeping its git directory under the
  // superproject's `.git/modules/<name>` rather than in the working tree.
  await _clone({
    fs,
    cache,
    http,
    onProgress,
    onMessage,
    onAuth,
    onAuthFailure,
    onAuthSuccess,
    dir: submoduleDir,
    gitdir: submoduleGitdir,
    url,
    corsProxy,
    ref,
    remote: 'origin',
    depth: undefined,
    since: undefined,
    exclude: [],
    relative: false,
    singleBranch: false,
    noCheckout: false,
    noTags: false,
    headers: headers || {},
  })

  // Point the working tree's `.git` file at the absorbed git directory, and
  // point the git directory back at the working tree, both as relative paths
  // (this is what git records and what discoverGitdir expects).
  await fs.write(
    join(submoduleDir, '.git'),
    `gitdir: ${relative(submoduleDir, submoduleGitdir)}\n`,
    'utf8'
  )
  const submoduleConfig = await GitConfigManager.get({
    fs,
    gitdir: submoduleGitdir,
  })
  await submoduleConfig.set(
    'core.worktree',
    relative(submoduleGitdir, submoduleDir)
  )
  await GitConfigManager.save({
    fs,
    gitdir: submoduleGitdir,
    config: submoduleConfig,
  })

  // The commit the superproject will record as the gitlink.
  const oid = await GitRefManager.resolve({
    fs,
    gitdir: submoduleGitdir,
    ref: 'HEAD',
  })

  // Register the submodule in `.gitmodules` (tracked) ...
  const gitmodulesPath = `${dir}/.gitmodules`
  const gitmodulesText =
    (await fs.read(gitmodulesPath, { encoding: 'utf8' })) || ''
  const gitmodules = GitConfig.from(gitmodulesText)
  await gitmodules.set(`submodule.${name}.path`, path)
  await gitmodules.set(`submodule.${name}.url`, url)
  let serialized = gitmodules.toString()
  if (!serialized.endsWith('\n')) serialized += '\n'
  await fs.write(gitmodulesPath, serialized, 'utf8')

  // ... and in the superproject config (untracked, local).
  const config = await GitConfigManager.get({ fs, gitdir })
  await config.set(`submodule.${name}.url`, url)
  await config.set(`submodule.${name}.active`, 'true')
  await GitConfigManager.save({ fs, gitdir, config })

  // Stage the updated `.gitmodules` blob and the gitlink in the index.
  await GitIndexManager.acquire({ fs, gitdir, cache }, async function (index) {
    const object = await fs.read(gitmodulesPath)
    const gitmodulesOid = await _writeObject({
      fs,
      gitdir,
      type: 'blob',
      object,
    })
    const stats = await fs.lstat(gitmodulesPath)
    index.insert({ filepath: '.gitmodules', stats, oid: gitmodulesOid })
    index.insert({
      filepath: path,
      oid,
      stats: {
        ctimeSeconds: 0,
        ctimeNanoseconds: 0,
        mtimeSeconds: 0,
        mtimeNanoseconds: 0,
        dev: 0,
        ino: 0,
        mode: 0o160000,
        uid: 0,
        gid: 0,
        size: 0,
      },
    })
  })

  return { name, path, url, oid }
}
