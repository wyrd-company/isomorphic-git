// @ts-check
import { GitConfigManager } from '../managers/GitConfigManager.js'
import { GitIndexManager } from '../managers/GitIndexManager.js'
import { assertSafeSubmodulePath } from '../utils/assertSafeSubmodulePath.js'
import { join } from '../utils/join.js'

import { _checkout } from './checkout.js'
import { _clone } from './clone.js'
import { _fetch } from './fetch.js'
import { _initSubmodule } from './initSubmodule.js'
import { _linkSubmoduleWorktree } from './linkSubmoduleWorktree.js'
import { _listSubmodules } from './listSubmodules.js'

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
 * @param {string[]} [args.paths]
 * @param {boolean} args.init
 * @param {boolean} args.recursive
 * @param {string} [args.corsProxy]
 * @param {Object<string, string>} [args.headers]
 *
 * @returns {Promise<Array<{name: string, path: string, url: string, oid: string}>>}
 */
export async function _updateSubmodules({
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
  paths,
  init,
  recursive,
  corsProxy,
  headers,
}) {
  const all = await _listSubmodules({ fs, dir })
  const selected =
    paths && paths.length ? all.filter(sm => paths.includes(sm.path)) : all

  const updated = []
  for (const submodule of selected) {
    const result = await updateOne({
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
      submodule,
      init,
      recursive,
      corsProxy,
      headers,
    })
    if (result) updated.push(result)
  }
  return updated
}

async function updateOne({
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
  submodule,
  init,
  recursive,
  corsProxy,
  headers,
}) {
  const { name, path } = submodule
  assertSafeSubmodulePath(path)
  assertSafeSubmodulePath(name)

  const config = await GitConfigManager.get({ fs, gitdir })
  let url = await config.get(`submodule.${name}.url`)
  if (!url) {
    // Not initialized yet: skip unless the caller asked us to init.
    if (!init) return null
    const initialized = await _initSubmodule({ fs, dir, gitdir, path })
    url = initialized.url
  }

  // The commit the superproject records for this submodule (its gitlink).
  const oid = await GitIndexManager.acquire(
    { fs, gitdir, cache },
    async function (index) {
      const entry = index.entries.find(entry => entry.path === path)
      return entry ? entry.oid : null
    }
  )
  // Nothing recorded to check out.
  if (!oid) return null

  const submoduleDir = join(dir, path)
  const submoduleGitdir = join(gitdir, 'modules', name)
  const cloned = await fs.exists(`${submoduleGitdir}/config`)
  if (!cloned) {
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
      ref: undefined,
      remote: 'origin',
      depth: undefined,
      since: undefined,
      exclude: [],
      relative: false,
      singleBranch: false,
      noCheckout: true,
      noTags: false,
      headers: headers || {},
    })
    await _linkSubmoduleWorktree({ fs, submoduleDir, submoduleGitdir })
  } else {
    await _fetch({
      fs,
      cache,
      http,
      onProgress,
      onMessage,
      onAuth,
      onAuthFailure,
      onAuthSuccess,
      gitdir: submoduleGitdir,
      remote: 'origin',
      corsProxy,
      headers: headers || {},
    })
  }

  // Check out the recorded commit as a detached HEAD, matching git.
  await _checkout({
    fs,
    cache,
    onProgress,
    dir: submoduleDir,
    gitdir: submoduleGitdir,
    ref: oid,
    remote: 'origin',
  })

  if (recursive) {
    // `paths` filters top-level submodules only, so it is intentionally not
    // threaded into the recursion (all nested submodules are considered).
    // `init` IS threaded so a non-init recursive update does not silently
    // initialize nested submodules, matching `git submodule update`.
    await _updateSubmodules({
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
      init,
      recursive,
      corsProxy,
      headers,
    })
  }

  return { name, path, url, oid }
}
