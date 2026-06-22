// @ts-check
import '../typedefs.js'

import { _updateSubmodules } from '../commands/updateSubmodules.js'
import { FileSystem } from '../models/FileSystem.js'
import { assertParameter } from '../utils/assertParameter.js'
import { discoverGitdir } from '../utils/discoverGitdir.js'
import { join } from '../utils/join.js'

/**
 * Update a repository's submodules
 *
 * For each registered submodule (optionally filtered by `paths`), clones it
 * (keeping its git directory under `.git/modules/<name>`) if it has not been
 * cloned yet, otherwise fetches it, then checks out the commit recorded by the
 * superproject as a detached HEAD — matching `git submodule update`.
 *
 * Submodules are processed in order and the update is not transactional: if
 * one fails (for example its recorded commit was not fetched), the returned
 * promise rejects and any submodules already updated remain updated.
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {HttpClient} args.http - an HTTP client
 * @param {ProgressCallback} [args.onProgress] - optional progress event callback
 * @param {MessageCallback} [args.onMessage] - optional message event callback
 * @param {AuthCallback} [args.onAuth] - optional auth fill callback
 * @param {AuthFailureCallback} [args.onAuthFailure] - optional auth rejected callback
 * @param {AuthSuccessCallback} [args.onAuthSuccess] - optional auth approved callback
 * @param {string} args.dir - The [working tree](dir-vs-gitdir.md) directory path
 * @param {string} [args.gitdir=join(dir,'.git')] - [required] The [git directory](dir-vs-gitdir.md) path
 * @param {string[]} [args.paths] - Only update the submodules at these paths. Defaults to all.
 * @param {boolean} [args.init = false] - Initialize uninitialized submodules before updating them.
 * @param {boolean} [args.recursive = false] - Recurse into submodules of submodules.
 * @param {string} [args.corsProxy] - Optional [CORS proxy](https://www.npmjs.com/%40isomorphic-git/cors-proxy).
 * @param {Object<string, string>} [args.headers] - Additional headers to include in HTTP requests
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<Array<{name: string, path: string, url: string, oid: string}>>} Resolves with the updated submodules. Uninitialized submodules (when `init` is false) are skipped.
 *
 * @example
 * await git.updateSubmodules({ fs, http, dir: '/tutorial', init: true })
 *
 */
export async function updateSubmodules({
  fs,
  http,
  onProgress,
  onMessage,
  onAuth,
  onAuthFailure,
  onAuthSuccess,
  dir,
  gitdir = join(dir, '.git'),
  paths,
  init = false,
  recursive = false,
  corsProxy,
  headers = {},
  cache = {},
}) {
  try {
    assertParameter('fs', fs)
    assertParameter('http', http)
    assertParameter('dir', dir)
    assertParameter('gitdir', gitdir)

    const fsp = new FileSystem(fs)
    const updatedGitdir = await discoverGitdir({ fsp, dotgit: gitdir })
    return await _updateSubmodules({
      fs: fsp,
      cache,
      http,
      onProgress,
      onMessage,
      onAuth,
      onAuthFailure,
      onAuthSuccess,
      dir,
      gitdir: updatedGitdir,
      paths,
      init,
      recursive,
      corsProxy,
      headers,
    })
  } catch (err) {
    err.caller = 'git.updateSubmodules'
    throw err
  }
}
