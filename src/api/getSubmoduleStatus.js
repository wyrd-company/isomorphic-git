// @ts-check
import '../typedefs.js'

import { _getSubmoduleStatus } from '../commands/getSubmoduleStatus.js'
import { FileSystem } from '../models/FileSystem.js'
import { assertParameter } from '../utils/assertParameter.js'
import { discoverGitdir } from '../utils/discoverGitdir.js'
import { join } from '../utils/join.js'

/**
 * Get the status of a single submodule
 *
 * The possible `status` values are:
 *
 * | status            | description                                                              |
 * | ----------------- | ------------------------------------------------------------------------ |
 * | `"uninitialized"` | the submodule's git directory has not been created yet                    |
 * | `"initialized"`   | the submodule is populated and its HEAD matches the recorded gitlink      |
 * | `"modified"`      | the submodule is populated but its HEAD differs from the recorded gitlink |
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} args.dir - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string} args.path - The path of the submodule, relative to `dir`
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<{path: string, name: string, url: string|void, oid: string|null, head: string|null, status: 'uninitialized'|'initialized'|'modified'}>} Resolves successfully with the submodule's status
 *
 * @example
 * let status = await git.getSubmoduleStatus({ fs, dir: '/tutorial', path: 'vendor/lib' })
 * console.log(status)
 *
 */
export async function getSubmoduleStatus({
  fs,
  dir,
  gitdir = join(dir, '.git'),
  path,
  cache = {},
}) {
  try {
    assertParameter('fs', fs)
    assertParameter('dir', dir)
    assertParameter('gitdir', gitdir)
    assertParameter('path', path)

    const fsp = new FileSystem(fs)
    const updatedGitdir = await discoverGitdir({ fsp, dotgit: gitdir })
    return await _getSubmoduleStatus({
      fs: fsp,
      cache,
      dir,
      gitdir: updatedGitdir,
      path,
    })
  } catch (err) {
    err.caller = 'git.getSubmoduleStatus'
    throw err
  }
}
