#!/usr/bin/env node

const AutoVersion = require('../lib/main.js')

/* TODO :
 *    - Add a --get option to retrieve the version (for ex to use it in commit)
 *    - Add a --indent option change the indentation
 */

/* Usage :
 * - npx auto-version         --> increment patch
 * - npx auto-version --get   --> return the version (ex: 0.2.3)
 * - npx auto-version --patch --> increment patch
 * - npx auto-version --minor --> increment minor
 * - npx auto-version --major --> increment major

 */

const args = process.argv.slice(2).map(arg => arg.replace(/--?/, ''))

const version = AutoVersion.getVersion()

if (args.includes('get') || args.includes('g')) {
    console.log(version)
} else {
    const mode = (args.length > 0 && ['major', 'minor', 'patch'].includes(args[0])) ? args[0] : 'patch'
    const newVersion = AutoVersion.increment(version, mode)
    AutoVersion.setVersion(newVersion)
    console.log(`Update version to ${newVersion}`)
}



