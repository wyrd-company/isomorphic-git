// @ts-check
import { NotFoundError } from '../errors/NotFoundError.js'
import { GitConfigManager } from '../managers/GitConfigManager.js'
import { GitConfig } from '../models/GitConfig.js'
import { resolveSubmoduleUrl } from '../utils/resolveSubmoduleUrl.js'

import { _listSubmodules } from './listSubmodules.js'

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} args.dir
 * @param {string} args.gitdir
 * @param {string} args.path
 *
 * @returns {Promise<{name: string, path: string, url: string|void}>}
 */
export async function _initSubmodule({ fs, dir, gitdir, path }) {
  const submodules = await _listSubmodules({ fs, dir })
  const submodule = submodules.find(sm => sm.path === path)
  if (!submodule) {
    throw new NotFoundError(`submodule at path "${path}"`)
  }
  const { name } = submodule
  let url = submodule.url

  const config = await GitConfigManager.get({ fs, gitdir })

  // Relative URLs in `.gitmodules` are resolved against the superproject's
  // origin, matching git.
  if (url && (url.startsWith('./') || url.startsWith('../'))) {
    const base = await config.get('remote.origin.url')
    if (!base) {
      throw new NotFoundError(
        `remote "origin" (needed to resolve the relative submodule URL "${url}")`
      )
    }
    url = resolveSubmoduleUrl(base, url)
  }

  // Copy url (and the update strategy, if set) from `.gitmodules` into the
  // superproject config and mark the submodule active.
  const gitmodules = GitConfig.from(
    (await fs.read(`${dir}/.gitmodules`, { encoding: 'utf8' })) || ''
  )
  const update = await gitmodules.get(`submodule.${name}.update`)

  await config.set(`submodule.${name}.url`, url)
  await config.set(`submodule.${name}.active`, 'true')
  if (update) await config.set(`submodule.${name}.update`, update)
  await GitConfigManager.save({ fs, gitdir, config })

  return { name, path, url }
}
