const process = require('process')
const Logger = require('../lib/main.js')


Logger.on('error', err => console.log(err))
Logger.error('test error')
Logger.error('test error 2', 'logs.log', { noEvent: true })