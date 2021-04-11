const fs = require('fs')
const Logger = require('../lib/main.js')

const logsDir = './logs'
const defaultFile = `logs.log`

describe('Logs method in default file', () => {
    afterEach(() => Logger.clear())

    it('Should info in default file', () => {
        const log = 'test info in default file'
        Logger.info(log)
        const content = fs.readFileSync(`${logsDir}/${defaultFile}`, { encoding: 'utf8' })
        expect(content).toContain(log)
    })

    it('Should debug in default file', () => {
        const log = 'test debug in default file'
        Logger.debug(log)
        const content = fs.readFileSync(`${logsDir}/${defaultFile}`, { encoding: 'utf8' })
        expect(content).toContain(log)
    })

    it('Should warn in default file', () => {
        const log = 'test warn in default file'
        Logger.warn(log)
        const content = fs.readFileSync(`${logsDir}/${defaultFile}`, { encoding: 'utf8' })
        expect(content).toContain(log)
    })

    it('Should error in default file', () => {
        const log = 'test error in default file'
        Logger.error(log)
        const content = fs.readFileSync(`${logsDir}/${defaultFile}`, { encoding: 'utf8' })
        expect(content).toContain(log)
    })

    it('Should fatal in default file', () => {
        const log = 'test fatal in default file'
        Logger.fatal(log)
        const content = fs.readFileSync(`${logsDir}/${defaultFile}`, { encoding: 'utf8' })
        expect(content).toContain(log)
    })

})

describe('Options modification', () => {
    beforeAll(() => Logger.clear('all'))
    afterEach(() => Logger.clear('test.log'))

    it(`Should log 'Information' in test.log via call`, () => {
        Logger.info('Information', 'test.log')
        const content = fs.readFileSync(`${logsDir}/test.log`, { encoding: 'utf8' })
        expect(content).toContain('Information')
    })

    it(`Should log 'Information' in test.log via options`, () => {
        Logger.setOptions({ filename: 'test.log' })
        Logger.info('Information')
        const content = fs.readFileSync(`${logsDir}/test.log`, { encoding: 'utf8' })
        expect(content).toContain('Information')
    })
})

describe('Level modification', () => {
    it('should add a new levels', () => {
        const nbLevels = Object.keys(Logger.levels).length
        Logger.addLevel('Test')
        const nbNewLevels = Object.keys(Logger.levels).length
        expect(nbNewLevels).toBeGreaterThan(nbLevels)
    })

    it('should return the TEST level', () => {
        const testLevel = Logger.getLevel('Test')
        expect(testLevel).toContain('TEST')
    })
})