'use strict'

const {test} = require('ava')
const {EffectiveSchema, Schema} = require('../lib/settings/schema')
const {EffectiveLocal, Local} = require('../lib/settings/local')
const {Production} = require('../lib/settings/production')

function produce (schemaData, localData, ancestor) {
  const es = new EffectiveSchema()
  for (const data of schemaData) {
    const schema = new Schema()
    schema._json = data
    es.addSchema(schema)
  }
  const el = new EffectiveLocal()
  for (const data of localData) {
    const local = new Local()
    local._json = data
    el.addLocal(local)
  }

  const p = new Production()
  p.schema = es
  p.local = el
  p.ancestor = ancestor
  p.produce()
  return toObject(p)
}

function toObject (production) {
  const obj = {}
  for (const [key, value] of production.entries()) {
    obj[key] = value.value
  }
  return obj
}

test('produce#empty-all', t => {
  const found = produce([{}], [{}])
  t.deepEqual(found, {})
})

test('produce#empty-schema', t => {
  const found = produce([{}], [{field: 'value'}])
  t.deepEqual(found, {field: 'value'})
})

test('produce#empty-local', t => {
  const found = produce([{field: {default: 'value'}}], [{}])
  t.deepEqual(found, {field: 'value'})
})

test('produce#default-from-local', t => {
  const found = produce(
    [{field: {default: '{{source}}'}, source: {}}],
    [{source: 'local'}])
  const expected = { field: 'local', source: 'local' }
  t.deepEqual(found, expected)
})

test('produce#default-from-peer', t => {
  const found = produce(
    [{field: {default: '{{source}}'}, source: {default: 'peer'}}],
    [{}])
  const expected = { field: 'peer', source: 'peer' }
  t.deepEqual(found, expected)
})

test('produce#default-from-local-mixed', t => {
  const found = produce(
    [{field: {default: '{{source}}'}, source: {default: 'peer'}}],
    [{source: 'local'}])
  const expected = { field: 'local', source: 'local' }
  t.deepEqual(found, expected)
})

test('produce#default-from-peer-cascade', t => {
  const found = produce(
    [{
      f1: {default: 'f1({{f2}})'},
      f2: {default: 'f2({{f3}})'},
      f3: {default: 'f3({{f4}})'},
      f4: {default: 'f4'}
    }],
    [{}])
  const expected = {
    f1: 'f1(f2(f3(f4)))',
    f2: 'f2(f3(f4))',
    f3: 'f3(f4)',
    f4: 'f4'
  }
  t.deepEqual(found, expected)
})

test('produce#default-from-mixed-cascade', t => {
  const found = produce(
    [{
      f1: {default: 'f1({{f2}})'},
      f2: {default: 'f2({{f3}})'},
      f3: {default: 'f3({{f4}})'},
      f4: {default: 'f4'}
    }],
    [{f2: 'xyzzy'}])
  const expected = {
    f1: 'f1(xyzzy)',
    f2: 'xyzzy',
    f3: 'f3(f4)',
    f4: 'f4'
  }
  t.deepEqual(found, expected)
})

test('produce#default-from-peer-diamond', t => {
  const found = produce(
    [{
      r: {default: 'b'},
      b1: {default: '{{r}}i'},
      b2: {default: '{{r}}a'},
      m: {default: '{{b1}}ng {{b2}}ng'}
    }],
    [{}])
  const expected = {
    r: 'b',
    b1: 'bi',
    b2: 'ba',
    m: 'bing bang'
  }
  t.deepEqual(found, expected)
})

test('produce#optional-omitted', t => {
  const found = produce(
    [{field: {optional: true}}],
    [{}])
  const expected = {}
  t.deepEqual(found, expected)
})

test('produce#optional-supplied', t => {
  const found = produce(
    [{field: {optional: true}}],
    [{field: 'value'}])
  const expected = {field: 'value'}
  t.deepEqual(found, expected)
})

test(t => t.pass())
