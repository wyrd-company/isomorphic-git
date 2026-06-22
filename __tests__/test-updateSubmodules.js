/* eslint-env node, browser, jasmine */
import {
  clone,
  updateSubmodules,
  getSubmoduleStatus,
  getConfig,
} from 'isomorphic-git'
import http from 'isomorphic-git/http'

import { makeFixture } from './__helpers__/FixtureFS.js'

// this is so it works with either Node local tests or Browser WAN tests
const localhost =
  typeof window === 'undefined' ? 'localhost' : window.location.hostname

describe('updateSubmodules', () => {
  it('inits (resolving a relative url) and checks out a submodule', async () => {
    // Setup: clone a superproject whose .gitmodules points at `../test-clone.git`
    const { fs, dir, gitdir } = await makeFixture('test-update-submodules')
    await clone({
      fs,
      http,
      dir,
      gitdir,
      url: `http://${localhost}:8888/test-recurse-superproject.git`,
    })
    // The fresh clone has not initialized the submodule yet.
    expect(
      await getConfig({ fs, dir, gitdir, path: 'submodule.lib.url' })
    ).toBeUndefined()

    // Test
    const updated = await updateSubmodules({
      fs,
      http,
      dir,
      gitdir,
      init: true,
    })
    expect(updated).toEqual([
      {
        name: 'lib',
        path: 'lib',
        url: `http://${localhost}:8888/test-clone.git`,
        oid: '97c024f73eaab2781bf3691597bc7c833cb0e22f',
      },
    ])
    // The relative url has been resolved into the local config.
    expect(
      await getConfig({ fs, dir, gitdir, path: 'submodule.lib.url' })
    ).toEqual(`http://${localhost}:8888/test-clone.git`)

    // The submodule is populated at the recorded commit.
    const status = await getSubmoduleStatus({ fs, dir, gitdir, path: 'lib' })
    expect(status.status).toEqual('initialized')
    expect(status.head).toEqual('97c024f73eaab2781bf3691597bc7c833cb0e22f')
  })

  it('skips an uninitialized submodule when init is false', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-update-submodules')
    await clone({
      fs,
      http,
      dir,
      gitdir,
      url: `http://${localhost}:8888/test-recurse-superproject.git`,
    })
    // Test
    const updated = await updateSubmodules({ fs, http, dir, gitdir })
    expect(updated).toEqual([])
    const status = await getSubmoduleStatus({ fs, dir, gitdir, path: 'lib' })
    expect(status.status).toEqual('uninitialized')
  })
})
