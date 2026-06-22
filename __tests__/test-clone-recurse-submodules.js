/* eslint-env node, browser, jasmine */
import { clone, getSubmoduleStatus } from 'isomorphic-git'
import http from 'isomorphic-git/http'

import { makeFixture } from './__helpers__/FixtureFS.js'

// this is so it works with either Node local tests or Browser WAN tests
const localhost =
  typeof window === 'undefined' ? 'localhost' : window.location.hostname

describe('clone recurseSubmodules', () => {
  it('clones and checks out submodules recursively', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture(
      'test-clone-recurse-submodules'
    )
    // Test
    await clone({
      fs,
      http,
      dir,
      gitdir,
      url: `http://${localhost}:8888/test-recurse-superproject.git`,
      recurseSubmodules: true,
    })
    // The submodule was cloned and checked out at the recorded commit.
    expect(await fs.exists(`${dir}/lib/.git`)).toBe(true)
    const status = await getSubmoduleStatus({ fs, dir, gitdir, path: 'lib' })
    expect(status.status).toEqual('initialized')
    expect(status.head).toEqual('97c024f73eaab2781bf3691597bc7c833cb0e22f')
  })
})
