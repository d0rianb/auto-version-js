// Auto Version JS - Git Module
// Dorian Beauchesne © 2026 - All right reserved

/* Use case : auto-version --patch --commit
 *            auto-version --minor --tag
 *            auto-version --patch --release --push
 *            auto-version --patch --workspace --release
 *            auto-version --patch --prefix "release-"
 */

const { execSync, execFileSync } = require('child_process')
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
     * Execute a command safely using execFileSync (no shell interpolation)
     * @param {string}   bin    the binary to execute
     * @param {string[]} args   the arguments array
     * @param {string}   [cwd]  the working directory
     * @return {string}         the command stdout
     */
    static execSafe(bin, args, cwd) {
        return execFileSync(bin, args, {
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
            AutoGit.execSafe('git', ['rev-parse', '--is-inside-work-tree'], cwd)
            return true
        } catch (e) {
            return false
        }
    }

    /**
     * Check whether the Git working tree has no staged, modified, or untracked files
     * @param {string} [cwd]  the working directory
     * @return {boolean}      true when the working tree is clean
     */
    static isClean(cwd) {
        return AutoGit.execSafe('git', ['status', '--porcelain'], cwd) === ''
    }

    /**
     * Stage specific files
     * @param {string[]} files  array of file paths to stage
     * @param {string}   [cwd]  the working directory
     * @example
     * AutoGit.stageFiles(['package.json'])
     * AutoGit.stageFiles(['package.json', 'packages/core/package.json'])
     */
    static stageFiles(files, cwd) {
        AutoGit.execSafe('git', ['add', '--', ...files], cwd)
    }

    /**
     * Stage all modified and untracked files (git add .)
     * @param {string} [cwd]  the working directory
     * @example
     * AutoGit.stageAll()
     * AutoGit.stageAll('/path/to/project')
     */
    static stageAll(cwd) {
        AutoGit.execSafe('git', ['add', '.'], cwd)
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
            AutoGit.execSafe('git', ['commit', '-m', msg], cwd)
        }
    }

    /**
     * Create an annotated git tag for the given version
     * @param {string} version        the version number
     * @param {string} [prefix='']    the tag prefix
     * @param {string} [cwd]          the working directory
     * @return {string}               the full tag name
     * @example
     * AutoGit.tag('1.2.3')              // --> creates tag "1.2.3"
     * AutoGit.tag('1.2.3', 'release-')  // --> creates tag "release-1.2.3"
     * AutoGit.tag('1.2.3', '')          // --> creates tag "1.2.3"
     */
    static tag(version, prefix = DEFAULT_PREFIX, cwd) {
        const tagName = `${prefix}${version}`

        // Check if tag already exists
        try {
            AutoGit.execSafe('git', ['rev-parse', tagName], cwd)
            throw new Error(`Tag "${tagName}" already exists. Delete it first or use a different version.`)
        } catch (e) {
            if (e.message.includes('already exists')) throw e
            // Tag does not exist — proceed
        }

        AutoGit.execSafe('git', ['tag', '-a', tagName, '-m', `Release ${tagName}`], cwd)
        return tagName
    }

    /**
     * Push commits and tags to the remote repository
     * @param {string} [cwd]  the working directory
     * @example
     * AutoGit.push()
     */
    static push(cwd) {
        // Check that a remote exists
        const remotes = AutoGit.execSafe('git', ['remote'], cwd)
        if (!remotes) {
            throw new Error('No git remote configured. Add a remote before pushing.')
        }

        AutoGit.execSafe('git', ['push'], cwd)
        AutoGit.execSafe('git', ['push', '--tags'], cwd)
    }

    /**
     * Run the full release workflow: stage → commit → tag → push (optional)
     * @param {GitOptions} options
     * @param {string[]}   [stagedFiles]  specific files to stage (defaults to git add .)
     * @return {string}            the full tag name created
     * @example
     * AutoGit.release({ version: '1.2.3' })                                    // --> stage + commit "1.2.3" + tag "1.2.3"
     * AutoGit.release({ version: '1.2.3', push: true })                        // --> + push
     * AutoGit.release({ version: '1.2.3', prefix: 'release-', push: true })    // --> tag "release-1.2.3" + push
     */
    static release(options, stagedFiles) {
        const { version, prefix = DEFAULT_PREFIX, push, cwd } = options

        if (!AutoGit.isGitRepo(cwd)) throw new Error('Not a git repository')

        if (stagedFiles && stagedFiles.length > 0) {
            AutoGit.stageFiles(stagedFiles, cwd)
        } else {
            AutoGit.stageAll(cwd)
        }

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
        const dir = path.resolve(cwd || process.cwd())

        // Strategy 1: delegate to the pnpm CLI
        try {
            const output = AutoGit.exec('pnpm ls -r --json --depth -1', dir)
            const packages = JSON.parse(output)
            return packages
                .map(pkg => path.resolve(pkg.path))
                .filter(p => p !== dir)
        } catch (e) {
            // pnpm not available or not a workspace — fall through to strategy 2
        }

        // Strategy 2: parse pnpm-workspace.yaml and resolve patterns manually
        const yamlPath = path.resolve(dir, 'pnpm-workspace.yaml')
        if (!fs.existsSync(yamlPath)) return []

        const content = fs.readFileSync(yamlPath, 'utf-8')

        // Extract list items from the yaml
        const patterns = []
        const lines = content.split('\n')
        for (const line of lines) {
            // Skip comments
            if (/^\s*#/.test(line)) continue

            const match = line.match(/^\s*-\s*['"]?([^'"\n#]+)['"]?\s*(?:#.*)?$/)
            if (!match) continue

            const clean = match[1].trim()
            // Skip exclusion patterns
            if (clean.startsWith('!')) continue
            if (clean) patterns.push(clean)
        }

        // Resolve each pattern — supports "packages/*" and "packages/**" style globs
        const results = []
        patterns.forEach(pattern => {
            const isRecursive = pattern.includes('**')
            const base = pattern.replace(/\/?\*.*$/, '')
            const basePath = path.resolve(dir, base)
            if (!fs.existsSync(basePath) || !fs.statSync(basePath).isDirectory()) return

            if (isRecursive) {
                // Recursively find all directories with a package.json
                const walk = dirPath => {
                    for (const entry of fs.readdirSync(dirPath)) {
                        if (entry === 'node_modules') continue
                        const entryPath = path.resolve(dirPath, entry)
                        if (!fs.statSync(entryPath).isDirectory()) continue
                        if (fs.existsSync(path.resolve(entryPath, 'package.json'))) {
                            results.push(entryPath)
                        }
                        walk(entryPath)
                    }
                }
                walk(basePath)
            } else if (pattern.includes('*')) {
                // Expand one level of wildcard
                fs.readdirSync(basePath).forEach(entry => {
                    const entryPath = path.resolve(basePath, entry)
                    if (!fs.statSync(entryPath).isDirectory()) return
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
     * Detect the indentation used in a JSON file
     * @param {string} filePath  path to the JSON file
     * @return {string|number}   the indentation (number of spaces or tab character)
     */
    static detectIndentation(filePath) {
        const content = fs.readFileSync(filePath, 'utf-8')
        const match = content.match(/^(\s+)"/m)
        if (!match) return 4
        const indent = match[1]
        if (indent[0] === '\t') return '\t'
        return indent.length
    }

    /**
     * Bump the version in all workspace packages at the given semver level
     * Also updates internal cross-references (dependencies, devDependencies, peerDependencies)
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

        // First pass: bump all versions and collect the new version map
        const packageData = []
        packages.forEach(pkgPath => {
            const pkgJsonPath = path.resolve(pkgPath, 'package.json')
            const indent = AutoGit.detectIndentation(pkgJsonPath)
            const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'))
            const newVersion = AutoVersion.increment(pkgJson.version, level)
            pkgJson.version = newVersion
            results[pkgJson.name] = newVersion
            packageData.push({ pkgJsonPath, pkgJson, indent })
        })

        // Second pass: update internal dependency references
        const depFields = ['dependencies', 'devDependencies', 'peerDependencies']
        packageData.forEach(({ pkgJsonPath, pkgJson, indent }) => {
            depFields.forEach(field => {
                if (!pkgJson[field]) return
                Object.keys(pkgJson[field]).forEach(dep => {
                    if (results[dep]) {
                        const currentRange = pkgJson[field][dep]
                        // Preserve range prefix (^, ~, >=, etc.)
                        const rangePrefix = currentRange.match(/^([~^>=<]*)/)?.[1] || '^'
                        pkgJson[field][dep] = `${rangePrefix}${results[dep]}`
                    }
                })
            })
            fs.writeFileSync(pkgJsonPath, JSON.stringify(pkgJson, null, indent) + '\n')
        })

        return results
    }
}

module.exports = AutoGit
