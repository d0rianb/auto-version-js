# Auto Version JS

[![npm version](https://badgen.net/npm/v/auto-version-js)](https://www.npmjs.com/package/npm-auto-version)
[![npm downloads](https://badgen.net/npm/dt/auto-version-js)](https://www.npmjs.com/package/npm-auto-version)

`auto-version-js` is a light & fast NPM library to **automatically increase the version number** of a package.

## Installation
First, install the npm package :
```bash
npm i -D auto-version-js
```

Then to increment the version number, simply run :
```bash
npx auto-version --patch  # +0.0.1
npx auto-version --minor  # +0.1.0
npx auto-version --major  # +1.0.0
npx auto-version          # no args is equivalent to --patch
```

To implement it in your `package.json` file :
```json
"scripts": {
    "publish": "npx auto-version && npm publish"
}
```


## Documentation

In this library, `versionString` represents a version as a string : `'1.2.3'` and `versionObject` represents a version as an object : `{ major: 1, minor: 2, patch: 3 }`

### Classes

<dl>
<dt><a href="#AutoVersion">AutoVersion</a></dt>
<dd></dd>
</dl>

### Typedefs

<dl>
<dt><a href="#VersionObject">VersionObject</a> : <code>Object</code></dt>
<dd></dd>
</dl>

<a name="AutoVersion"></a>

### AutoVersion
<!-- Empty to hide the `**Kind**` tag in documentation -->

* [AutoVersion](#AutoVersion)
    * [.getLocalPath()](#AutoVersion.getLocalPath) ⇒ <code>string</code>
    * [.getPackageJSON([pathname])](#AutoVersion.getPackageJSON) ⇒ <code>JSON</code>
    * [.getVersion([pathname])](#AutoVersion.getVersion) ⇒ <code>string</code>
    * [.setVersion(version, [pathname], [indentation])](#AutoVersion.setVersion)
    * [.parse(versionString)](#AutoVersion.parse) ⇒ [<code>VersionObject</code>](#VersionObject)
    * [.stringify(versionObject)](#AutoVersion.stringify) ⇒ <code>string</code>
    * [.toSemver(versionString)](#AutoVersion.toSemver) ⇒ <code>string</code>
    * [.increment(version, level)](#AutoVersion.increment) ⇒ <code>string</code>
    * [.major(version)](#AutoVersion.major) ⇒ <code>string</code>
    * [.minor(version)](#AutoVersion.minor) ⇒ <code>string</code>
    * [.patch(version)](#AutoVersion.patch) ⇒ <code>string</code>

<a name="AutoVersion.getLocalPath"></a>

#### AutoVersion.getLocalPath() ⇒ <code>string</code>
Return the path of the project

<!-- Empty to hide the `**Kind**` tag in documentation -->
**Returns**: <code>string</code> - the path of the project where the package.json is located  
<br />
<a name="AutoVersion.getPackageJSON"></a>

#### AutoVersion.getPackageJSON([pathname]) ⇒ <code>JSON</code>
Return the package.json file of the project

<!-- Empty to hide the `**Kind**` tag in documentation -->
**Returns**: <code>JSON</code> - the package.json  

| Param | Type | Description |
| --- | --- | --- |
| [pathname] | <code>string</code> | the path of the package.json |

<br />
<a name="AutoVersion.getVersion"></a>

#### AutoVersion.getVersion([pathname]) ⇒ <code>string</code>
Return the current version of the project

<!-- Empty to hide the `**Kind**` tag in documentation -->
**Returns**: <code>string</code> - the version number  

| Param | Type | Description |
| --- | --- | --- |
| [pathname] | <code>string</code> | the path of the package.json |

**Example**  
```js
AutoVersion.getVersion()              // --> the version of the current project | ex : 0.5.2
AutoVersion.getVersion('../any/dir')  // --> the version of the project in this directory
```
<br />
<a name="AutoVersion.setVersion"></a>

#### AutoVersion.setVersion(version, [pathname], [indentation])
Write the version number into package.json

<!-- Empty to hide the `**Kind**` tag in documentation -->

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| version | <code>string</code> |  | the version number |
| [pathname] | <code>string</code> |  | the path of the package.json |
| [indentation] | <code>number</code> | <code>4</code> | the number of space to pretty print the package.json file |

**Example**  
```js
AutoVersion.setVersion('0.2.3')
AutoVersion.setVersion('0.2.3', '../any/dir')
AutoVersion.setVersion('0.2.3', '../any/dir', 4)  // the package.json will be indented with 4 spaces
```
<br />
<a name="AutoVersion.parse"></a>

#### AutoVersion.parse(versionString) ⇒ [<code>VersionObject</code>](#VersionObject)
Extract the major, minor & patch number from a semver version number

<!-- Empty to hide the `**Kind**` tag in documentation -->

| Param |
| --- |
| versionString | 

**Example**  
```js
AutoVersion.parse('1.4.2')  // --> {major: 1, minor: 4, patch: 2}
```
<br />
<a name="AutoVersion.stringify"></a>

#### AutoVersion.stringify(versionObject) ⇒ <code>string</code>
Stringify a versionObject

<!-- Empty to hide the `**Kind**` tag in documentation -->
**Returns**: <code>string</code> - the version representation of the string  

| Param |
| --- |
| versionObject | 

**Example**  
```js
AutoVersion.stringify({major: 1, minor: 4, patch: 2})  // --> '1.4.2'
```
<br />
<a name="AutoVersion.toSemver"></a>

#### AutoVersion.toSemver(versionString) ⇒ <code>string</code>
Convert a version into semver standard

<!-- Empty to hide the `**Kind**` tag in documentation -->
**Returns**: <code>string</code> - the semver version number  

| Param |
| --- |
| versionString | 

**Example**  
```js
AutoVersion.toSemver('1.3.5')      // --> '1.3.5'
AutoVersion.toSemver('1.3')        // --> '1.3.0'
AutoVersion.toSemver('v1.3.5')     // -->  '1.3.5'
AutoVersion.toSemver('version 3')  // -->  '3.0.0'
```
<br />
<a name="AutoVersion.increment"></a>

#### AutoVersion.increment(version, level) ⇒ <code>string</code>
Increment the version number

<!-- Empty to hide the `**Kind**` tag in documentation -->
**Returns**: <code>string</code> - the incremented version number  

| Param | Type | Description |
| --- | --- | --- |
| version | <code>string</code> |  |
| level | <code>string</code> | major | minor | patch |

**Example**  
```js
AutoVersion.increment('0.4.7', 'patch')  // --> '0.4.8'
AutoVersion.increment('0.4.7', 'minor')  // --> '0.5.0'
AutoVersion.increment('0.4.7', 'major')  // --> '1.0.0'
```
<br />
<a name="AutoVersion.major"></a>

#### AutoVersion.major(version) ⇒ <code>string</code>
Update the version number for a major update

<!-- Empty to hide the `**Kind**` tag in documentation -->
**Returns**: <code>string</code> - the new version number  

| Param | Type |
| --- | --- |
| version | <code>string</code> | 

**Example**  
```js
AutoVersion.major('1.0.0')  // --> '2.0.0'
AutoVersion.major('0.5.9')  // --> '1.0.0'
```
<br />
<a name="AutoVersion.minor"></a>

#### AutoVersion.minor(version) ⇒ <code>string</code>
Update the version number for a minor update

<!-- Empty to hide the `**Kind**` tag in documentation -->
**Returns**: <code>string</code> - the new version number  

| Param | Type |
| --- | --- |
| version | <code>string</code> | 

**Example**  
```js
AutoVersion.minor('1.0.0')  // --> '1.1.0'
AutoVersion.minor('0.5.8')  // --> '0.6.0'
```
<br />
<a name="AutoVersion.patch"></a>

#### AutoVersion.patch(version) ⇒ <code>string</code>
Update the version number for a patch update

<!-- Empty to hide the `**Kind**` tag in documentation -->
**Returns**: <code>string</code> - the new version number  

| Param | Type |
| --- | --- |
| version | <code>string</code> | 

**Example**  
```js
AutoVersion.patch('1.0.0')  // --> '1.0.1'
AutoVersion.patch('0.5.9')  // --> '0.5.10'
```
<br />
<br />
<a name="VersionObject"></a>

### VersionObject : <code>Object</code>
<!-- Empty to hide the `**Kind**` tag in documentation -->
**Properties**

| Name | Type |
| --- | --- |
| major | <code>number</code> | 
| minor | <code>number</code> | 
| patch | <code>number</code> | 

**Example**  
```js
{major: 1, minor: 3, patch: 7}  // represents 1.3.7
```
<br />

* * *

2020 &copy; Dorian Beauchesne
