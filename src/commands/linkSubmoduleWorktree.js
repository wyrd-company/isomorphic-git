// @ts-check
import { GitConfigManager } from '../managers/GitConfigManager.js'
import { join } from '../utils/join.js'
import { relative } from '../utils/relative.js'

/**
 * Establish the two-way link between a submodule's working tree and its
 * absorbed git directory: the working tree's `.git` file points at the git
 * directory, and the git directory's `core.worktree` points back, both as
 * relative paths (what git records and what discoverGitdir expects).
 *
 * @param {object} args
 * @param {import('../models/FileSystem.js').FileSystem} args.fs
 * @param {string} args.submoduleDir - the submodule's working tree
 * @param {string} args.submoduleGitdir - the submodule's git directory
 *
 * @returns {Promise<void>}
 */
export async function _linkSubmoduleWorktree({
  fs,
  submoduleDir,
  submoduleGitdir,
}) {
  await fs.write(
    join(submoduleDir, '.git'),
    `gitdir: ${relative(submoduleDir, submoduleGitdir)}\n`,
    'utf8'
  )
  const config = await GitConfigManager.get({ fs, gitdir: submoduleGitdir })
  await config.set('core.worktree', relative(submoduleGitdir, submoduleDir))
  await GitConfigManager.save({ fs, gitdir: submoduleGitdir, config })
}
