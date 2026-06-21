/**
 * Compute the relative path from one location to another.
 *
 * Both paths are interpreted as POSIX paths relative to the same base
 * directory (typically the root of the working tree). The result is the path
 * you would follow, starting from the `from` directory, to arrive at `to`.
 *
 * This mirrors the relative paths git itself records for submodules: the
 * gitdir pointer written into a submodule's `.git` file, and the
 * `core.worktree` value written into the submodule's config.
 *
 * @param {string} from - the directory the relative path is resolved from
 * @param {string} to - the path the relative path should point to
 * @returns {string} the relative path from `from` to `to`
 */
export function relative(from, to) {
  const fromParts = from.split('/').filter(part => part !== '' && part !== '.')
  const toParts = to.split('/').filter(part => part !== '' && part !== '.')
  let i = 0
  while (
    i < fromParts.length &&
    i < toParts.length &&
    fromParts[i] === toParts[i]
  ) {
    i++
  }
  const up = fromParts.slice(i).map(() => '..')
  const down = toParts.slice(i)
  const parts = [...up, ...down]
  return parts.length > 0 ? parts.join('/') : '.'
}
