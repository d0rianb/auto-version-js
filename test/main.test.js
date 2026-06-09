// main.test.js
const AutoVersion = require('../lib/main')

describe('AutoVersion', () => {
    describe('parse', () => {
        it.each([
            ['1.2.3', { major: 1, minor: 2, patch: 3 }],
            ['1.2', { major: 1, minor: 2, patch: 0 }],
            ['1', { major: 1, minor: 0, patch: 0 }],
            ['91.102.3', { major: 91, minor: 102, patch: 3 }],
            ['v1.3.5', { major: 1, minor: 3, patch: 5 }],
        ])('parse("%s") => %j', (input, expected) => {
            expect(AutoVersion.parse(input)).toStrictEqual(expected)
        })
    })

    describe('stringify', () => {
        it.each([
            [{ major: 1, minor: 2, patch: 3 }, '1.2.3'],
            [{ major: 2, minor: 0, patch: 0 }, '2.0.0'],
            [{ major: 91, minor: 102, patch: 3 }, '91.102.3'],
        ])('stringify(%j) => "%s"', (input, expected) => {
            expect(AutoVersion.stringify(input)).toBe(expected)
        })
    })

    describe('toSemver', () => {
        it.each([
            ['1.3.5', '1.3.5'],
            ['1.3', '1.3.0'],
            ['1', '1.0.0'],
            ['v2', '2.0.0'],
            ['v1.3.5', '1.3.5'],
            ['version 3', '3.0.0'],
        ])('toSemver("%s") => "%s"', (input, expected) => {
            expect(AutoVersion.toSemver(input)).toBe(expected)
        })
    })

    describe('increment', () => {
        it.each([
            ['1.0.0', 'major', '2.0.0'],
            ['0.5.9', 'major', '1.0.0'],
            ['1.0.0', 'minor', '1.1.0'],
            ['0.5.8', 'minor', '0.6.0'],
            ['1.0.0', 'patch', '1.0.1'],
            ['0.5.9', 'patch', '0.5.10'],
        ])('increment("%s", "%s") => "%s"', (version, level, expected) => {
            expect(AutoVersion.increment(version, level)).toBe(expected)
        })
    })
})
