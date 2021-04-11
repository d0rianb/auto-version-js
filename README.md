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
    * [.getVersion()](#AutoVersion.getVersion) ⇒ <code>string</code>
    * [.setVersion(version, [indentation])](#AutoVersion.setVersion)
    * [.parse(versionString)](#AutoVersion.parse) ⇒ [<code>VersionObject</code>](#VersionObject)
    * [.stringify(versionObject)](#AutoVersion.stringify) ⇒ <code>string</code>
    * [.toSemver(versionString)](#AutoVersion.toSemver) ⇒ <code>string</code>
    * [.increment(version, level)](#AutoVersion.increment) ⇒ <code>string</code>
    * [.major(version)](#AutoVersion.major) ⇒ <code>string</code>
    * [.minor(version)](#AutoVersion.minor) ⇒ <code>string</code>
    * [.patch(version)](#AutoVersion.patch) ⇒ <code>string</code>

<a name="AutoVersion.getVersion"></a>

#### AutoVersion.getVersion() ⇒ <code>string</code>
Return the current version of the project

<!-- Empty to hide the `**Kind**` tag in documentation -->
**Returns**: <code>string</code> - the version number  
<br />
<a name="AutoVersion.setVersion"></a>

#### AutoVersion.setVersion(version, [indentation])
Write the version number into package.json

<!-- Empty to hide the `**Kind**` tag in documentation -->

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| version | <code>string</code> |  | the version number |
| [indentation] | <code>number</code> | <code>4</code> | the number of space to pretty print the package.json file |

<br />
<a name="AutoVersion.parse"></a>

#### AutoVersion.parse(versionString) ⇒ [<code>VersionObject</code>](#VersionObject)
Extract the major, minor & patch number from a semver version number

<!-- Empty to hide the `**Kind**` tag in documentation -->

| Param |
| --- |
| versionString | 

<br />
<a name="AutoVersion.stringify"></a>

#### AutoVersion.stringify(versionObject) ⇒ <code>string</code>
Stringify a versionObject

<!-- Empty to hide the `**Kind**` tag in documentation -->
**Returns**: <code>string</code> - the version representation of the string  

| Param |
| --- |
| versionObject | 

<br />
<a name="AutoVersion.toSemver"></a>

#### AutoVersion.toSemver(versionString) ⇒ <code>string</code>
Convert a version into semver standard

<!-- Empty to hide the `**Kind**` tag in documentation -->
**Returns**: <code>string</code> - the semver version number  

| Param |
| --- |
| versionString | 

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

<br />
<a name="AutoVersion.major"></a>

#### AutoVersion.major(version) ⇒ <code>string</code>
Update the version number for a major update

<!-- Empty to hide the `**Kind**` tag in documentation -->
**Returns**: <code>string</code> - the new version number  

| Param | Type |
| --- | --- |
| version | <code>string</code> | 

<br />
<a name="AutoVersion.minor"></a>

#### AutoVersion.minor(version) ⇒ <code>string</code>
Update the version number for a minor update

<!-- Empty to hide the `**Kind**` tag in documentation -->
**Returns**: <code>string</code> - the new version number  

| Param | Type |
| --- | --- |
| version | <code>string</code> | 

<br />
<a name="AutoVersion.patch"></a>

#### AutoVersion.patch(version) ⇒ <code>string</code>
Update the version number for a patch update

<!-- Empty to hide the `**Kind**` tag in documentation -->
**Returns**: <code>string</code> - the new version number  

| Param | Type |
| --- | --- |
| version | <code>string</code> | 

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

<br />

* * *

2020 &copy; Dorian Beauchesne
