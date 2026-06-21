// @ts-check
import '../typedefs.js'

import { _initSubmodule } from '../commands/initSubmodule.js'
import { FileSystem } from '../models/FileSystem.js'
import { assertParameter } from '../utils/assertParameter.js'
import { discoverGitdir } from '../utils/discoverGitdir.js'
import { join } from '../utils/join.js'

/**
 * Initialize a submodule
 *
 * Copies the submodule's `url` (and `update` strategy, if set) from
 * `.gitmodules` into the superproject config and marks it active, matching
 * `git submodule init`. Relative URLs are resolved against the superproject's
 * `remote.origin.url`. This does not touch the network or the working tree.
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} args.dir - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.path - The path of the submodule, relative to `dir`
 *
 * @returns {Promise<{name: string, path: string, url: string|void}>} Resolves successfully with the initialized submodule's `{name, path, url}` (the resolved url)
 *
 * @example
 * await git.initSubmodule({ fs, dir: '/tutorial', path: 'vendor/lib' })
 *
 */
export async function initSubmodule({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  path,
}) {
  try {
    assertParameter('fs', fs)
    assertParameter('dir', dir)
    assertParameter('gitdir', gitdir)
    assertParameter('path', path)

    const fsp = new FileSystem(fs)
    const updatedGitdir = await discoverGitdir({ fsp, dotgit: gitdir })
    return await _initSubmodule({
      fs: fsp,
      dir,
      gitdir: updatedGitdir,
      path,
    })
  } catch (err) {
    err.caller = 'git.initSubmodule'
    throw err
  }
}
