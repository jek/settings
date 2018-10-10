'use strict'

const {MultiMap, mapSearch, normalizeLocalPaths} = require('./utils')
const {EffectiveSchema} = require('./schema')
const {EffectiveLocal} = require('./local')
const {Value} = require('./value')

class Production extends MultiMap {
  constructor (paths, ancestor) {
    super()

    // Accumulator for non-crashing production errors
    this.lint = new MultiMap()

    this.ancestor = ancestor

    if (paths !== undefined) {
      const {localPaths, schemaPaths} = normalizeLocalPaths(paths)

      // Schema validation errors crash here
      this.schema = new EffectiveSchema(...schemaPaths)

      // JSON parsing errors crash here
      this.local = new EffectiveLocal(...localPaths)
    }
  }

  produce () {
    /* [field] -> [env.local, .local, .settings]
       -> .value
       -> .source { Local or Schema }
       .getFieldSchema(key) -> field or null

       produce locals
       [env.local, .local]

       run schema:
       - import 'inherits' (satisfied?)
       - produce all defaults (append to multimap)
    */
    // new ideas: { regex: "/regex" }

    this._setLocals()
    this._setDefaults()
    // Post-validation:
    //   - which locals have values == field.doc?
    //   - which defaults couldn't build because of missing refs?
    //   - what required keys are missing from final production?
    //   - what locals are present that lack schema?
    // CONSIDER doing these checks in action methods & stash on a per-key lint channel
  }

  _setLocals () {
    for (const [key, multi] of this.local.entriesAll()) {
      // highest prio -> lowest prio
      this.unshiftAll(key, multi)  // TODO: new Value wrapper pointing to this production?
      if (! this.schema.contains(key)) {
        this.lint.push(key, `Value has no schema`)  // Need *which* value including source & production
        // implies lint channel is on the production value itself
        // and production value has .invalid and .linty roll-up properties
      }
    }
  }

  _setDefaults () {
    const inherits = this._gatherInherits(this.ancestor || new Map())

    for (const field of this.schema.dependencyOrderedFields()) {
      if (!field.default) {
        continue
      }
      const value = this._produceDefaultValue(field, inherits)
      this.push(field.key, new Value(value, field.key, field.source))
    }
  }

  _produceDefaultValue (field, inherits) {
    const def = field.default
    if (!def.refs.length) {
      return def.raw
    }

    // Build default eval context by harvesting ref.deps
    // from this production + inheritance, if declared
    const deepLookup = mapSearch(this, inherits)
    const ctx = new Map()
    for (const ref of def.refs) {
      let value
      if (field.inherit.has(ref)) {
        value = deepLookup(ref)
      } else {
        value = this.get(ref)
      }
      ctx.set(ref, value)
    }

    return def.produce(ctx)
  }

  _gatherInherits (ancestor) {
    const inherits = new Map()
    const missing = []
    for (const key of this.schema.ancestorDeps()) {
      const value = ancestor.get(key)
      if (value === undefined) {
        missing.push(key)
      } else {
        inherits.set(key, value)
      }
    }
    if (missing.length === 0) {
      return inherits
    }
    // Crash: (category: schema error)
    console.log(`Missing ${missing.length} keys from ancestry`)
    throw new Error('TODO Missing ancestry keys')
  }
}

class Lint {
  constructor (fixme) {
    this.fixme = fixme
  }
}

exports.Production = Production
