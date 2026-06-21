// @ts-check
import '../typedefs.js'

import { _listSubmodules } from '../commands/listSubmodules.js'
import { FileSystem } from '../models/FileSystem.js'
import { assertParameter } from '../utils/assertParameter.js'

/**
 * List the submodules registered in a repository's `.gitmodules` file
 *
 * @param {object} args
 * @param {FsClient} args.fs - a file system client
 * @param {string} args.dir - The [working tree](dir-vs-gitdir.md) directory path
 *
 * @returns {Promise<Array<{name: string, path: string, url: string}>>} Resolves successfully with an array of `{name, path, url}` objects
 *
 * @example
 * let submodules = await git.listSubmodules({ fs, dir: '/tutorial' })
 * console.log(submodules)
 *
 */
export async function listSubmodules({ fs, dir }) {
  try {
    assertParameter('fs', fs)
    assertParameter('dir', dir)

    return await _listSubmodules({
      fs: new FileSystem(fs),
      dir,
    })
  } catch (err) {
    err.caller = 'git.listSubmodules'
    throw err
  }
}
