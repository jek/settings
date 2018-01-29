'use strict'

const {existsSync} = require('fs')
const {basename} = require('path')
const {MultiMap, load} = require('./utils')
const {Value} = require('./value')

class EffectiveLocal extends MultiMap {
  constructor (...paths) {
    super()
    this.sources = []
    for (const path of paths) {
      this.addLocal(new Local(path))
    }
  }

  addLocal (local) {
    // Malformed json errors are fatal.
    this.sources.push(local)
    for (const value of local.fields()) {
      this.add(value.key, value)
    }
  }
}

class Local {
  constructor (path) {
    this.path = path
  }

  get name () {
    return basename(this.path, '.local')
  }

  get exists () {
    return existsSync(this.path)
  }

  get json () {
    if (this._json) {  // private test injection point
      return this._json
    }
    return load(this.path)
  }

  * fields () {
    let values
    try {
      values = this.json
    } catch (e) {
      throw new MalformedLocal(this, e)
    }
    for (const key in values) {
      yield new Value(values[key], key, this)
    }
  }
}

class MalformedLocal extends TypeError {
  constructor (local, ex) {
    super(`Malformed local at ${local.path}`)
    this.local = local
    this.ex = ex
  }
}

exports.EffectiveLocal = EffectiveLocal
exports.Local = Local
exports.MalformedLocal = MalformedLocal
