'use strict'

const fs = require('fs')
const tempy = require('tempy')
const {test} = require('ava')
const {Local, MalformedLocal} = require('../lib/settings/local')

test('read#grossly-malformed', t => {
  const path = tempy.file()
  fs.writeFileSync(path, 'derp{son')

  const local = new Local(path)
  t.throws(() => Array.from(local.fields()), MalformedLocal)
})

test('read#success', t => {
  const local = new Local('synthetic')
  local._json = {field: 'value'}

  const fields = Array.from(local.fields())
  t.is(fields.length, 1)
  t.is(fields[0].key, 'field')
  t.is(fields[0].value, 'value')
  t.is(fields[0].source.path, 'synthetic')
})
