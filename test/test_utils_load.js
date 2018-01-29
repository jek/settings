'use strict'

const fs = require('fs')
const {test} = require('ava')
const tempy = require('tempy')
const {load} = require('../lib/settings/utils')

test('load#success', t => {
  const data = {'key': 'value'}
  const json = JSON.stringify(data)
  const tmp = tempy.file()
  fs.writeFileSync(tmp, json)
  const found = load(tmp)

  t.deepEqual(found, data)
})

test('load#silent-ignore-missing', t => {
  const tmp = tempy.file()
  t.not(fs.existsSync(tmp))

  const found = load(tmp)
  t.is(found, undefined)
})

test('load#access-failure-throws', t => {
  const tmp = tempy.file()
  fs.writeFileSync(tmp, '{}', {mode: 0o220})

  const error = t.throws(() => load(tmp), Error)
  t.is(error.code, 'EACCES')  // portable?
})

test('load#deserialization-failure-throws', t => {
  const tmp = tempy.file()
  fs.writeFileSync(tmp, 'derp{son')

  t.throws(() => load(tmp), SyntaxError)
})
