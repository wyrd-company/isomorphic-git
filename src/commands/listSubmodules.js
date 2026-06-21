// @ts-check
import { GitConfig } from '../models/GitConfig.js'

/**
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} args.dir
 *
 * @returns {Promise<Array<{name: string, path: string, url: string}>>}
 */
export async function _listSubmodules({ fs, dir }) {
  const text = await fs.read(`${dir}/.gitmodules`, { encoding: 'utf8' })
  if (text == null) return []
  const config = GitConfig.from(text)
  const names = await config.getSubsections('submodule')
  const submodules = await Promise.all(
    names.map(async name => {
      const path = await config.get(`submodule.${name}.path`)
      const url = await config.get(`submodule.${name}.url`)
      return { name, path, url }
    })
  )
  return submodules
}
