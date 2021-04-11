// Auto Version JS
// Dorian Beauchesne © 2021 - All right reserved

/* Use case : auto-version --patch +0.0.1
 *            auto-version --minor +0.1.0
 *            auto-version --major +1.0.0
 */

const path = require('path')
const pkgDir = require('pkg-dir')
const fs = require('fs')

const workingDirname = path.resolve(__dirname, '..', '..', '..') // bin > node_modules > project
const packageJsonPath = path.resolve(pkgDir.sync(workingDirname)) || pkgDir.sync(__dirname)
const packageJSON = require(path.resolve(packageJsonPath, 'package.json')) // store the package.json file as JSON


/**
 * @typedef {Object} VersionObject
 * @property {number} major
 * @property {number} minor
 * @property {number} patch
 */
let versionObject // global abstraction of the version

/**
 * @class AutoVersion
 */
class AutoVersion {

    /**
     * Return the current version of the project
     * @return {string}  the version number
     */
    static getVersion() {
        if (!packageJSON) throw Error('Unable to find the package.json')
        return packageJSON.version
    }

    /**
     * Write the version number into package.json
     * @param {string} version            the version number
     * @param {number} [indentation=4]    the number of space to pretty print the package.json file
     */
    static setVersion(version, indentation) {
        packageJSON.version = version
        fs.writeFileSync(path.resolve(packageJsonPath, 'package.json'), JSON.stringify(packageJSON, null, indentation || 4))
    }

    /**
     * Extract the major, minor & patch number from a semver version number
     * @param versionString
     * @return {VersionObject}
     */
    static parse(versionString) {
        const versionRegex = /(\d+)\.?(\d+)?.?(\d+)?/i
        let versionObject = { major: 0, minor: 0, patch: 0 }
        if (versionString.match(versionRegex)) {
            const [_, major, minor, patch] = versionString.match(versionRegex)
            versionObject = { major, minor, patch }
        }
        Object.entries(versionObject).forEach(([key, value]) => !value ? versionObject[key] = 0 : versionObject[key] = parseInt(value))
        return versionObject
    }

    /**
     * Stringify a versionObject
     * @param versionObject
     * @return {string}         the version representation of the string
     */
    static stringify(versionObject) {
        return Object.values(versionObject).reduce((prev, curr) => `${prev}.${curr}`)
    }

    /**
     * Convert a version into semver standard
     * @param versionString
     * @return {string}         the semver version number
     */
    static toSemver(versionString) {
        return AutoVersion.stringify(AutoVersion.parse(versionString))
    }

    /**
     * Increment the version number
     * @param {string} version
     * @param {string} level    major | minor | patch
     * @return {string}         the incremented version number
     */
    static increment(version, level) {
        const versionObject = AutoVersion.parse(version)
        versionObject[level.toLowerCase()]++
        if (level === 'major' || level === 'minor') versionObject.patch = 0
        if (level === 'major') versionObject.minor = 0
        return AutoVersion.stringify(versionObject)
    }

    /**
     * Update the version number for a major update
     * @param  {string} version
     * @return {string}     the new version number
     */
    static major(version) {
        return AutoVersion.increment(version, 'major')
    }

    /**
     * Update the version number for a minor update
     * @param {string} version
     * @return {string}     the new version number
     */
    static minor(version) {
        return AutoVersion.increment(version, 'minor')
    }

    /**
     * Update the version number for a patch update
     * @param {string} version
     * @return {string}     the new version number
     */
    static patch(version) {
        return AutoVersion.increment(version, 'patch')
    }
}

module.exports = AutoVersion