/* eslint-env node, browser, jasmine */
import { listSubmodules } from 'isomorphic-git'

import { makeFixture } from './__helpers__/FixtureFS.js'

describe('listSubmodules', () => {
  it('lists the submodules defined in .gitmodules', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-listSubmodules')
    // Test
    const submodules = await listSubmodules({ fs, dir })
    expect(submodules).toEqual([
      {
        name: 'vendor/foo',
        path: 'vendor/foo',
        url: 'https://github.com/example/foo.git',
      },
      { name: 'bar', path: 'bar', url: '../bar.git' },
    ])
  })

  it('returns an empty array when there is no .gitmodules file', async () => {
    // Setup
    const { fs, dir } = await makeFixture('test-empty')
    // Test
    const submodules = await listSubmodules({ fs, dir })
    expect(submodules).toEqual([])
  })
})
