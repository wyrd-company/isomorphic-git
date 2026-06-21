/**
 * Resolve a (possibly relative) submodule URL against the superproject's URL.
 *
 * `.gitmodules` may record a submodule URL relative to the superproject's
 * remote (a leading `./` or `../`) so that the same configuration works no
 * matter where the superproject was cloned from. git resolves these against
 * the superproject's `remote.origin.url`; this mirrors that behavior.
 *
 * Non-relative URLs (absolute paths, `scheme://…`, or scp-like `host:path`)
 * are returned unchanged.
 *
 * @param {string} base - the superproject URL to resolve against
 * @param {string} url - the submodule URL from `.gitmodules`
 * @returns {string} the resolved URL
 */
export function resolveSubmoduleUrl(base, url) {
  if (!url.startsWith('./') && !url.startsWith('../')) return url

  // Split `base` into a non-path prefix (`scheme://host` or scp-like `host:`)
  // and the path portion that the relative segments are applied to.
  let prefix = ''
  let path = base
  const scheme = base.match(/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//)
  if (scheme) {
    const rest = base.slice(scheme[0].length)
    const slash = rest.indexOf('/')
    if (slash === -1) {
      prefix = base
      path = ''
    } else {
      prefix = scheme[0] + rest.slice(0, slash)
      path = rest.slice(slash)
    }
  } else {
    const scp = base.match(/^[^/]+:/)
    if (scp) {
      prefix = scp[0]
      path = base.slice(scp[0].length)
    }
  }

  const leadingSlash = path.startsWith('/')
  const segments = path.split('/').filter(segment => segment !== '')
  for (const segment of url.split('/')) {
    if (segment === '' || segment === '.') continue
    if (segment === '..') segments.pop()
    else segments.push(segment)
  }

  return prefix + (leadingSlash ? '/' : '') + segments.join('/')
}
