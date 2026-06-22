// @ts-check
import '../typedefs.js'

import { _addSubmodule } from '../commands/addSubmodule.js'
import { FileSystem } from '../models/FileSystem.js'
import { assertParameter } from '../utils/assertParameter.js'
import { discoverGitdir } from '../utils/discoverGitdir.js'
import { join } from '../utils/join.js'

/**
 * Add a submodule to a repository
 *
 * Clones `url` into `path`, keeping the submodule's git directory under the
 * superproject's `.git/modules/<name>`, registers it in `.gitmodules` and the
 * superproject config, and stages both `.gitmodules` and the gitlink.
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
 * @param {string} args.url - The URL of the submodule repository
 * @param {string} args.path - The path the submodule will be checked out at, relative to `dir`
 * @param {string} [args.name] - The name of the submodule in `.gitmodules`. Defaults to `path`.
 * @param {string} [args.ref] - Which branch to checkout. By default this is the remote's default branch.
 * @param {string} [args.corsProxy] - Optional [CORS proxy](https://www.npmjs.com/%40isomorphic-git/cors-proxy).
 * @param {Object<string, string>} [args.headers] - Additional headers to include in HTTP requests
 * @param {object} [args.cache] - a [cache](cache.md) object
 *
 * @returns {Promise<{name: string, path: string, url: string, oid: string}>} Resolves successfully with the added submodule's `{name, path, url, oid}`
 *
 * @example
 * await git.addSubmodule({
 *   fs,
 *   http,
 *   dir: '/tutorial',
 *   url: 'https://github.com/isomorphic-git/lightning-fs',
 *   path: 'vendor/lightning-fs',
 * })
 *
 */
export async function addSubmodule({
  fs,
  http,
  onProgress,
  onMessage,
  onAuth,
  onAuthFailure,
  onAuthSuccess,
  dir,
  gitdir = join(dir, '.git'),
  url,
  path,
  name = path,
  ref,
  corsProxy,
  headers = {},
  cache = {},
}) {
  try {
    assertParameter('fs', fs)
    assertParameter('http', http)
    assertParameter('dir', dir)
    assertParameter('gitdir', gitdir)
    assertParameter('url', url)
    assertParameter('path', path)

    const fsp = new FileSystem(fs)
    const updatedGitdir = await discoverGitdir({ fsp, dotgit: gitdir })
    return await _addSubmodule({
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
      url,
      path,
      name,
      ref,
      corsProxy,
      headers,
    })
  } catch (err) {
    err.caller = 'git.addSubmodule'
    throw err
  }
}
