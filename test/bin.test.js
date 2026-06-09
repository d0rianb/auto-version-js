const { parseArgs, run } = require('../bin/auto-version')

// --- Helpers ---

const createDeps = (overrides = {}) => {
    const AutoGit = {
        isGitRepo: vi.fn().mockReturnValue(true),
        isClean: vi.fn().mockReturnValue(true),
        bumpWorkspace: vi.fn(),
        getWorkspacePackages: vi.fn().mockReturnValue([]),
        stageAll: vi.fn(),
        stageFiles: vi.fn(),
        commit: vi.fn(),
        tag: vi.fn(),
        release: vi.fn(),
        push: vi.fn(),
        ...overrides.git
    }
    const AutoVersion = {
        AutoGit,
        getVersion: vi.fn().mockReturnValue('1.2.3'),
        increment: vi.fn().mockReturnValue('1.2.4'),
        setVersion: vi.fn(),
        ...overrides.version
    }
    return { AutoGit, AutoVersion, log: vi.fn(), warn: vi.fn() }
}

// --- Tests ---

describe('parseArgs', () => {
    it('defaults to patch + commit + tag', () => {
        expect(parseArgs([])).toEqual({ mode: 'patch', prefix: '', commit: true, tag: true })
    })

    it.each([
        [['major'], { mode: 'major' }],
        [['minor'], { mode: 'minor' }],
        [['patch', '--release', '--push'], { release: true, push: true }],
        [['--prefix=v'], { prefix: 'v' }],
        [['--message', 'hello'], { message: 'hello' }],
        [['-i'], { interactive: true }],
        [['-w'], { workspace: true }],
        [['-g'], { get: true }],
    ])('parseArgs(%j) includes %j', (argv, expected) => {
        expect(parseArgs(argv)).toEqual(expect.objectContaining(expected))
    })
})

describe('run', () => {
    it('--get prints version without mutating', () => {
        const d = createDeps()
        expect(run(['--get'], d)).toBe('1.2.3')
        expect(d.log).toHaveBeenCalledWith('1.2.3')
        expect(d.AutoVersion.setVersion).not.toHaveBeenCalled()
    })

    it('--get works even with dirty tree', () => {
        const d = createDeps({ git: { isClean: vi.fn().mockReturnValue(false) } })
        expect(run(['--get'], d)).toBe('1.2.3')
        expect(d.AutoGit.isGitRepo).not.toHaveBeenCalled()
    })

    it('warns and aborts if not a git repo', () => {
        const d = createDeps({ git: { isGitRepo: vi.fn().mockReturnValue(false) } })
        expect(run([], d)).toBeUndefined()
        expect(d.warn).toHaveBeenCalledWith(expect.stringContaining('not a Git repository'))
        expect(d.AutoVersion.setVersion).not.toHaveBeenCalled()
    })

    it('warns and aborts if tree is dirty', () => {
        const d = createDeps({ git: { isClean: vi.fn().mockReturnValue(false) } })
        expect(run([], d)).toBeUndefined()
        expect(d.warn).toHaveBeenCalledWith(expect.stringContaining('not clean'))
    })

    it('default: increments patch, stages, commits, tags', () => {
        const d = createDeps()
        expect(run([], d)).toBe('1.2.4')

        expect(d.AutoVersion.increment).toHaveBeenCalledWith('1.2.3', 'patch')
        expect(d.AutoVersion.setVersion).toHaveBeenCalledWith('1.2.4')
        expect(d.AutoGit.stageFiles).toHaveBeenCalledWith(['package.json'])
        expect(d.AutoGit.commit).toHaveBeenCalledWith(expect.objectContaining({ version: '1.2.4', prefix: '' }))
        expect(d.AutoGit.tag).toHaveBeenCalledWith('1.2.4', '')
        expect(d.AutoGit.release).not.toHaveBeenCalled()
    })

    it('--release delegates to release() with files', () => {
        const d = createDeps()
        run(['--release', '--push', '--prefix', 'v'], d)

        expect(d.AutoGit.release).toHaveBeenCalledWith(
            expect.objectContaining({ version: '1.2.4', prefix: 'v', push: true }),
            ['package.json']
        )
    })

    it('--push after default commit+tag', () => {
        const d = createDeps()
        run(['--push'], d)

        expect(d.AutoGit.commit).toHaveBeenCalled()
        expect(d.AutoGit.tag).toHaveBeenCalled()
        expect(d.AutoGit.push).toHaveBeenCalled()
    })

    it('--workspace bumps workspace packages', () => {
        const d = createDeps()
        run(['minor', '--workspace'], d)
        expect(d.AutoGit.bumpWorkspace).toHaveBeenCalledWith('minor')
    })

    it('--workspace stages workspace package.json files', () => {
        const d = createDeps({
            git: { getWorkspacePackages: vi.fn().mockReturnValue(['/p/packages/core']) }
        })
        run(['--workspace'], d)
        expect(d.AutoGit.stageFiles).toHaveBeenCalledWith(expect.arrayContaining(['package.json']))
    })
})
