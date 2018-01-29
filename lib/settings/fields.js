'use strict'

const {inspect} = require('util')

class Default {
  constructor (raw) {
    this.raw = raw
    this.refs = this._parse(raw)
  }

  produce (ctx) {
    const re = /{{(.*?)}}/g
    const replace = (_, key) => ctx.get(key).value
    return this.raw.replace(re, replace)
  }

  _parse (raw) {
    if (!raw.includes('{{')) {
      return []
    }
    const re = /{{(.*?)}}/g
    const refs = []
    let m
    while ((m = re.exec(raw))) {
      refs.push(m[1])
    }
    return refs
  }
}

class Field {
  constructor (key, schema, source) {
    this.key = key
    this.source = source
    this.inherit = new Set()
    this.refs = new Set()
    this.default = undefined
    this.optional = false
    this.doc = undefined
    this.load(schema)
  }
  load (schema) {
    if (schema.hasOwnProperty('optional')) {
      this.optional = schema.optional
    }

    this.doc = schema.doc

    if (schema.inherit) {
      for (const dep of schema.inherit) {
        this.inherit.add(dep)
      }
      if (schema.inherit.length === 1 && !schema.default) {
        const def = schema.inherit[0]
        this.refs.add(def)
        this.default = new Default(`{{${def}}}`)
        return
      }
    }

    if (schema.default) {
      this.default = new Default(schema.default)
      for (const dep of this.default.refs) {
        this.refs.add(dep)
      }
    }
  }
}

exports.Field = Field
