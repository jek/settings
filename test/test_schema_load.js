'use strict'

const {test} = require('ava')
const {Schema, MalformedSchema} = require('../lib/settings/Schema')

test('read#grossly-malformed', t => {
  const schema = new Schema('synthetic')
  schema._json = ['xyzzy']

  t.throws(() => Array.from(schema.fields()), MalformedSchema)
})

function malformed (t, input, expected) {
  const schema = new Schema('synthetic')
  schema._json = input

  const e = t.throws(() => Array.from(schema.fields()), MalformedSchema)
  t.true(e.detail !== undefined)
  t.true(e.detail.has('field'))
  // t.log(e.detail.get('field'))
  if (expected) {
    t.true(e.detail.get('field'))
  }
}
malformed.title = (title, input) => `${title} -> ${JSON.stringify(input)}`.trim()

function formed (t, input, expected) {
  const schema = new Schema('synthetic')
  schema._json = input

  t.plan(1)
  for (const f of schema.fields()) {
    if (f.key === 'field') {
      if (expected) {
        t.true(expected(f))
      } else {
        t.true(f !== undefined)
      }
    }
  }
}
formed.title = (title, input) => `${title} -> ${JSON.stringify(input)}`.trim()

// no options

test('read#formed', formed,
     {field: {}},
     (f) => f.optional === false)
test('read#formed', formed,
     {field: {}},
     (f) => f.doc === undefined)
test('read#formed', formed,
     {field: {}},
     (f) => f.default === undefined)
test('read#formed', formed,
     {field: {}},
     (f) => f.inherit.size === 0)
test('read#formed', formed,
     {field: {}},
     (f) => f.source.path === 'synthetic')

// optional: boolean

test('read#formed', formed,
     {field: {optional: true}},
     (f) => f.optional === true)
test('read#formed', formed,
     {field: {optional: false}},
     (f) => f.optional === false)
test('read#malformed', malformed,
     {field: {optional: 'boom '}})

// doc: 'docstring'

test('read#formed', formed,
     {field: {doc: 'noboom'}},
     (f) => f.doc === 'noboom')
test('read#malformed', malformed,
     {field: {doc: ['boom']}})

// default: 'value {{template}}'

test('read#formed', formed,
     {field: {default: 'noboom'}},
     (f) => f.default.raw === 'noboom')
test('read#formed', formed,
     {field: {default: '{{noboom}}'}, noboom: {}},
     (f) => f.default.raw === '{{noboom}}')
test('read#malformed', malformed,
     {field: {default: ['boom']}})
test('read#malformed', malformed,
     {field: {default: '{{noboom}}'}})
test('read#formed', formed,
     {field: {default: '{{noboom}}'}, noboom: {}},
     (f) => f.refs.has('noboom'))
test('read#formed', formed,
     {field: {default: '{{noboom}}', inherit: ['noboom']}},
     (f) => f.refs.has('noboom'))
test('read#malformed', malformed,
     {field: {default: '{{noboom}}'}, other: {inherit: ['noboom']}})
test('read#formed', formed,
     {field: {default: '{{no}}{{boom}}'}, no: {}, boom: {}},
     (f) => f.refs.has('no') && f.refs.has('boom'))
test('read#formed', formed,
     {field: {default: 'boom', optional: false}})
test('read#malformed', malformed,
     {field: {default: 'boom', optional: true}})

// inherit: ['field', 'field']

test('read#formed', formed,
     {field: {inherit: []}})
test('read#formed', formed,
     {field: {inherit: ['noboom']}},
     (f) => {
       return (f.inherit.has('noboom')) &&
         (f.refs.has('noboom')) &&
         (f.default.raw === '{{noboom}}')
     })
test('read#formed', formed,
     {field: {inherit: ['no', 'boom']}},
     (f) => {
       return (f.inherit.size === 2) &&
         (f.refs.size === 0) &&
         (!f.default)
     })
test('read#malformed', malformed,
     {field: {inherit: 'boom'}})
test('read#malformed', malformed,
     {field: {inherit: [123]}})
test('read#malformed', malformed,
     {field: {inherit: ['boom', 'boom']}})
