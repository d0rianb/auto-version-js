#!/usr/bin/env node

const AutoVersion = require('../lib/main.js')

const args = process.argv.slice(2).map(arg => arg.replace(/--/, ''))

const version = AutoVersion.getVersion()
const mode = (args.length > 0 && ['major', 'minor', 'patch'].includes(args[0])) ? args[0] : 'patch'
const newVersion = AutoVersion.increment(version, mode)
AutoVersion.setVersion(newVersion)
console.log(`Update version to ${newVersion}`)