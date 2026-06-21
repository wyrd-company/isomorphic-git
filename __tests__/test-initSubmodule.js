/* eslint-env node, browser, jasmine */
import { clone, initSubmodule, getConfig, Errors } from 'isomorphic-git'
import http from 'isomorphic-git/http'

import { makeFixture } from './__helpers__/FixtureFS.js'

// this is so it works with either Node local tests or Browser WAN tests
const localhost =
  typeof window === 'undefined' ? 'localhost' : window.location.hostname

describe('initSubmodule', () => {
  it('copies url and active into the superproject config', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-clone-submodules')
    await clone({
      fs,
      http,
      dir,
      gitdir,
      url: `http://${localhost}:8888/test-submodules.git`,
    })
    // A fresh clone has no submodule entry in the local config yet.
    expect(
      await getConfig({ fs, dir, gitdir, path: 'submodule.test.empty.url' })
    ).toBeUndefined()
    // Test
    const result = await initSubmodule({ fs, dir, gitdir, path: 'test.empty' })
    expect(result).toEqual({
      name: 'test.empty',
      path: 'test.empty',
      url: 'https://github.com/isomorphic-git/test.empty',
    })
    expect(
      await getConfig({ fs, dir, gitdir, path: 'submodule.test.empty.url' })
    ).toEqual('https://github.com/isomorphic-git/test.empty')
    expect(
      await getConfig({ fs, dir, gitdir, path: 'submodule.test.empty.active' })
    ).toEqual('true')
  })

  it('throws NotFoundError for a path that is not a submodule', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-clone-submodules')
    await clone({
      fs,
      http,
      dir,
      gitdir,
      url: `http://${localhost}:8888/test-submodules.git`,
    })
    // Test
    let error = null
    try {
      await initSubmodule({ fs, dir, gitdir, path: 'hello.txt' })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error instanceof Errors.NotFoundError).toBe(true)
  })
})
