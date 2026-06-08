// git.test.js
const path = require('path')
const fs = require('fs')
const os = require('os')
const AutoGit = require('../lib/git')

// --- Helpers ---

const mkTmpDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'auto-version-git-test-'))
const cleanDir = dir => fs.rmSync(dir, { recursive: true, force: true })

const createPackage = (dir, name, version) => {
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name, version }, null, 4))
}

// --- Tests ---

describe('AutoGit', () => {
    describe('isGitRepo', () => {
        it('should return true when exec succeeds', () => {
            const spy = jest.spyOn(AutoGit, 'exec').mockReturnValue('true')
            expect(AutoGit.isGitRepo('/some/path')).toBe(true)
            spy.mockRestore()
        })

        it('should return false when exec throws', () => {
            const spy = jest.spyOn(AutoGit, 'exec').mockImplementation(() => { throw new Error('not a git repo') })
            expect(AutoGit.isGitRepo('/tmp/not-a-repo')).toBe(false)
            spy.mockRestore()
        })
    })

    describe('isWorkspace', () => {
        let tmpDir
        beforeEach(() => { tmpDir = mkTmpDir() })
        afterEach(() => { cleanDir(tmpDir) })

        it('should return true when pnpm-workspace.yaml exists', () => {
            fs.writeFileSync(path.join(tmpDir, 'pnpm-workspace.yaml'), 'packages:\n  - "packages/*"\n')
            expect(AutoGit.isWorkspace(tmpDir)).toBe(true)
        })

        it('should return false when pnpm-workspace.yaml is absent', () => {
            expect(AutoGit.isWorkspace(tmpDir)).toBe(false)
        })
    })

    describe('getWorkspacePackages', () => {
        let tmpDir
        beforeEach(() => { tmpDir = mkTmpDir() })
        afterEach(() => { cleanDir(tmpDir) })

        it('should use the pnpm CLI when available', () => {
            const fakePaths = [
                { path: path.join(tmpDir, 'packages/core'), name: '@scope/core' },
                { path: path.join(tmpDir, 'packages/cli'), name: '@scope/cli' }
            ]
            const spy = jest.spyOn(AutoGit, 'exec').mockReturnValue(JSON.stringify(fakePaths))

            const result = AutoGit.getWorkspacePackages(tmpDir)
            spy.mockRestore()

            expect(result).toEqual([fakePaths[0].path, fakePaths[1].path])
        })

        it('should fall back to YAML parsing when pnpm CLI is unavailable', () => {
            fs.writeFileSync(path.join(tmpDir, 'pnpm-workspace.yaml'), 'packages:\n  - "packages/*"\n')
            createPackage(path.join(tmpDir, 'packages/core'), '@scope/core', '1.0.0')
            createPackage(path.join(tmpDir, 'packages/cli'), '@scope/cli', '1.0.0')

            const spy = jest.spyOn(AutoGit, 'exec').mockImplementation(() => { throw new Error('pnpm not found') })
            const result = AutoGit.getWorkspacePackages(tmpDir)
            spy.mockRestore()

            expect(result).toHaveLength(2)
            expect(result).toContain(path.resolve(tmpDir, 'packages/core'))
            expect(result).toContain(path.resolve(tmpDir, 'packages/cli'))
        })

        it('should ignore directories without a package.json', () => {
            fs.writeFileSync(path.join(tmpDir, 'pnpm-workspace.yaml'), 'packages:\n  - "packages/*"\n')
            createPackage(path.join(tmpDir, 'packages/core'), '@scope/core', '1.0.0')
            fs.mkdirSync(path.join(tmpDir, 'packages/empty'), { recursive: true }) // no package.json

            const spy = jest.spyOn(AutoGit, 'exec').mockImplementation(() => { throw new Error() })
            const result = AutoGit.getWorkspacePackages(tmpDir)
            spy.mockRestore()

            expect(result).toHaveLength(1)
            expect(result[0]).toBe(path.resolve(tmpDir, 'packages/core'))
        })

        it('should support packages listed without a wildcard', () => {
            fs.writeFileSync(path.join(tmpDir, 'pnpm-workspace.yaml'), 'packages:\n  - "packages/core"\n')
            createPackage(path.join(tmpDir, 'packages/core'), '@scope/core', '1.0.0')

            const spy = jest.spyOn(AutoGit, 'exec').mockImplementation(() => { throw new Error() })
            const result = AutoGit.getWorkspacePackages(tmpDir)
            spy.mockRestore()

            expect(result).toHaveLength(1)
        })

        it('should return an empty array when pnpm-workspace.yaml is absent', () => {
            const spy = jest.spyOn(AutoGit, 'exec').mockImplementation(() => { throw new Error() })
            expect(AutoGit.getWorkspacePackages(tmpDir)).toEqual([])
            spy.mockRestore()
        })
    })

    describe('bumpWorkspace', () => {
        let tmpDir
        beforeEach(() => { tmpDir = mkTmpDir() })
        afterEach(() => { cleanDir(tmpDir) })

        const setup = packages => {
            packages.forEach(({ dir, name, version }) => createPackage(path.join(tmpDir, dir), name, version))
            return jest.spyOn(AutoGit, 'getWorkspacePackages').mockReturnValue(
                packages.map(p => path.join(tmpDir, p.dir))
            )
        }

        it('should bump all packages at patch level', () => {
            const spy = setup([
                { dir: 'packages/core', name: '@scope/core', version: '1.0.0' },
                { dir: 'packages/cli', name: '@scope/cli', version: '1.2.3' }
            ])

            const results = AutoGit.bumpWorkspace('patch', tmpDir)
            spy.mockRestore()

            expect(results['@scope/core']).toBe('1.0.1')
            expect(results['@scope/cli']).toBe('1.2.4')
        })

        it('should bump all packages at minor level and reset patch', () => {
            const spy = setup([{ dir: 'packages/core', name: '@scope/core', version: '1.2.3' }])
            const results = AutoGit.bumpWorkspace('minor', tmpDir)
            spy.mockRestore()

            expect(results['@scope/core']).toBe('1.3.0')
        })

        it('should bump all packages at major level and reset minor + patch', () => {
            const spy = setup([{ dir: 'packages/core', name: '@scope/core', version: '1.2.3' }])
            const results = AutoGit.bumpWorkspace('major', tmpDir)
            spy.mockRestore()

            expect(results['@scope/core']).toBe('2.0.0')
        })

        it('should write the new version to the package.json file', () => {
            const spy = setup([{ dir: 'packages/core', name: '@scope/core', version: '1.0.0' }])
            AutoGit.bumpWorkspace('patch', tmpDir)
            spy.mockRestore()

            const written = JSON.parse(fs.readFileSync(path.join(tmpDir, 'packages/core/package.json'), 'utf-8'))
            expect(written.version).toBe('1.0.1')
        })

        it('should return an empty object when there are no packages', () => {
            const spy = jest.spyOn(AutoGit, 'getWorkspacePackages').mockReturnValue([])
            const results = AutoGit.bumpWorkspace('patch', tmpDir)
            spy.mockRestore()

            expect(results).toEqual({})
        })
    })

    describe('tag', () => {
        it('should use "v" as the default prefix', () => {
            const spy = jest.spyOn(AutoGit, 'exec').mockReturnValue('')
            const tagName = AutoGit.tag('1.2.3')
            spy.mockRestore()

            expect(tagName).toBe('v1.2.3')
        })

        it('should support a custom prefix', () => {
            const spy = jest.spyOn(AutoGit, 'exec').mockReturnValue('')
            const tagName = AutoGit.tag('1.2.3', 'release-')
            spy.mockRestore()

            expect(tagName).toBe('release-1.2.3')
        })

        it('should support an empty prefix', () => {
            const spy = jest.spyOn(AutoGit, 'exec').mockReturnValue('')
            const tagName = AutoGit.tag('1.2.3', '')
            spy.mockRestore()

            expect(tagName).toBe('1.2.3')
        })

        it('should call git tag with the annotated flag', () => {
            const spy = jest.spyOn(AutoGit, 'exec').mockReturnValue('')
            AutoGit.tag('1.2.3')
            spy.mockRestore()

            expect(spy).toHaveBeenCalledWith(expect.stringContaining('git tag -a v1.2.3'), undefined)
        })
    })

    describe('commit', () => {
        it('should default the message to "{prefix}{version}"', () => {
            const spy = jest.spyOn(AutoGit, 'exec').mockReturnValue('')
            AutoGit.commit({ version: '1.2.3' })
            spy.mockRestore()

            expect(spy).toHaveBeenCalledWith(expect.stringContaining('"v1.2.3"'), undefined)
        })

        it('should use a custom prefix in the auto message', () => {
            const spy = jest.spyOn(AutoGit, 'exec').mockReturnValue('')
            AutoGit.commit({ version: '1.2.3', prefix: 'release-' })
            spy.mockRestore()

            expect(spy).toHaveBeenCalledWith(expect.stringContaining('"release-1.2.3"'), undefined)
        })

        it('should use the custom message when provided', () => {
            const spy = jest.spyOn(AutoGit, 'exec').mockReturnValue('')
            AutoGit.commit({ version: '1.2.3', message: 'chore: bump version' })
            spy.mockRestore()

            expect(spy).toHaveBeenCalledWith(expect.stringContaining('"chore: bump version"'), undefined)
        })

        it('should ignore prefix when a custom message is provided', () => {
            const spy = jest.spyOn(AutoGit, 'exec').mockReturnValue('')
            AutoGit.commit({ version: '1.2.3', prefix: 'release-', message: 'custom' })
            spy.mockRestore()

            expect(spy).toHaveBeenCalledWith(expect.stringContaining('"custom"'), undefined)
            expect(spy).not.toHaveBeenCalledWith(expect.stringContaining('release-'), undefined)
        })
    })

    describe('release', () => {
        it('should throw when not in a git repository', () => {
            const spy = jest.spyOn(AutoGit, 'isGitRepo').mockReturnValue(false)
            expect(() => AutoGit.release({ version: '1.2.3' })).toThrow('Not a git repository')
            spy.mockRestore()
        })

        it('should run stage, commit, and tag in sequence', () => {
            const spyIsGit  = jest.spyOn(AutoGit, 'isGitRepo').mockReturnValue(true)
            const spyStage  = jest.spyOn(AutoGit, 'stageAll').mockReturnValue(undefined)
            const spyCommit = jest.spyOn(AutoGit, 'commit').mockReturnValue(undefined)
            const spyTag    = jest.spyOn(AutoGit, 'tag').mockReturnValue('v1.2.3')

            const tagName = AutoGit.release({ version: '1.2.3' })

            expect(spyStage).toHaveBeenCalled()
            expect(spyCommit).toHaveBeenCalled()
            expect(spyTag).toHaveBeenCalledWith('1.2.3', 'v', undefined)
            expect(tagName).toBe('v1.2.3')

            spyIsGit.mockRestore()
            spyStage.mockRestore()
            spyCommit.mockRestore()
            spyTag.mockRestore()
        })

        it('should push when the push option is true', () => {
            const spyIsGit  = jest.spyOn(AutoGit, 'isGitRepo').mockReturnValue(true)
            const spyStage  = jest.spyOn(AutoGit, 'stageAll').mockReturnValue(undefined)
            const spyCommit = jest.spyOn(AutoGit, 'commit').mockReturnValue(undefined)
            const spyTag    = jest.spyOn(AutoGit, 'tag').mockReturnValue('v1.2.3')
            const spyPush   = jest.spyOn(AutoGit, 'push').mockReturnValue(undefined)

            AutoGit.release({ version: '1.2.3', push: true })

            expect(spyPush).toHaveBeenCalled()

            spyIsGit.mockRestore()
            spyStage.mockRestore()
            spyCommit.mockRestore()
            spyTag.mockRestore()
            spyPush.mockRestore()
        })

        it('should not push when push is false', () => {
            const spyIsGit  = jest.spyOn(AutoGit, 'isGitRepo').mockReturnValue(true)
            const spyStage  = jest.spyOn(AutoGit, 'stageAll').mockReturnValue(undefined)
            const spyCommit = jest.spyOn(AutoGit, 'commit').mockReturnValue(undefined)
            const spyTag    = jest.spyOn(AutoGit, 'tag').mockReturnValue('v1.2.3')
            const spyPush   = jest.spyOn(AutoGit, 'push').mockReturnValue(undefined)

            AutoGit.release({ version: '1.2.3', push: false })

            expect(spyPush).not.toHaveBeenCalled()

            spyIsGit.mockRestore()
            spyStage.mockRestore()
            spyCommit.mockRestore()
            spyTag.mockRestore()
            spyPush.mockRestore()
        })

        it('should forward the prefix to commit and tag', () => {
            const spyIsGit  = jest.spyOn(AutoGit, 'isGitRepo').mockReturnValue(true)
            const spyStage  = jest.spyOn(AutoGit, 'stageAll').mockReturnValue(undefined)
            const spyCommit = jest.spyOn(AutoGit, 'commit').mockReturnValue(undefined)
            const spyTag    = jest.spyOn(AutoGit, 'tag').mockReturnValue('release-1.2.3')

            AutoGit.release({ version: '1.2.3', prefix: 'release-' })

            expect(spyTag).toHaveBeenCalledWith('1.2.3', 'release-', undefined)
            expect(spyCommit).toHaveBeenCalledWith(expect.objectContaining({ prefix: 'release-' }))

            spyIsGit.mockRestore()
            spyStage.mockRestore()
            spyCommit.mockRestore()
            spyTag.mockRestore()
        })
    })
})
