'use strict'

class Value {
  constructor (value, key, source) {
    this.value = value
    this.key = key
    this.source = source
  }
}

class ProducedValue extends Value {
  constructor (value, key, source, production) {
    /* if source is local, compare against .doc */

  }
}


exports.Value = Value
