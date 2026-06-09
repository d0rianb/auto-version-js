// git.test.js

const path = require('path')
const fs = require('fs')
const os = require('os')

const AutoGit = require('../lib/git')

// --- Helpers ---

const withTmpDir = fn => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'auto-version-git-test-'))
    try {
        return fn(dir)
    } finally {
        fs.rmSync(dir, { recursive: true, force: true })
    }
}

const createPackage = (dir, name, version, deps = {}) => {
    fs.mkdirSync(dir, { recursive: true })
    const pkg = { name, version }
    if (Object.keys(deps).length > 0) pkg.dependencies = deps
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(pkg, null, 4))
}

/** Mock all git methods needed for a release flow */
const mockRelease = (overrides = {}) => ({
    isGitRepo: vi.spyOn(AutoGit, 'isGitRepo').mockReturnValue(true),
    stageAll: vi.spyOn(AutoGit, 'stageAll').mockReturnValue(undefined),
    stageFiles: vi.spyOn(AutoGit, 'stageFiles').mockReturnValue(undefined),
    commit: vi.spyOn(AutoGit, 'commit').mockReturnValue(undefined),
    tag: vi.spyOn(AutoGit, 'tag').mockReturnValue(overrides.tagName || '1.2.3'),
    push: vi.spyOn(AutoGit, 'push').mockReturnValue(undefined),
    ...overrides
})

/** Mock execSafe so tag() passes the "already exists?" check + the actual git tag call */
const mockTagExec = () => vi.spyOn(AutoGit, 'execSafe')
    .mockImplementationOnce(() => { throw new Error('not found') }) // rev-parse => tag doesn't exist
    .mockImplementationOnce(() => '') // git tag -a

// --- Tests ---

describe('AutoGit', () => {
    afterEach(() => vi.restoreAllMocks())

    // --- Simple git queries ---

    describe('isGitRepo', () => {
        it('returns true when inside a repo', () => {
            vi.spyOn(AutoGit, 'execSafe').mockReturnValue('true')
            expect(AutoGit.isGitRepo('/some/path')).toBe(true)
        })

        it('returns false when not a repo', () => {
            vi.spyOn(AutoGit, 'execSafe').mockImplementation(() => { throw new Error() })
            expect(AutoGit.isGitRepo('/tmp/nope')).toBe(false)
        })
    })

    describe('isClean', () => {
        it('returns true when porcelain is empty', () => {
            vi.spyOn(AutoGit, 'execSafe').mockReturnValue('')
            expect(AutoGit.isClean('/p')).toBe(true)
        })

        it('returns false when there are changes', () => {
            vi.spyOn(AutoGit, 'execSafe').mockReturnValue(' M file')
            expect(AutoGit.isClean('/p')).toBe(false)
        })
    })

    // --- Workspace detection ---

    describe('isWorkspace', () => {
        it('detects pnpm-workspace.yaml presence', () => withTmpDir(dir => {
            expect(AutoGit.isWorkspace(dir)).toBe(false)
            fs.writeFileSync(path.join(dir, 'pnpm-workspace.yaml'), 'packages:\n  - "packages/*"\n')
            expect(AutoGit.isWorkspace(dir)).toBe(true)
        }))
    })

    // --- Workspace packages ---

    describe('getWorkspacePackages', () => {
        it('uses pnpm CLI and filters out root', () => {
            const dir = '/project'
            vi.spyOn(AutoGit, 'exec').mockReturnValue(JSON.stringify([
                { path: '/project', name: 'root' },
                { path: '/project/packages/core', name: '@s/core' }
            ]))

            expect(AutoGit.getWorkspacePackages(dir)).toEqual(['/project/packages/core'])
        })

        it('falls back to YAML with wildcard glob', () => withTmpDir(dir => {
            vi.spyOn(AutoGit, 'exec').mockImplementation(() => { throw new Error() })
            fs.writeFileSync(path.join(dir, 'pnpm-workspace.yaml'), 'packages:\n  - "packages/*"\n')
            createPackage(path.join(dir, 'packages/a'), 'a', '1.0.0')
            createPackage(path.join(dir, 'packages/b'), 'b', '1.0.0')
            fs.mkdirSync(path.join(dir, 'packages/empty'), { recursive: true })

            const result = AutoGit.getWorkspacePackages(dir)
            expect(result).toHaveLength(2)
            expect(result).toContain(path.resolve(dir, 'packages/a'))
            expect(result).toContain(path.resolve(dir, 'packages/b'))
        }))

        it('supports explicit paths (no wildcard)', () => withTmpDir(dir => {
            vi.spyOn(AutoGit, 'exec').mockImplementation(() => { throw new Error() })
            fs.writeFileSync(path.join(dir, 'pnpm-workspace.yaml'), 'packages:\n  - "packages/core"\n')
            createPackage(path.join(dir, 'packages/core'), 'core', '1.0.0')

            expect(AutoGit.getWorkspacePackages(dir)).toHaveLength(1)
        }))

        it('supports recursive ** globs', () => withTmpDir(dir => {
            vi.spyOn(AutoGit, 'exec').mockImplementation(() => { throw new Error() })
            fs.writeFileSync(path.join(dir, 'pnpm-workspace.yaml'), 'packages:\n  - "packages/**"\n')
            createPackage(path.join(dir, 'packages/a'), 'a', '1.0.0')
            createPackage(path.join(dir, 'packages/nested/b'), 'b', '1.0.0')

            const result = AutoGit.getWorkspacePackages(dir)
            expect(result).toHaveLength(2)
        }))

        it('skips comments and ! exclusion patterns', () => withTmpDir(dir => {
            vi.spyOn(AutoGit, 'exec').mockImplementation(() => { throw new Error() })
            fs.writeFileSync(path.join(dir, 'pnpm-workspace.yaml'),
                '# header\npackages:\n  # comment\n  - "packages/*"\n  - "!packages/skip"\n')
            createPackage(path.join(dir, 'packages/a'), 'a', '1.0.0')

            const result = AutoGit.getWorkspacePackages(dir)
            expect(result).toContain(path.resolve(dir, 'packages/a'))
        }))

        it('returns [] when no pnpm-workspace.yaml', () => withTmpDir(dir => {
            vi.spyOn(AutoGit, 'exec').mockImplementation(() => { throw new Error() })
            expect(AutoGit.getWorkspacePackages(dir)).toEqual([])
        }))
    })

    // --- Bump workspace ---

    describe('bumpWorkspace', () => {
        const setupWorkspace = (dir, packages) => {
            packages.forEach(p => createPackage(path.join(dir, p.dir), p.name, p.version, p.deps))
            vi.spyOn(AutoGit, 'getWorkspacePackages').mockReturnValue(
                packages.map(p => path.join(dir, p.dir))
            )
        }

        it.each([
            ['patch', '1.2.3', '1.2.4'],
            ['minor', '1.2.3', '1.3.0'],
            ['major', '1.2.3', '2.0.0'],
        ])('bumps at %s level: %s => %s', (level, from, expected) => withTmpDir(dir => {
            setupWorkspace(dir, [{ dir: 'packages/a', name: 'a', version: from }])
            expect(AutoGit.bumpWorkspace(level, dir)['a']).toBe(expected)
        }))

        it('updates internal cross-references preserving range prefix', () => withTmpDir(dir => {
            setupWorkspace(dir, [
                { dir: 'packages/core', name: '@s/core', version: '1.0.0' },
                { dir: 'packages/cli', name: '@s/cli', version: '1.0.0', deps: { '@s/core': '~1.0.0' } }
            ])

            AutoGit.bumpWorkspace('minor', dir)

            const cli = JSON.parse(fs.readFileSync(path.join(dir, 'packages/cli/package.json'), 'utf-8'))
            expect(cli.dependencies['@s/core']).toBe('~1.1.0')
        }))

        it('returns {} when no packages', () => {
            vi.spyOn(AutoGit, 'getWorkspacePackages').mockReturnValue([])
            expect(AutoGit.bumpWorkspace('patch')).toEqual({})
        })
    })

    // --- Tag ---

    describe('tag', () => {
        it.each([
            ['1.2.3', '', '1.2.3'],
            ['1.2.3', 'v', 'v1.2.3'],
            ['1.2.3', 'release-', 'release-1.2.3'],
        ])('tag("%s", "%s") => "%s"', (version, prefix, expected) => {
            mockTagExec()
            expect(AutoGit.tag(version, prefix)).toBe(expected)
        })

        it('calls git tag -a with annotated message', () => {
            const spy = mockTagExec()
            AutoGit.tag('1.2.3')
            expect(spy).toHaveBeenCalledWith('git', ['tag', '-a', '1.2.3', '-m', 'Release 1.2.3'], undefined)
        })

        it('throws when tag already exists', () => {
            vi.spyOn(AutoGit, 'execSafe').mockReturnValue('abc123')
            expect(() => AutoGit.tag('1.2.3')).toThrow('already exists')
        })
    })

    // --- Commit ---

    describe('commit', () => {
        it.each([
            [{ version: '1.2.3' }, '1.2.3'],
            [{ version: '1.2.3', prefix: 'v' }, 'v1.2.3'],
            [{ version: '1.2.3', message: 'custom msg' }, 'custom msg'],
            [{ version: '1.2.3', prefix: 'v', message: 'override' }, 'override'],
        ])('commit(%j) => message "%s"', (options, expectedMsg) => {
            const spy = vi.spyOn(AutoGit, 'execSafe').mockReturnValue('')
            AutoGit.commit(options)
            expect(spy).toHaveBeenCalledWith('git', ['commit', '-m', expectedMsg], undefined)
        })

        it('is safe against shell injection', () => {
            const spy = vi.spyOn(AutoGit, 'execSafe').mockReturnValue('')
            AutoGit.commit({ version: '1.0.0', message: '$(rm -rf /)' })
            expect(spy).toHaveBeenCalledWith('git', ['commit', '-m', '$(rm -rf /)'], undefined)
        })
    })

    // --- Push ---

    describe('push', () => {
        it('throws when no remote configured', () => {
            vi.spyOn(AutoGit, 'execSafe').mockReturnValue('')
            expect(() => AutoGit.push()).toThrow('No git remote configured')
        })

        it('pushes commits and tags', () => {
            const spy = vi.spyOn(AutoGit, 'execSafe')
                .mockReturnValueOnce('origin')
                .mockReturnValueOnce('')
                .mockReturnValueOnce('')
            AutoGit.push('/p')
            expect(spy).toHaveBeenCalledWith('git', ['push'], '/p')
            expect(spy).toHaveBeenCalledWith('git', ['push', '--tags'], '/p')
        })
    })

    // --- Stage files ---

    describe('stageFiles', () => {
        it('stages specific files with --', () => {
            const spy = vi.spyOn(AutoGit, 'execSafe').mockReturnValue('')
            AutoGit.stageFiles(['a.json', 'b.json'], '/p')
            expect(spy).toHaveBeenCalledWith('git', ['add', '--', 'a.json', 'b.json'], '/p')
        })
    })

    // --- Release ---

    describe('release', () => {
        it('throws outside a git repo', () => {
            vi.spyOn(AutoGit, 'isGitRepo').mockReturnValue(false)
            expect(() => AutoGit.release({ version: '1.0.0' })).toThrow('Not a git repository')
        })

        it('stages all, commits, and tags by default', () => {
            const m = mockRelease()
            const tag = AutoGit.release({ version: '1.2.3' })

            expect(m.stageAll).toHaveBeenCalled()
            expect(m.commit).toHaveBeenCalled()
            expect(m.tag).toHaveBeenCalledWith('1.2.3', '', undefined)
            expect(tag).toBe('1.2.3')
        })

        it('uses stageFiles when files are provided', () => {
            const m = mockRelease()
            AutoGit.release({ version: '1.2.3' }, ['package.json'])

            expect(m.stageFiles).toHaveBeenCalledWith(['package.json'], undefined)
            expect(m.stageAll).not.toHaveBeenCalled()
        })

        it('pushes only when push=true', () => {
            const m = mockRelease()
            AutoGit.release({ version: '1.2.3', push: false })
            expect(m.push).not.toHaveBeenCalled()

            vi.restoreAllMocks()
            const m2 = mockRelease()
            AutoGit.release({ version: '1.2.3', push: true })
            expect(m2.push).toHaveBeenCalled()
        })

        it('forwards prefix to commit and tag', () => {
            const m = mockRelease({ tagName: 'v1.2.3' })
            AutoGit.release({ version: '1.2.3', prefix: 'v' })

            expect(m.tag).toHaveBeenCalledWith('1.2.3', 'v', undefined)
            expect(m.commit).toHaveBeenCalledWith(expect.objectContaining({ prefix: 'v' }))
        })
    })

    // --- Detect indentation ---

    describe('detectIndentation', () => {
        it.each([
            [2, 2],
            [4, 4],
            ['\t', '\t'],
        ])('detects indent=%s', (indent, expected) => withTmpDir(dir => {
            const f = path.join(dir, 'p.json')
            fs.writeFileSync(f, JSON.stringify({ a: 1 }, null, indent))
            expect(AutoGit.detectIndentation(f)).toBe(expected)
        }))

        it('defaults to 4 for minified JSON', () => withTmpDir(dir => {
            const f = path.join(dir, 'p.json')
            fs.writeFileSync(f, '{}')
            expect(AutoGit.detectIndentation(f)).toBe(4)
        }))
    })
})
