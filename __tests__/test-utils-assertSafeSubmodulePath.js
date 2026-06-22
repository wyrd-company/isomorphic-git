/* eslint-env node, browser, jasmine */
import { assertSafeSubmodulePath, Errors } from 'isomorphic-git/internal-apis'

describe('utils/assertSafeSubmodulePath', () => {
  it('accepts safe (possibly nested) paths', () => {
    expect(() => assertSafeSubmodulePath('lib')).not.toThrow()
    expect(() => assertSafeSubmodulePath('vendor/lib')).not.toThrow()
    expect(() => assertSafeSubmodulePath('a/b/c')).not.toThrow()
  })

  it('rejects absolute paths and "." / ".." segments', () => {
    const unsafe = [
      '../escape',
      'a/../../escape',
      '/abs/escape',
      './x',
      'a/./b',
      'C:/x',
      'a\\..\\b',
      '\\abs',
      '\\\\server\\share',
    ]
    for (const value of unsafe) {
      let error = null
      try {
        assertSafeSubmodulePath(value)
      } catch (err) {
        error = err
      }
      expect(error instanceof Errors.UnsafeFilepathError).toBe(true)
    }
  })
})
