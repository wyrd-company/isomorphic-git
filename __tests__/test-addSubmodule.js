/* eslint-env node, browser, jasmine */
import {
  init,
  addSubmodule,
  listSubmodules,
  getSubmoduleStatus,
  listFiles,
  getConfig,
  Errors,
} from 'isomorphic-git'
import http from 'isomorphic-git/http'

import { makeFixture } from './__helpers__/FixtureFS.js'

// this is so it works with either Node local tests or Browser WAN tests
const localhost =
  typeof window === 'undefined' ? 'localhost' : window.location.hostname

describe('addSubmodule', () => {
  it('adds a submodule and records the full on-disk layout', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-empty')
    await init({ fs, dir, gitdir })
    const url = `http://${localhost}:8888/test-clone.git`
    // Test
    const result = await addSubmodule({
      fs,
      http,
      dir,
      gitdir,
      url,
      path: 'vendor/lib',
    })
    expect(result).toEqual({
      name: 'vendor/lib',
      path: 'vendor/lib',
      url,
      oid: '97c024f73eaab2781bf3691597bc7c833cb0e22f',
    })

    // `.gitmodules` and the gitlink are both staged
    const files = await listFiles({ fs, gitdir })
    expect(files).toContain('.gitmodules')
    expect(files).toContain('vendor/lib')

    // `.gitmodules` parses back correctly
    expect(await listSubmodules({ fs, dir })).toEqual([
      { name: 'vendor/lib', path: 'vendor/lib', url },
    ])

    // superproject config registers the submodule
    expect(
      await getConfig({ fs, dir, gitdir, path: 'submodule.vendor/lib.url' })
    ).toEqual(url)
    expect(
      await getConfig({ fs, dir, gitdir, path: 'submodule.vendor/lib.active' })
    ).toEqual('true')

    // the working tree `.git` file points at the absorbed git directory
    const dotgit = await fs.read(`${dir}/vendor/lib/.git`, { encoding: 'utf8' })
    expect(dotgit).toMatch(/^gitdir: .*modules[\\/]vendor[\\/]lib\n$/)

    // end-to-end: the submodule is reported as initialized
    const status = await getSubmoduleStatus({
      fs,
      dir,
      gitdir,
      path: 'vendor/lib',
    })
    expect(status.status).toEqual('initialized')
    expect(status.head).toEqual('97c024f73eaab2781bf3691597bc7c833cb0e22f')
  })

  it('throws AlreadyExistsError when the submodule already exists', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-empty')
    await init({ fs, dir, gitdir })
    const url = `http://${localhost}:8888/test-clone.git`
    await addSubmodule({ fs, http, dir, gitdir, url, path: 'vendor/lib' })
    // Test
    let error = null
    try {
      await addSubmodule({ fs, http, dir, gitdir, url, path: 'vendor/lib' })
    } catch (err) {
      error = err
    }
    expect(error).not.toBeNull()
    expect(error instanceof Errors.AlreadyExistsError).toBe(true)
  })

  it('rejects a path that escapes the working tree', async () => {
    // Setup
    const { fs, dir, gitdir } = await makeFixture('test-empty')
    await init({ fs, dir, gitdir })
    const url = `http://${localhost}:8888/test-clone.git`
    // Test
    for (const path of ['../escape', 'a/../../escape', '/abs/escape']) {
      let error = null
      try {
        await addSubmodule({ fs, http, dir, gitdir, url, path })
      } catch (err) {
        error = err
      }
      expect(error).not.toBeNull()
      expect(error instanceof Errors.UnsafeFilepathError).toBe(true)
    }
  })
})
