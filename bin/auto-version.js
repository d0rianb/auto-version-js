#!/usr/bin/env node

const AutoVersion = require('../lib/main.js')

const HELP = `Usage: auto-version [command] [options]

Commands:
  patch                   Increment the patch version (default)
  minor                   Increment the minor version
  major                   Increment the major version

Options:
  -g, --get               Print the current version without changing it
  -c, --commit            Stage files and commit the new version (default)
  -t, --tag               Create an annotated tag (default)
  -r, --release           Stage, commit, and tag the new version
      --push              Push the commit and tag
  -w, --workspace         Increment all pnpm workspace packages
      --prefix <value>    Prefix for commit messages and tags (default: none)
  -m, --message <value>   Custom commit message
  -i, --interactive       Open the Git editor for the commit message
  -h, --help              Show this help`

const readValue = (argv, index, option) => {
    const argument = argv[index]
    const separator = argument.indexOf('=')

    if (separator !== -1) {
        return { value: argument.slice(separator + 1), nextIndex: index }
    }

    if (argv[index + 1] === undefined) {
        throw new Error(`Missing value for ${option}`)
    }

    return { value: argv[index + 1], nextIndex: index + 1 }
}

const parseArgs = argv => {
    const command = argv[0] && !argv[0].startsWith('-') ? argv[0] : 'patch'

    if (!['major', 'minor', 'patch'].includes(command)) {
        throw new Error(`Unknown command: ${command}`)
    }

    const options = {
        mode: command,
        // Commit & tag by default
        prefix: '',
        commit: true,
        tag: true
    }

    const optionStart = command === argv[0] ? 1 : 0

    for (let index = optionStart; index < argv.length; index++) {
        const argument = argv[index]
        const option = argument.split('=')[0]

        switch (option) {
            case '-g':
            case '--get':
                options.get = true
                break
            case '-c':
            case '--commit':
                options.commit = true
                break
            case '-t':
            case '--tag':
                options.tag = true
                break
            case '-r':
            case '--release':
                options.release = true
                break
            case '--push':
                options.push = true
                break
            case '-w':
            case '--workspace':
                options.workspace = true
                break
            case '--prefix': {
                const result = readValue(argv, index, option)
                options.prefix = result.value
                index = result.nextIndex
                break
            }
            case '-m':
            case '--message': {
                const result = readValue(argv, index, option)
                options.message = result.value
                index = result.nextIndex
                break
            }
            case '-i':
            case '--interactive':
                options.interactive = true
                break
            case '-h':
            case '--help':
                options.help = true
                break
            default:
                throw new Error(`Unknown option: ${argument}`)
        }
    }

    return options
}

const run = (argv, dependencies = {}) => {
    const autoVersion = dependencies.AutoVersion || AutoVersion
    const autoGit = dependencies.AutoGit || autoVersion.AutoGit
    const log = dependencies.log || console.log
    const warn = dependencies.warn || console.warn
    const options = parseArgs(argv)

    if (options.help) {
        log(HELP)
        return
    }

    const version = autoVersion.getVersion()

    if (options.get) {
        log(version)
        return version
    }

    if (!autoGit.isGitRepo()) {
        warn('Warning: not a Git repository. No changes were made.')
        return
    }

    if (!autoGit.isClean()) {
        warn('Warning: Git working tree is not clean. No changes were made.')
        return
    }

    const newVersion = autoVersion.increment(version, options.mode)
    autoVersion.setVersion(newVersion)

    // Collect files to stage (only modified package.json files)
    const filesToStage = ['package.json']

    if (options.workspace) {
        const bumpResults = autoGit.bumpWorkspace(options.mode)
        // Add workspace package.json files to staging list
        const workspacePackages = autoGit.getWorkspacePackages ? autoGit.getWorkspacePackages() : []
        workspacePackages.forEach(pkgPath => {
            const relative = require('path').relative(process.cwd(), require('path').resolve(pkgPath, 'package.json'))
            filesToStage.push(relative)
        })
    }

    const gitOptions = {
        version: newVersion,
        prefix: options.prefix,
        message: options.message,
        interactive: options.interactive,
        push: options.push
    }

    if (options.release) {
        autoGit.release(gitOptions, filesToStage)
    } else {
        if (options.commit) {
            autoGit.stageFiles ? autoGit.stageFiles(filesToStage) : autoGit.stageAll()
            autoGit.commit(gitOptions)
        }
        if (options.tag) autoGit.tag(newVersion, options.prefix)
        if (options.push) autoGit.push()
    }

    log(`Update version to ${newVersion}`)
    return newVersion
}

if (require.main === module) {
    try {
        run(process.argv.slice(2))
    } catch (error) {
        console.error(error.message)
        process.exitCode = 1
    }
}

module.exports = {
    HELP,
    parseArgs,
    run
}
