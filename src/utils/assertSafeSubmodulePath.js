import { UnsafeFilepathError } from '../errors/UnsafeFilepathError.js'

/**
 * Reject absolute paths and any `.`/`..` segment so a caller- or
 * repository-supplied submodule path or name cannot escape the working tree or
 * the modules directory once it is fed through `join`.
 *
 * @param {string} value - a submodule path or name
 * @throws {UnsafeFilepathError} if `value` is absolute or has a `.`/`..` segment
 */
export function assertSafeSubmodulePath(value) {
  const isAbsolute = value.startsWith('/') || /^[a-zA-Z]:/.test(value)
  const segments = value.split(/[/\\]/)
  if (
    isAbsolute ||
    segments.some(segment => segment === '.' || segment === '..')
  ) {
    throw new UnsafeFilepathError(value)
  }
}
