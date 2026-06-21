// @ts-check
import { NotFoundError } from '../errors/NotFoundError.js'
import { GitIndexManager } from '../managers/GitIndexManager.js'
import { GitRefManager } from '../managers/GitRefManager.js'
import { discoverGitdir } from '../utils/discoverGitdir.js'
import { join } from '../utils/join.js'

import { _listSubmodules } from './listSubmodules.js'

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {object} args.cache
 * @param {string} args.dir
 * @param {string} args.gitdir
 * @param {string} args.path
 *
 * @returns {Promise<{path: string, name: string, url: string|void, oid: string|null, head: string|null, status: 'uninitialized'|'initialized'|'modified'}>}
 */
export async function _getSubmoduleStatus({ fs, cache, dir, gitdir, path }) {
  // Look the submodule up in .gitmodules so we know its name and url.
  const submodules = await _listSubmodules({ fs, dir })
  const submodule = submodules.find(sm => sm.path === path)
  if (!submodule) {
    throw new NotFoundError(`submodule at path "${path}"`)
  }

  // The commit the superproject expects the submodule to be checked out at is
  // recorded as a gitlink entry in the index.
  const oid = await GitIndexManager.acquire(
    { fs, gitdir, cache },
    async function (index) {
      const entry = index.entries.find(entry => entry.path === path)
      return entry ? entry.oid : null
    }
  )

  // A submodule is only populated once its git directory has been created.
  const dotgit = join(dir, path, '.git')
  if (!(await fs.exists(dotgit))) {
    return {
      path,
      name: submodule.name,
      url: submodule.url,
      oid,
      head: null,
      status: 'uninitialized',
    }
  }

  // Resolve the submodule's own git directory and read its current HEAD.
  const submoduleGitdir = await discoverGitdir({ fsp: fs, dotgit })
  const head = await GitRefManager.resolve({
    fs,
    gitdir: submoduleGitdir,
    ref: 'HEAD',
  })

  return {
    path,
    name: submodule.name,
    url: submodule.url,
    oid,
    head,
    status: head === oid ? 'initialized' : 'modified',
  }
}
