/* eslint-env node, browser, jasmine */
import * as path from 'path/posix'

import { relative } from 'isomorphic-git/internal-apis'

describe('utils/relative', () => {
  it('computes the relative paths git records for submodules', () => {
    // The gitdir pointer written into a submodule's `.git` file.
    expect(relative('vendor/sub', '.git/modules/vendor/sub')).toEqual(
      '../../.git/modules/vendor/sub'
    )
    // The `core.worktree` value written into the submodule's config.
    expect(relative('.git/modules/vendor/sub', 'vendor/sub')).toEqual(
      '../../../../vendor/sub'
    )
  })

  it('handles descending, ascending, sibling, and identical paths', () => {
    expect(relative('a', 'a/b/c')).toEqual('b/c')
    expect(relative('a/b/c', 'a')).toEqual('../..')
    expect(relative('a/b', 'a/c')).toEqual('../c')
    expect(relative('a', 'a')).toEqual('.')
  })

  it('ignores leading "./" and trailing slashes', () => {
    expect(relative('./a/', 'a/b')).toEqual('b')
    expect(relative('a/./b', 'a/b/c')).toEqual('c')
  })

  it('matches path.posix.relative for relative inputs', () => {
    const fixtures = [
      ['vendor/sub', '.git/modules/vendor/sub'],
      ['.git/modules/vendor/sub', 'vendor/sub'],
      ['a/b/c', 'a/b/d'],
      ['a/b', 'a/b/c/d'],
      ['a/b/c/d', 'a/b'],
    ]
    for (const [from, to] of fixtures) {
      expect(relative(from, to)).toEqual(path.relative(from, to))
    }
  })
})
