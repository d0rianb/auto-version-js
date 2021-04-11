const AutoVersion = require('../lib/main.js')

const version = AutoVersion.getVersion(__dirname)
const newVersion = AutoVersion.minor(version)
AutoVersion.setVersion(__dirname, newVersion)
console.log(newVersion)