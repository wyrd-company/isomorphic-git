/* eslint-env node, browser, jasmine */
import { resolveSubmoduleUrl } from 'isomorphic-git/internal-apis'

describe('utils/resolveSubmoduleUrl', () => {
  it('returns non-relative URLs unchanged', () => {
    expect(resolveSubmoduleUrl('https://h/a/super', 'https://h/x.git')).toEqual(
      'https://h/x.git'
    )
    expect(resolveSubmoduleUrl('https://h/a/super', 'git@h:x/y.git')).toEqual(
      'git@h:x/y.git'
    )
    expect(resolveSubmoduleUrl('https://h/a/super', '/abs/x.git')).toEqual(
      '/abs/x.git'
    )
  })

  it('resolves ./ and ../ against an https base', () => {
    expect(
      resolveSubmoduleUrl('https://github.com/foo/super', '../bar')
    ).toEqual('https://github.com/foo/bar')
    expect(
      resolveSubmoduleUrl('https://github.com/foo/super', './bar')
    ).toEqual('https://github.com/foo/super/bar')
    expect(
      resolveSubmoduleUrl('https://github.com/foo/super', '../../bar')
    ).toEqual('https://github.com/bar')
  })

  it('resolves against an scp-like base', () => {
    expect(resolveSubmoduleUrl('git@github.com:foo/super', '../bar')).toEqual(
      'git@github.com:foo/bar'
    )
  })

  it('resolves against a local path base', () => {
    expect(resolveSubmoduleUrl('/a/b/super', '../sub')).toEqual('/a/b/sub')
  })
})
