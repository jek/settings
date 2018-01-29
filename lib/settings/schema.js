'use strict'
/* globals exports */

const {existsSync} = require('fs')
const {basename} = require('path')
const {Field} = require('./fields')
const {MultiMap, load} = require('./utils')
const Resolver = require('dependency-resolver')

class EffectiveSchema extends MultiMap {
  constructor (...paths) {
    super()
    this.fields = new Map()
    this.sources = []
    for (const path of paths) {
      this.addSchema(new Schema(path))
    }
  }

  addSchema (schema) {
    // Malformed schema errors are fatal and will throw up
    this.sources.push(schema)
    for (const field of schema.fields()) {
      this.add(field.key, field)
    }
  }

  ancestorDeps () {
    const deps = new Set()
    for (const key of this.keys()) {
      const field = this.get(key)
      for (const dep of field.inherit) {
        deps.add(dep)
      }
    }
    return deps
  }

  * dependencyOrderedFields () {
    if (this.size === 0) {
      return
    }
    const resolver = new Resolver()
    for (const field of this.values()) {
      resolver.add(field.key)
      for (const ref of field.refs) {
        resolver.setDependency(field.key, ref)
      }
    }
    for (const key of resolver.sort()) {
      yield this.get(key)
    }
  }
}

class Schema {
  constructor (path) {
    this.path = path
  }

  get name () {
    return basename(this.path, '.schema')
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
    let json
    try {
      json = this.json
    } catch (e) {
      throw new MalformedSchema(this, null, e)
    }
    const errors = new MultiMap()
    const validator = new CrossValidator()
    for (const key in json || {}) {
      try {
        validate(json[key])
      } catch (e) {
        errors.pushAll(key, e.errors)
        continue
      }
      const field = new Field(key, json[key], this)
      validator.log(field)
      yield field
    }
    validator.validateInto(errors)
    if (errors.size) {
      // console.log(errors)
      throw new MalformedSchema(this, errors)
    }
  }
}

const validate = (() => {
  const schema = {
    'type': 'object',
    'properties': {
      'doc': { 'type': 'string' },
      'default': { 'type': 'string' },
      'optional': { 'type': 'boolean' },
      'inherit': {
        'type': 'array',
        'uniqueItems': true,
        'items': { 'type': 'string' }
      }
    },
    'additionalProperties': false,
    'if': {
      'properties': { 'optional': { 'const': true } },
      'required': ['optional']
    },
    'then': {
      'not': { 'required': ['default'] }
    }
  }

  const ajv = new (require('ajv'))({ allErrors: true })
  const validator = ajv.compile(schema)

  const validate = (data) => {
    if (validator(data)) {
      return true
    }
    const e = new TypeError()
    e.errors = validator.errors
    throw e
  }
  return validate
})()

class CrossValidator {
  constructor () {
    this.refs = new Map()
  }

  log (field) {
    this.refs.set(field.key, [field.refs, field.inherit])
    return field
  }

  validateInto (errors) {
    for (const [key, [refs, inherits]] of this.refs.entries()) {
      for (const needed of refs) {
        if (needed === key) {
          // No self refs
          errors.push(key, `FIXME ${key}.default references itself`)
        } else if (inherits.has(needed)) {
          // Field can reference its own inherits
          continue
        } else if (this.refs.has(needed)) {
          // Otherwise it has to have been produced in the schema load
          continue
        }
        errors.push(key, `FIXME ${key}.default references ${needed} ` +
                    `which is not provided in this schema`)
      }
    }
  }
}

class MalformedSchema extends TypeError {
  constructor (schema, errors, ex) {
    super(`Malformed schema at ${schema.path}`)
    this.schema = schema
    this.detail = errors
    this.ex = ex
  }
}

exports.Schema = Schema
exports.EffectiveSchema = EffectiveSchema
exports.MalformedSchema = MalformedSchema
