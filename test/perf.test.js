const Logger = require('../lib/main.js')

const n = 10000

// 461 ms - 0.5.6 - with momentjs
// 163 ms - 0.5.7 - without momentjs
// 58 ms  - 0.5.8
// 56 ms  - 0.5.9
// 60 ms  - 0.6.0 

describe('Performance test', () => {
    it(`Time to run ${n} logs`, () => {
        Logger.setOptions({ filename: 'perf.log' })
        Logger.clear()
        const start = Date.now()
        for (let i = 0; i < n; i++) {
            Logger.info(`info n°${i}`)
        }
        const time = Date.now() - start
        expect(time).toBeLessThan(500)
        console.log(`PERFORMANCE | time to run ${n} logs : ${time}ms`)
    })
})