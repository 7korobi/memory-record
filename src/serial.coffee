
OBJ = ->
  new Object null

serial = null
base = (code)->
  serial =
    to_s: code
    to_i: {}
  for c, n in serial.to_s
    serial.to_i[c] = n
  serial.size = serial.to_s.length

# base64url "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
base "0123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
patch_size = serial.size * serial.size * serial.size


textfy = (cb)->
  (val)->
    switch val
      when "", null, undefined
        ""
      else
        cb val

string_parser = string_serializer = textfy String
symbol_parser = textfy decodeURI
url_serializer = textfy encodeURI
symbol_serializer = textfy (val)->
  String(val).replace ///[~\/=.&\?\#\[\]()\"'`;]///g, (s)->
    "%" + s.charCodeAt(0).toString(16).toUpperCase()

array_base_parser = (val)->
  return val if Array.isArray val
  switch val
    when "", null, undefined
      []
    else
      string_parser(val).split ","

pack =
  Url: {}

  Thru: (o)-> o

  Keys: (val)->
    list =
      if Array.isArray val
        val
      else
        for key, item of val
          continue unless item
          key
    pack.Array list.sort()

  Array: (val)->
    if Array.isArray val
      val.join ","
    else
      string_parser val

  Date: (val)->
    time = Math.floor val
    result = ""
    while time >= 1
      result += serial.to_s[time % serial.size]
      time = Math.floor time / serial.size
    result

  Bool: (bool)->
    if bool then "T" else "F"

  Text:      symbol_serializer
  Cookie:    symbol_serializer
  Url:       url_serializer

  Number:    string_serializer
  String:    string_serializer
  null:      string_serializer
  undefined: string_serializer



unpack =
  Url: {}

  Thru: (o)-> o

  HtmlGon: (html)->
    pattern = ///
      <script.*?>([\s\S]*?)</script>
    ///ig
    codes = []
    while script = pattern.exec html
      codes.push script[1]
    new Function "window", codes.join "\n"

  Keys: (val)->
    hash = OBJ()
    if val.length
      list = array_base_parser val
      for key in list
        hash[key] = true
    else
      for key, bool of val
        hash[key] = true if bool
    hash

  Array: (val)->
    array_base_parser val

  Date: (code)->
    return code if 0 < code
    base = 1
    result = 0
    for c in code
      n = serial.to_i[c]
      unless n?
        return Number.NaN
      result += n * base
      base *= serial.size
    result

  Bool: (val)->
    switch val
      when true, "T"
        true
      when false, "F"
        false
      else
        Number.NaN

  Text:      symbol_parser
  Cookie:    symbol_parser
  Url:       symbol_parser

  Number: Number
  String:    string_parser
  null:      string_parser
  undefined: string_parser

Serial =
  url: {}
  ID:
    now: ->
      Serial.ID.at _.now()
    at: (date, count)->
      count ?= Math.random() * patch_size
      pack.Date date * patch_size + count

escaped = "([^\\~\\/\\=\\.\\&\\[\\]\\(\\)\\\"\\'\\`\\;]*)"
for key, func of unpack
  Serial.url[key] =
    switch key
      when "Number"
        "([-]?[\\.0-9]+)"
      when "Date"
        "([0-9a-zA-Z]+)"
      when "Array", "Keys"
        escaped
      when "Url", "Cookie"
        escaped
      when "Text"
        escaped
      else
        escaped

Mem = module.exports
Mem.pack = pack
Mem.unpack = unpack
Mem.Serial = Serial
