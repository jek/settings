'use strict'
/* globals module */

const {MalformedSchema} = require('./schema')
const {Production} = require('./production')

function open (...paths) {
  try {
    return new Production(...paths)
  } catch (e) {
    if (e.constructor === MalformedSchema) {
      console.log(`Error parsing schema ${e.schema.path}`)
      console.log(e.detail)
    }
    throw e
  }
}

module.exports = open
