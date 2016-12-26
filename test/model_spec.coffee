{ Collection, Query, Rule, Model } = require("../memory-record.js")


new Rule("model_spec").schema ->
  class @model extends @model

it "rowid sequence", ->
  Model.model_spec.create = (item)->
    item.rowid = @rowid
  Collection.model_spec.merge
    3: {}
    2: {}
    1: {}
  assert.deepEqual Query.model_specs.list, [
    { _id: 1, rowid: 0, model_spec_id: 1 }
    { _id: 2, rowid: 1, model_spec_id: 2 }
    { _id: 3, rowid: 2, model_spec_id: 3 }
  ]
  assert Model.model_spec.rowid = 3

it "catch create event", ->
  Model.model_spec.create = (item)->
    item.rowid = @rowid
    item.created = true

  Collection.model_spec.merge
    4: { a: 1 }
  assert.deepEqual Query.model_specs.hash[4], { a: 1, _id: 4, model_spec_id: 4, rowid: 3, created: true }

it "catch update event", ->
  Model.model_spec.update = (item, {rowid})->
    item.rowid = rowid
    item.updated = true

  Collection.model_spec.merge
    4: { a: 2 }
  assert.deepEqual Query.model_specs.hash[4], { a: 2, _id: 4, model_spec_id: 4, rowid: 3, updated: true }

it "catch delete event", ->
  Model.model_spec.delete = (old)->
    old.deleted = true

  target = Query.model_specs.hash[3]
  Collection.model_spec.del
    _id: 3
  assert.deepEqual target, { _id: 3, model_spec_id: 3, rowid: 2, deleted: true }
