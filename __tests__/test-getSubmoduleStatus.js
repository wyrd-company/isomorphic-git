/* eslint-env node, browser, jasmine */
import { clone, getSubmoduleStatus, Errors } from 'isomorphic-git'
import http from 'isomorphic-git/http'

import { makeFixture } from './__helpers__/FixtureFS.js'

// this is so it works with either Node local tests or Browser WAN tests
const localhost =
  typeof window === 'undefined' ? 'localhost' : window.location.hostname

describe('getSubmoduleStatus', () => {
  it('reports a freshly cloned submodule as uninitialized', async () => {
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
    const status = await getSubmoduleStatus({
      fs,
      dir,
      gitdir,
      path: 'test.empty',
    })
    expect(status).toEqual({
      path: 'test.empty',
      name: 'test.empty',
      url: 'https://github.com/isomorphic-git/test.empty',
      oid: '5a8905a02e181fe1821068b8c0f48cb6633d5b81',
      head: null,
      status: 'uninitialized',
    })
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
      await getSubmoduleStatus({ fs, dir, gitdir, path: 'hello.txt' })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error instanceof Errors.NotFoundError).toBe(true)
  })
})
