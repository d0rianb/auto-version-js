// Auto Version JS - Git Module
// Dorian Beauchesne © 2026 - All right reserved

/* Use case : auto-version --patch --commit
 *            auto-version --minor --tag
 *            auto-version --patch --release --push
 *            auto-version --patch --workspace --release
 *            auto-version --patch --prefix "release-"
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const DEFAULT_PREFIX = ''

/**
 * @typedef {Object} GitOptions
 * @property {string}  version              - the version string (e.g. '1.2.3')
 * @property {string}  [prefix='']         - the tag/commit prefix (e.g. 'v', 'release-', '')
 * @property {string}  [message]            - custom commit message (defaults to "{prefix}{version}")
 * @property {boolean} [interactive=false]  - open the default git editor for the commit message
 * @property {boolean} [push=false]         - push commit and tags to remote after release
 * @property {string}  [cwd]               - working directory (defaults to process.cwd())
 */

/**
 * @class AutoGit
 */
class AutoGit {
    /**
     * Execute a shell command and return the trimmed output
     * @param {string} cmd    the command to execute
     * @param {string} [cwd]  the working directory
     * @return {string}       the command stdout
     * @example
     * AutoGit.exec('git status')
     * AutoGit.exec('git log --oneline -5', '/path/to/project')
     */
    static exec(cmd, cwd) {
        return execSync(cmd, {
            cwd: cwd || process.cwd(),
            encoding: 'utf-8',
            stdio: ['inherit', 'pipe', 'pipe']
        }).trim()
    }

    /**
     * Check if the given directory is inside a git repository
     * @param {string} [cwd]  the working directory
     * @return {boolean}      true if inside a git repo
     * @example
     * AutoGit.isGitRepo()            // --> true
     * AutoGit.isGitRepo('/tmp/foo')  // --> false
     */
    static isGitRepo(cwd) {
        try {
            AutoGit.exec('git rev-parse --is-inside-work-tree', cwd)
            return true
        } catch (e) {
            return false
        }
    }

    /**
     * Stage all modified and untracked files (git add .)
     * @param {string} [cwd]  the working directory
     * @example
     * AutoGit.stageAll()
     * AutoGit.stageAll('/path/to/project')
     */
    static stageAll(cwd) {
        AutoGit.exec('git add .', cwd)
    }

    /**
     * Create a commit with an automatic, custom, or interactive message
     * @param {GitOptions} options
     * @example
     * AutoGit.commit({ version: '1.2.3' })                           // --> commit "1.2.3"
     * AutoGit.commit({ version: '1.2.3', prefix: 'release-' })       // --> commit "release-1.2.3"
     * AutoGit.commit({ version: '1.2.3', message: 'chore: release' }) // --> commit "chore: release"
     * AutoGit.commit({ version: '1.2.3', interactive: true })         // --> opens the default git editor
     */
    static commit(options) {
        const { version, prefix = DEFAULT_PREFIX, message, interactive, cwd } = options
        if (interactive) {
            execSync('git commit', { cwd: cwd || process.cwd(), stdio: 'inherit' })
        } else {
            const msg = message || `${prefix}${version}`
            AutoGit.exec(`git commit -m "${msg}"`, cwd)
        }
    }

    /**
     * Create an annotated git tag for the given version
     * @param {string} version        the version number
     * @param {string} [prefix='v']   the tag prefix
     * @param {string} [cwd]          the working directory
     * @return {string}               the full tag name
     * @example
     * AutoGit.tag('1.2.3')              // --> creates tag "1.2.3"
     * AutoGit.tag('1.2.3', 'release-')  // --> creates tag "release-1.2.3"
     * AutoGit.tag('1.2.3', '')          // --> creates tag "1.2.3"
     */
    static tag(version, prefix = DEFAULT_PREFIX, cwd) {
        const tagName = `${prefix}${version}`
        AutoGit.exec(`git tag -a ${tagName} -m "Release ${tagName}"`, cwd)
        return tagName
    }

    /**
     * Push commits and tags to the remote repository
     * @param {string} [cwd]  the working directory
     * @example
     * AutoGit.push()
     */
    static push(cwd) {
        AutoGit.exec('git push', cwd)
        AutoGit.exec('git push --tags', cwd)
    }

    /**
     * Run the full release workflow: stage → commit → tag → push (optional)
     * @param {GitOptions} options
     * @return {string}            the full tag name created
     * @example
     * AutoGit.release({ version: '1.2.3' })                                    // --> stage + commit "v1.2.3" + tag "v1.2.3"
     * AutoGit.release({ version: '1.2.3', push: true })                        // --> + push
     * AutoGit.release({ version: '1.2.3', prefix: 'release-', push: true })    // --> tag "release-1.2.3" + push
     */
    static release(options) {
        const { version, prefix = DEFAULT_PREFIX, push, cwd } = options

        if (!AutoGit.isGitRepo(cwd)) throw new Error('Not a git repository')

        AutoGit.stageAll(cwd)
        AutoGit.commit(options)
        const tagName = AutoGit.tag(version, prefix, cwd)

        if (push) AutoGit.push(cwd)

        return tagName
    }

    // --- Workspace support ---

    /**
     * Check if the current directory contains a pnpm workspace
     * @param {string} [cwd]  the working directory
     * @return {boolean}      true if pnpm-workspace.yaml is found
     * @example
     * AutoGit.isWorkspace()  // --> true if pnpm-workspace.yaml exists
     */
    static isWorkspace(cwd) {
        return fs.existsSync(path.resolve(cwd || process.cwd(), 'pnpm-workspace.yaml'))
    }

    /**
     * Return the list of absolute paths to each package in the workspace
     * Uses the pnpm CLI first, falls back to parsing pnpm-workspace.yaml with a simple glob
     * @param {string} [cwd]   the workspace root directory
     * @return {string[]}      array of absolute paths to each package directory
     * @example
     * AutoGit.getWorkspacePackages()  // --> ['/project/packages/core', '/project/packages/cli']
     */
    static getWorkspacePackages(cwd) {
        const dir = cwd || process.cwd()

        // Strategy 1: delegate to the pnpm CLI
        try {
            const output = AutoGit.exec('pnpm ls -r --json --depth -1', dir)
            const packages = JSON.parse(output)
            return packages.map(pkg => pkg.path).filter(p => p !== dir)
        } catch (e) {
            // pnpm not available or not a workspace — fall through to strategy 2
        }

        // Strategy 2: parse pnpm-workspace.yaml and resolve patterns manually
        const yamlPath = path.resolve(dir, 'pnpm-workspace.yaml')
        if (!fs.existsSync(yamlPath)) return []

        const content = fs.readFileSync(yamlPath, 'utf-8')

        // Extract list items from the yaml (handles "  - 'packages/*'" and "  - packages/*")
        const patterns = []
        const lineMatches = content.match(/^\s*-\s*['"]?([^'"\n]+)['"]?\s*$/gm) || []
        lineMatches.forEach(line => {
            const clean = line.replace(/^\s*-\s*['"]?/, '').replace(/['"]?\s*$/, '').trim()
            if (clean) patterns.push(clean)
        })

        // Resolve each pattern — supports "packages/*" style globs
        const results = []
        patterns.forEach(pattern => {
            const base = pattern.replace(/\/?\*.*$/, '')
            const basePath = path.resolve(dir, base)
            if (!fs.existsSync(basePath) || !fs.statSync(basePath).isDirectory()) return

            if (pattern.includes('*')) {
                // Expand one level of wildcard
                fs.readdirSync(basePath).forEach(entry => {
                    const entryPath = path.resolve(basePath, entry)
                    if (fs.existsSync(path.resolve(entryPath, 'package.json'))) {
                        results.push(entryPath)
                    }
                })
            } else if (fs.existsSync(path.resolve(basePath, 'package.json'))) {
                results.push(basePath)
            }
        })

        return results
    }

    /**
     * Bump the version in all workspace packages at the given semver level
     * @param {string} level   major | minor | patch
     * @param {string} [cwd]   the workspace root directory
     * @return {Object}        map of { packageName: newVersion }
     * @example
     * AutoGit.bumpWorkspace('patch')  // --> { '@scope/core': '1.0.1', '@scope/cli': '1.0.1' }
     * AutoGit.bumpWorkspace('minor')  // --> { '@scope/core': '1.1.0', '@scope/cli': '1.1.0' }
     */
    static bumpWorkspace(level, cwd) {
        const AutoVersion = require('./main.js')
        const packages = AutoGit.getWorkspacePackages(cwd)
        const results = {}

        packages.forEach(pkgPath => {
            const pkgJsonPath = path.resolve(pkgPath, 'package.json')
            const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'))
            const newVersion = AutoVersion.increment(pkgJson.version, level)
            pkgJson.version = newVersion
            fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, 4))
            results[pkgJson.name] = newVersion
        })

        return results
    }
}

module.exports = AutoGit
