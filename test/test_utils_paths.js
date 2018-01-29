'use strict'

const {test} = require('ava')
const {normalizeLocalPath, normalizeLocalPaths} = require('../lib/settings/utils')

test('normalizeLocalPath#.local', t => {
  const p1 = 'dir/xxx/../NAME.local'
  const {name, localPath, schemaPath} = normalizeLocalPath(p1)

  t.is(name, 'NAME')
  t.regex(localPath, new RegExp('^/.*/dir/NAME.local$'))
  t.regex(schemaPath, new RegExp('^/.*/dir/NAME.schema$'))
})

test('normalizeLocalPath#no-ext', t => {
  const p1 = 'dir/xxx/../NAME'
  const {name, localPath, schemaPath} = normalizeLocalPath(p1)

  t.is(name, 'NAME')
  t.regex(localPath, new RegExp('^/.*/dir/NAME.local$'))
  t.regex(schemaPath, new RegExp('^/.*/dir/NAME.schema$'))
})

test('normalizeLocalPaths', t => {
  const found = normalizeLocalPaths(['first', 'second'])

  t.is(found.localPaths.length, 2)
  t.is(found.schemaPaths.length, 2)
  t.true(found.localPaths[0].endsWith('first.local'))
  t.true(found.localPaths[1].endsWith('second.local'))
  t.true(found.schemaPaths[0].endsWith('first.schema'))
  t.true(found.schemaPaths[1].endsWith('second.schema'))
})
