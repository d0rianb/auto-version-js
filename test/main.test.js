// main.test.js
const AutoVersion = require('../lib/main')

describe('Method testing', () => {
    it('Should parse the version', () => {
        expect(AutoVersion.parse('1.2.3')).toStrictEqual({major: 1, minor: 2, patch: 3})
        expect(AutoVersion.parse('1.2')).toStrictEqual({major: 1, minor: 2, patch: 0})
        expect(AutoVersion.parse('1')).toStrictEqual({major: 1, minor: 0, patch: 0})

        expect(AutoVersion.parse('91.102.3')).toStrictEqual({major: 91, minor: 102, patch: 3})
        expect(AutoVersion.parse('v1.3.5')).toStrictEqual({major: 1, minor: 3, patch: 5})
    })

    it('Should stringify the version', () => {
        expect(AutoVersion.stringify({major: 1, minor: 2, patch: 3})).toBe('1.2.3')
        expect(AutoVersion.stringify({major: 2, minor: 0, patch: 0})).toBe('2.0.0')
        expect(AutoVersion.stringify({major: 91, minor: 102, patch: 3})).toBe('91.102.3')
    })

    it('Should convert to SerVer standard', () => {
        expect(AutoVersion.toSemver('1.3.5')).toBe('1.3.5')
        expect(AutoVersion.toSemver('1.3')).toBe('1.3.0')
        expect(AutoVersion.toSemver('1')).toBe('1.0.0')
        expect(AutoVersion.toSemver('v2')).toBe('2.0.0')
        expect(AutoVersion.toSemver('v1.3.5')).toBe('1.3.5')
        expect(AutoVersion.toSemver('version 3')).toBe('3.0.0')
    })

    it('Should update the version number for a new major', () => {
        expect(AutoVersion.major('1.0.0')).toBe('2.0.0')
        expect(AutoVersion.major('0.5.9')).toBe('1.0.0')
    })

    it('Should update the version number for a new minor', () => {
        expect(AutoVersion.minor('1.0.0')).toBe('1.1.0')
        expect(AutoVersion.minor('0.5.8')).toBe('0.6.0')
    })

    it('Should update the version number for a new patch', () => {
        expect(AutoVersion.patch('1.0.0')).toBe('1.0.1')
        expect(AutoVersion.patch('0.5.9')).toBe('0.5.10')
    })
})
