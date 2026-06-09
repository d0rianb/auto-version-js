const { parseArgs, run } = require('../bin/auto-version')

const createDependencies = () => {
    const AutoGit = {
        isGitRepo: vi.fn().mockReturnValue(true),
        isClean: vi.fn().mockReturnValue(true),
        bumpWorkspace: vi.fn(),
        stageAll: vi.fn(),
        commit: vi.fn(),
        tag: vi.fn(),
        release: vi.fn(),
        push: vi.fn()
    }
    const AutoVersion = {
        AutoGit,
        getVersion: vi.fn().mockReturnValue('1.2.3'),
        increment: vi.fn().mockReturnValue('1.2.4'),
        setVersion: vi.fn()
    }

    return {
        AutoGit,
        AutoVersion,
        log: vi.fn(),
        warn: vi.fn()
    }
}

describe('auto-version CLI', () => {
    it('uses patch, commit, tag, and no prefix by default', () => {
        expect(parseArgs([])).toEqual({
            mode: 'patch',
            prefix: '',
            commit: true,
            tag: true
        })
    })

    it('parses release options and a custom prefix', () => {
        expect(parseArgs([
            '--minor',
            '--release',
            '--push',
            '--prefix=release-',
            '--message',
            'chore: release'
        ])).toEqual({
            mode: 'minor',
            prefix: 'release-',
            commit: true,
            tag: true,
            release: true,
            push: true,
            message: 'chore: release'
        })
    })

    it('prints the current version without changing it', () => {
        const dependencies = createDependencies()

        expect(run(['--get'], dependencies)).toBe('1.2.3')
        expect(dependencies.log).toHaveBeenCalledWith('1.2.3')
        expect(dependencies.AutoVersion.setVersion).not.toHaveBeenCalled()
    })

    it('increments, commits, and tags by default', () => {
        const dependencies = createDependencies()

        expect(run([], dependencies)).toBe('1.2.4')
        expect(dependencies.AutoVersion.increment).toHaveBeenCalledWith('1.2.3', 'patch')
        expect(dependencies.AutoVersion.setVersion).toHaveBeenCalledWith('1.2.4')
        expect(dependencies.AutoGit.stageAll).toHaveBeenCalled()
        expect(dependencies.AutoGit.commit).toHaveBeenCalledWith(expect.objectContaining({
            version: '1.2.4',
            prefix: ''
        }))
        expect(dependencies.AutoGit.tag).toHaveBeenCalledWith('1.2.4', '')
        expect(dependencies.AutoGit.commit.mock.invocationCallOrder[0])
            .toBeLessThan(dependencies.AutoGit.tag.mock.invocationCallOrder[0])
        expect(dependencies.AutoGit.release).not.toHaveBeenCalled()
    })

    it('does nothing and warns when the Git working tree is not clean', () => {
        const dependencies = createDependencies()
        dependencies.AutoGit.isClean.mockReturnValue(false)

        expect(run([], dependencies)).toBeUndefined()
        expect(dependencies.warn).toHaveBeenCalledWith(
            'Warning: Git working tree is not clean. No changes were made.'
        )
        expect(dependencies.AutoVersion.increment).not.toHaveBeenCalled()
        expect(dependencies.AutoVersion.setVersion).not.toHaveBeenCalled()
    })

    it('does nothing and warns outside a Git repository', () => {
        const dependencies = createDependencies()
        dependencies.AutoGit.isGitRepo.mockReturnValue(false)

        expect(run([], dependencies)).toBeUndefined()
        expect(dependencies.warn).toHaveBeenCalledWith(
            'Warning: not a Git repository. No changes were made.'
        )
        expect(dependencies.AutoGit.isClean).not.toHaveBeenCalled()
        expect(dependencies.AutoVersion.setVersion).not.toHaveBeenCalled()
    })

    it('allows reading the version when the Git working tree is not clean', () => {
        const dependencies = createDependencies()
        dependencies.AutoGit.isClean.mockReturnValue(false)

        expect(run(['--get'], dependencies)).toBe('1.2.3')
        expect(dependencies.AutoGit.isGitRepo).not.toHaveBeenCalled()
        expect(dependencies.AutoGit.isClean).not.toHaveBeenCalled()
    })

    it('releases without a tag prefix by default', () => {
        const dependencies = createDependencies()

        run(['--release', '--push'], dependencies)

        expect(dependencies.AutoGit.release).toHaveBeenCalledWith({
            version: '1.2.4',
            prefix: '',
            message: undefined,
            interactive: undefined,
            push: true
        })
    })

    it('supports separate commit and tag actions', () => {
        const dependencies = createDependencies()

        run(['--commit', '--tag', '--prefix', 'release-'], dependencies)

        expect(dependencies.AutoGit.stageAll).toHaveBeenCalled()
        expect(dependencies.AutoGit.commit).toHaveBeenCalledWith(expect.objectContaining({
            version: '1.2.4',
            prefix: 'release-'
        }))
        expect(dependencies.AutoGit.tag).toHaveBeenCalledWith('1.2.4', 'release-')
    })

    it('pushes after the default commit and tag', () => {
        const dependencies = createDependencies()

        run(['--push'], dependencies)

        expect(dependencies.AutoGit.commit).toHaveBeenCalled()
        expect(dependencies.AutoGit.tag).toHaveBeenCalled()
        expect(dependencies.AutoGit.push).toHaveBeenCalled()
        expect(dependencies.AutoGit.commit.mock.invocationCallOrder[0])
            .toBeLessThan(dependencies.AutoGit.tag.mock.invocationCallOrder[0])
        expect(dependencies.AutoGit.tag.mock.invocationCallOrder[0])
            .toBeLessThan(dependencies.AutoGit.push.mock.invocationCallOrder[0])
    })

    it('increments pnpm workspace packages when requested', () => {
        const dependencies = createDependencies()

        run(['--minor', '--workspace'], dependencies)

        expect(dependencies.AutoGit.bumpWorkspace).toHaveBeenCalledWith('minor')
    })
})
