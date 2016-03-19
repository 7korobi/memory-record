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


string_parser = (val)->
  switch val
    when "", null, undefined
      ""
    else
      String(val)

string_serializer = (val)->
  switch val
    when "", null, undefined
      ""
    else
      String(val).replace ///[~\/=.&\?\#\[\]()\"'`;]///g, (s)->
        "%" + s.charCodeAt(0).toString(16)


array_base_parser = (val)->
  if Array.isArray(val)
    val
  else
    "#{val}".split ","



pack =
  Url: {}

  Thru: (o)-> o

  Keys: (val)->
    list =
      if Array.isArray(val)
        val
      else
        for key, item of val
          continue unless item
          key
    pack.Array list.sort()

  Array: (val)->
    if Array.isArray(val)
      val.join ","
    else
      "#{val}"

  Date: (val)->
    time = Math.floor val
    result = ""
    while time >= 1
      result += serial.to_s[time % serial.size]
      time = Math.floor time / serial.size
    result

  Bool: (bool)->
    if bool then "T" else "F"

  Number:    string_serializer
  Text:      string_serializer
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
    while script = pattern.exec(html)
      codes.push script[1]
    new Function "window", codes.join "\n"

  Keys: (val)->
    hash = {}
    if val.length
      list = array_base_parser(val)
      for key in list
        hash[key] = true
    else
      for key, bool of val
        hash[key] = true if bool
    hash

  Array: (val)->
    if val.length
      array_base_parser(val)
    else
      []

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

  Number: Number
  Text:      string_parser
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
      pack.Date(date * patch_size + count)

for key, func of unpack
  Serial.url[key] =
    switch key
      when "Number"
        "([-]?[\\.0-9]+)"
      when "Date"
        "([0-9a-zA-Z]+)"
      when "Array", "Keys"
        "([^\\~\\/\\=\\.\\&\\[\\]\\(\\)\\\"\\'\\`\\;]*)"
      when "Text"
        "([^\\~\\/\\=\\.\\&\\[\\]\\(\\)\\\"\\'\\`\\;]*)"
      else
        "([^\\~\\/\\=\\.\\&\\[\\]\\(\\)\\\"\\'\\`\\;]+)"

Mem = module.exports
Mem.pack = pack
Mem.unpack = unpack
Mem.Serial = Serial
