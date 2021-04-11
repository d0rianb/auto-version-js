# Logger library

[![npm version](https://badge.fury.io/js/%40dorianb%2Flogger-js.svg)](https://badge.fury.io/js/%40dorianb%2Flogger-js)
[![npm downloads](https://badgen.net/npm/dt/@dorianb/logger-js)](https://www.npmjs.com/package/@dorianb/logger-js)

`logger-js` is a npm logger library for NodeJS

This logger is primarly designed for a backend usage, to handle the logs of a node server, or for a bot. It's lighter and easier to use than other libraries and does not require any configuration (at least for a small/medium project). It's particulary fast and require almost no running time.

The logger will write the logs by default in the `logs/` directory to the root of your project. You can change the location and the name of this folder. The default log file is `logs.log`.

This project is part of the [vener.fr](http://www.vener.fr) project, to collect the errors and different information of the server ([express](https://www.expressjs.com)).


## Installation
To install the package, just run :
```bash
npm install --save @dorianb/logger-js
```

Then in the `.js` file :
```js
const Logger = require('@dorianb/logger-js')

Logger.info('Server is starting on port 9000')
Logger.debug('172 clients are currently connected')
Logger.warn('Unsafe call from client @7655671')
Logger.error('Socket &757@127.0.0.1 doesn\'t exist')
Logger.fatal('Internet connection lost')
```

## Documentation

### Classes

<dl>
<dt><a href="#Logger">Logger</a></dt>
<dd></dd>
</dl>

### Typedefs

<dl>
<dt><a href="#LevelsObject">LevelsObject</a> : <code>Object</code></dt>
<dd><p>A dictionnary of the logger levels indexed by priority</p>
</dd>
<dt><a href="#OptionsObject">OptionsObject</a> : <code>Object</code></dt>
<dd></dd>
</dl>

<a name="Logger"></a>

### Logger
<!-- Empty to hide the `**Kind**` tag in documentation -->

* [Logger](#Logger)
    * [.options](#Logger.options) ⇒ [<code>OptionsObject</code>](#OptionsObject)
    * [.version](#Logger.version) ⇒ <code>string</code>
    * [.levels](#Logger.levels) ⇒ [<code>LevelsObject</code>](#LevelsObject)
    * [.setOptions(opts)](#Logger.setOptions)
    * [.log(filename, level, message)](#Logger.log) ↩︎
    * [.info(info, [filename])](#Logger.info) ↩︎
    * [.debug(debug, [filename])](#Logger.debug) ↩︎
    * [.warn(warn, [filename])](#Logger.warn) ↩︎
    * [.error(error, [filename], [opts])](#Logger.error) ↩︎
    * [.fatal(fatal, [filename])](#Logger.fatal) ↩︎
    * [.clear()](#Logger.clear) ↩︎
    * [.getLevel(level)](#Logger.getLevel) ⇒ <code>array</code>
    * [.addLevel(newLevel)](#Logger.addLevel) ⇒ <code>array</code>
    * [.on(event, callback)](#Logger.on)

<a name="Logger.options"></a>

#### Logger.options ⇒ [<code>OptionsObject</code>](#OptionsObject)
<!-- Empty to hide the `**Kind**` tag in documentation -->
**Getter**: Return the options of the logger  
**Example**  
```js
const loggerOptions = Logger.options
```
<br />
<a name="Logger.version"></a>

#### Logger.version ⇒ <code>string</code>
<!-- Empty to hide the `**Kind**` tag in documentation -->
**Returns**: <code>string</code> - the version number of the logger  
**Getter**: Version getter  
**Example**  
```js
const version = Logger.version
```
<br />
<a name="Logger.levels"></a>

#### Logger.levels ⇒ [<code>LevelsObject</code>](#LevelsObject)
<!-- Empty to hide the `**Kind**` tag in documentation -->
**Getter**: Levels object getter - All the lovels of the logger  
**Example**  
```js
const levels = Logger.levels
```
<br />
<a name="Logger.setOptions"></a>

#### Logger.setOptions(opts)
<!-- Empty to hide the `**Kind**` tag in documentation -->

| Param | Type | Description |
| --- | --- | --- |
| opts | [<code>OptionsObject</code>](#OptionsObject) | logger default values |

**Example**  
```js
Logger.setOptions({filename: 'production.log'})
```
<br />
<a name="Logger.log"></a>

#### Logger.log(filename, level, message) ↩︎
<!-- Empty to hide the `**Kind**` tag in documentation -->
**Chainable**  

| Param | Type | Description |
| --- | --- | --- |
| filename | <code>string</code> | file where the log is written |
| level | <code>number</code> \| <code>string</code> | level of the log |
| message | <code>string</code> | content of the log |

**Example**  
```js
Logger.log('network.log', 'WARN', 'Socket disconnected')
Logger.log('network.log', 2, 'Socket disconnected')
// --> [10-06-2020 06:43:51] - WARN - Socket disconnected
```
<br />
<a name="Logger.info"></a>

#### Logger.info(info, [filename]) ↩︎
<!-- Empty to hide the `**Kind**` tag in documentation -->
**Chainable**  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| info | <code>string</code> |  | content of the log |
| [filename] | <code>string</code> | <code>&quot;options.filename&quot;</code> | filename without path |

**Example**  
```js
Logger.info('Server has started')
Logger.info('Server has started', 'server.log')
```
<br />
<a name="Logger.debug"></a>

#### Logger.debug(debug, [filename]) ↩︎
<!-- Empty to hide the `**Kind**` tag in documentation -->
**Chainable**  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| debug | <code>string</code> |  | content of the log |
| [filename] | <code>string</code> | <code>&quot;options.filename&quot;</code> | filename without path |

**Example**  
```js
Logger.debug(`Client ID = ${clientID}`)
Logger.debug(`Client ID = ${clientID}`, 'clients.log')
```
<br />
<a name="Logger.warn"></a>

#### Logger.warn(warn, [filename]) ↩︎
<!-- Empty to hide the `**Kind**` tag in documentation -->
**Chainable**  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| warn | <code>string</code> |  | content of the log |
| [filename] | <code>string</code> | <code>&quot;options.filename&quot;</code> | filename without path |

**Example**  
```js
Logger.warn(`Database disconnected`)
Logger.warn(`Database disconnected`, 'connections.log')
```
<br />
<a name="Logger.error"></a>

#### Logger.error(error, [filename], [opts]) ↩︎
<!-- Empty to hide the `**Kind**` tag in documentation -->
**Chainable**  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| error | <code>string</code> |  | content of the log |
| [filename] | <code>string</code> | <code>&quot;options.filename&quot;</code> | filename without path |
| [opts] | <code>object</code> | <code>{}</code> | options |

**Example**  
```js
Logger.error(`Connection to 127.0.0.1:2000 refused`)
Logger.error(`Connection to 127.0.0.1:2000 refused`, 'logs.log')
```
<br />
<a name="Logger.fatal"></a>

#### Logger.fatal(fatal, [filename]) ↩︎
<!-- Empty to hide the `**Kind**` tag in documentation -->
**Chainable**  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| fatal | <code>string</code> |  | content of the log |
| [filename] | <code>string</code> | <code>&quot;options.filename&quot;</code> | filename without path |

**Example**  
```js
Logger.fatal(`Division by zero`)
Logger.fatal(`Division by zero`, 'big_errors.log')
```
<br />
<a name="Logger.clear"></a>

#### Logger.clear() ↩︎
<!-- Empty to hide the `**Kind**` tag in documentation -->
**Chainable**  

| Param | Type | Description |
| --- | --- | --- |
| [options.filename] | <code>string</code> | The filename of the file to clear or 'all' if all the files should be cleaned |

**Example**  
```js
Logger.clear() // clear the default file (options.filename)
Logger.clear('client.log')
Logger.clear('client.log', 'connections.log', 'logs.log')
Logger.clear('all')
```
<br />
<a name="Logger.getLevel"></a>

#### Logger.getLevel(level) ⇒ <code>array</code>
<!-- Empty to hide the `**Kind**` tag in documentation -->
**Returns**: <code>array</code> - [index, label]  

| Param | Type | Description |
| --- | --- | --- |
| level | <code>string</code> \| <code>number</code> | the index or the label of the level |

**Example**  
```js
const testLevel = Logger.getLevel('warn') // --> ["2", "WARN"]
const testLevel = Logger.getLevel(2)      // --> ["2", "WARN"]
```
<br />
<a name="Logger.addLevel"></a>

#### Logger.addLevel(newLevel) ⇒ <code>array</code>
<!-- Empty to hide the `**Kind**` tag in documentation -->
**Returns**: <code>array</code> - the level array : [index, label]  

| Param | Type | Description |
| --- | --- | --- |
| newLevel | <code>string</code> | The label of the new level |

**Example**  
```js
const [importantLevel, importantLabel] = Logger.addLevel('Important')
Logger.log('logs.log', importantLevel, 'Important message which will be display on top of all other levels')
```
<br />
<a name="Logger.on"></a>

#### Logger.on(event, callback)
<!-- Empty to hide the `**Kind**` tag in documentation -->

| Param | Type | Description |
| --- | --- | --- |
| event | <code>string</code> | 'log' | 'error' |
| callback | <code>function</code> |  |

**Example**  
```js
Logger.on('log', log => console.log(log))
Logger.on('error', handleErrorsFunction)
```
<br />
<br />
<a name="LevelsObject"></a>

### LevelsObject : <code>Object</code>
A dictionnary of the logger levels indexed by priority

<!-- Empty to hide the `**Kind**` tag in documentation -->
**Example**  
```js
levels = {
     0: 'INFO',
     1: 'DEBUG',
     2: 'WARNING',
     3: 'ERROR',
     4: 'FATAL'
 }
```
<br />
<a name="OptionsObject"></a>

### OptionsObject : <code>Object</code>
<!-- Empty to hide the `**Kind**` tag in documentation -->
**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| [filename] | <code>string</code> | <code>&quot;&#x27;logs.log&#x27;&quot;</code> | The name of the default log file |
| [folder] | <code>string</code> | <code>&quot;&#x27;./logs/&#x27;&quot;</code> | The folder where logs files will be located (sorry for the name, couldn't find more descriptive) |
| [extension] | <code>string</code> | <code>&quot;&#x27;.log&#x27;&quot;</code> | The extension to use for logs files |
| [useMoment] | <code>boolean</code> | <code>false</code> | Use momentjs to format the dates. Allow timezone options but has a performance cost |
| [timezone] | <code>string</code> | <code>&quot;&#x27;Europe/Berlin&#x27;&quot;</code> | The `moment` timezone for the date | Full list available at: https://momentjs.com/timezone |
| [console_logs] | <code>boolean</code> | <code>false</code> | Use console.log to displays logs instead of writting it in a log file |
| [displayLevel] | <code>string</code> \| <code>number</code> | <code>0</code> | The level below a log is not displayed |
| [showPID] | <code>boolean</code> | <code>false</code> | Display the PID of the process in the log |
| [showHostname] | <code>boolean</code> | <code>false</code> | Display the hostname in the log |

<br />

* * *

2020 &copy; Dorian Beauchesne
