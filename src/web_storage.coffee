{Sync, pack, unpack} = module.exports


web_storage = (storage)->
  (name)->
    key = (_id)->
      "#{name}~#{_id}"

    load_index: ->
      str = storage.getItem(name)
      if str
        unpack.Array str
      else
        []

    load: (_id)->
      JSON.parse storage.getItem(key _id) || throw "Record Not Found"

    store_index: ( ids )->
      storage.setItem name, pack.Array ids

    store: (_id, model)->
      storage.setItem key(_id), JSON.stringify model

    delete: (_id)->
      storage.removeItem key _id


test = {}
testStorage =
  key: (idx)->
    Object.keys(test)[idx]

  setItem: (key, val)->
    test[key] = val
    console.log ":: #{key} => #{val}"
    undefined

  getItem: (key)->
    val = test[key]

  removeItem: (key)->
    val = test[key]
    delete test[key]
    console.log ":: #{key} delete (#{val})"
    undefined

Sync.session = web_storage sessionStorage if sessionStorage?
Sync.local = web_storage localStorage if localStorage?
Sync.test = web_storage testStorage
