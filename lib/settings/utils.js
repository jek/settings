'use strict'

const {readFileSync} = require('fs')
const {basename, dirname, join, resolve} = require('path')

exports.normalizeLocalPath = function normalizeLocalPath (path) {
  if (!path.endsWith('.local')) {
    path += '.local'
  }
  const home = dirname(resolve(path))
  const name = basename(path, '.local')

  return {
    name: name,
    localPath: join(home, name + '.local'),
    schemaPath: join(home, name + '.schema')
  }
}

exports.normalizeLocalPaths = function normalizeLocalPaths (paths) {
  const nlp = paths.map(p => exports.normalizeLocalPath(p))
  return {
    localPaths: nlp.map(e => e.localPath),
    schemaPaths: nlp.map(e => e.schemaPath)
  }
}

exports.load = function load (path) {
  let raw
  try {
    raw = readFileSync(path)
  } catch (e) {
    if (e.code === 'ENOENT') {
      return undefined
    }
    throw e
  }
  return JSON.parse(raw, 'utf8')
}

exports.every = function every (iterable, predicate) {
  for (const i of iterable) {
    if (!predicate(i)) {
      return false
    }
  }
  return true
}

exports.ifilter = function * ifilter (iterable, predicate) {
  for (const i of iterable) {
    if (predicate(i)) {
      yield i
    }
  }
}

exports.imap = function * imap (iterable, predicate) {
  for (const i of iterable) {
    yield predicate(i)
  }
}

exports.some = function some (iterable, predicate) {
  for (const i of iterable) {
    if (predicate(i)) {
      return true
    }
  }
  return false
}

class MultiMap extends Map {
  get (key) {
    if (this.has(key)) {
      return super.get(key)[0]
    }
    return undefined
  }

  getAll (key) {
    return super.get(key)
  }

  add (key, value) {
    return this.push(key, value)
  }

  addAll (key, ...values) {
    this.pushAll(key, values)
    return this
  }

  push (key, ...value) {
    this._get(key).push(...value)
    return this
  }

  pushAll (key, values) {
    this._get(key).push(...values)
    return this
  }

  unshift (key, ...value) {
    this._get(key).unshift(...value)
    return this
  }

  unshiftAll (key, values) {
    this._get(key).unshift(...values)
    return this
  }

  _get (key) {
    let multi = super.get(key)
    if (multi === undefined) {
      multi = []
      super.set(key, multi)
    }
    return multi
  }

  * values () {
    for (const l of super.values()) {
      yield l[0]
    }
  }

  * valuesAll () {
    yield * super.values()
  }

  * entries () {
    for (const e of super.entries()) {
      yield [e[0], e[1][0]]
    }
  }

  * entriesEach () {
    for (const [key, multi] of super.entries()) {
      for (const value of multi) {
        yield [key, value]
      }
    }
  }

  * entriesAll () {
    yield * super.entries()
  }

  * [Symbol.iterator] () {
    yield * this.entries()
  }
}

exports.MultiMap = MultiMap

exports.mapSearch = function mapSearch (...maps) {
  function get (key) {
    for (const map of maps) {
      const value = map.get(key)
      if (value !== undefined) {
        return value
      }
    }
    return undefined
  }
  return get
}

exports.inspect = function inspect (obj) {
  const util = require('util')
  return util.inspect(obj, null, false)
}
