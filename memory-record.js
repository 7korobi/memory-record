/**
 memory-record - activerecord like in-memory data manager
 @version v0.2.0
 @link https://github.com/7korobi/memory-record
 @license 
**/


(function() {
  var sort;

  sort = [].sort;

  Object.defineProperties(Array.prototype, {
    first: {
      get: function() {
        return this[0];
      }
    },
    last: {
      get: function() {
        return this[this.length - 1];
      }
    },
    cycle: {
      value: function(n) {
        var i, idx, ref, results;
        results = [];
        for (idx = i = 0, ref = n; 0 <= ref ? i <= ref : i >= ref; idx = 0 <= ref ? ++i : --i) {
          results.push(this[idx % this.length]);
        }
        return results;
      }
    }
  });

}).call(this);

(function() {
  var Mem;

  module.exports = Mem = {
    Query: {},
    Model: {},
    Collection: {}
  };

}).call(this);

(function() {
  var Mem, _;

  _ = require("lodash");

  Mem = module.exports;

  Mem.Finder = (function() {
    function Finder(sortBy1, orderBy1) {
      var all;
      this.sortBy = sortBy1;
      this.orderBy = orderBy1;
      all = new Mem.Query(this, [], this.sortBy, this.orderBy);
      all._memory = {};
      this.scope = {
        all: all
      };
      this.query = {
        all: all
      };
    }

    Finder.prototype.rehash = function(rules) {
      var i, len, rule;
      delete this.query.all._reduce;
      delete this.query.all._list;
      delete this.query.all._hash;
      this.query = {
        all: this.query.all
      };
      for (i = 0, len = rules.length; i < len; i++) {
        rule = rules[i];
        rule.rehash();
      }
    };

    Finder.prototype._reduce = function(query) {
      var base, calc, emits, i, id, init, item, len, map, o, path, paths, reduce, ref, ref1, ref2;
      init = function(map) {
        var o;
        o = {};
        if (map.count) {
          o.count = 0;
        }
        if (map.all) {
          o.all = 0;
        }
        if (map.list) {
          o.list = [];
        }
        if (map.set) {
          o.set = {};
        }
        return o;
      };
      reduce = function(item, o, map) {
        if (map.list) {
          o.list.push(map.list);
        }
        if (map.set) {
          o.set[map.set] = true;
        }
        if (!(map.max <= o.max)) {
          o.max_is = item;
          o.max = map.max;
        }
        if (!(o.min <= map.min)) {
          o.min_is = item;
          o.min = map.min;
        }
        if (map.count) {
          o.count += map.count;
        }
        if (map.all) {
          return o.all += map.all;
        }
      };
      calc = function(o) {
        if (o.all && o.count) {
          return o.avg = o.all / o.count;
        }
      };
      base = {};
      paths = {};
      ref = query._memory;
      for (id in ref) {
        ref1 = ref[id], item = ref1.item, emits = ref1.emits;
        for (i = 0, len = emits.length; i < len; i++) {
          ref2 = emits[i], path = ref2[0], map = ref2[1];
          o = _.get(base, path);
          if (!o) {
            o = paths[path.join(".")] = init(map);
            _.set(base, path, o);
            o;
          }
          reduce(item, o, map);
        }
      }
      for (path in paths) {
        o = paths[path];
        calc(o);
      }
      return query._reduce = base;
    };

    Finder.prototype._sort = function(query) {
      var orderBy, sortBy;
      sortBy = query.sortBy, orderBy = query.orderBy;
      if (sortBy != null) {
        return query._list = orderBy != null ? _.orderBy(query._list, sortBy, orderBy) : _.sortBy(query._list, sortBy);
      }
    };

    Finder.prototype._group = function(query) {
      var id, o, reduce, ref, target;
      ref = query._distinct, reduce = ref.reduce, target = ref.target;
      return query._list = (function() {
        var ref1, results;
        ref1 = query._reduce[reduce];
        results = [];
        for (id in ref1) {
          o = ref1[id];
          results.push(o[target]);
        }
        return results;
      })();
    };

    Finder.prototype._list = function(query, all) {
      var chk, deploy, every, id, o;
      if (query._memory === all) {
        deploy = function(id, o) {
          return query._hash[id] = o.item;
        };
      } else {
        query._memory = {};
        deploy = function(id, o) {
          query._memory[id] = o;
          return query._hash[id] = o.item;
        };
      }
      query._hash = {};
      return query._list = (function() {
        var i, len, ref, results;
        results = [];
        for (id in all) {
          o = all[id];
          every = true;
          ref = query.filters;
          for (i = 0, len = ref.length; i < len; i++) {
            chk = ref[i];
            if (!(!chk(o.item))) {
              continue;
            }
            every = false;
            break;
          }
          if (!every) {
            continue;
          }
          results.push(deploy(id, o));
        }
        return results;
      })();
    };

    Finder.prototype.calculate = function(query) {
      this._list(query, this.query.all._memory);
      if (query._list.length && (this.map_reduce != null)) {
        this._reduce(query);
        if (query._distinct != null) {
          this._group(query);
        }
      }
      this._sort(query);
    };

    return Finder;

  })();

}).call(this);

(function() {
  var Mem, _, set_for,
    slice = [].slice;

  _ = require("lodash");

  set_for = function(list) {
    var i, key, len, set;
    set = {};
    for (i = 0, len = list.length; i < len; i++) {
      key = list[i];
      set[key] = true;
    }
    return set;
  };

  Mem = module.exports;

  Mem.Query = (function() {
    function Query(finder, filters1, sortBy1, orderBy1) {
      this.finder = finder;
      this.filters = filters1;
      this.sortBy = sortBy1;
      this.orderBy = orderBy1;
    }

    Query.prototype._filters = function(query, cb) {
      var filters, req, target;
      if (!query) {
        return this;
      }
      filters = this.filters.concat();
      switch (query != null ? query.constructor : void 0) {
        case Object:
          for (target in query) {
            req = query[target];
            filters.push(cb(target, req));
          }
          break;
        case Function:
          filters.push(cb(null, query));
          break;
        default:
          console.log([query, query]);
          throw Error('unimplemented');
      }
      return new Query(this.finder, filters, this.orderBy);
    };

    Query.prototype["in"] = function(query) {
      return this._filters(query, function(target, req) {
        switch (req != null ? req.constructor : void 0) {
          case Array:
            return function(o) {
              var i, key, len, set;
              set = set_for(o[target]);
              for (i = 0, len = req.length; i < len; i++) {
                key = req[i];
                if (set[key]) {
                  return true;
                }
              }
              return false;
            };
          case RegExp:
            return function(o) {
              var i, len, ref, val;
              ref = o[target];
              for (i = 0, len = ref.length; i < len; i++) {
                val = ref[i];
                if (req.test(val)) {
                  return true;
                }
              }
              return false;
            };
          case null:
          case Boolean:
          case String:
          case Number:
            return function(o) {
              var set;
              set = set_for(o[target]);
              return set[req];
            };
          default:
            console.log([req, req]);
            throw Error('unimplemented');
        }
      });
    };

    Query.prototype.distinct = function(reduce, target) {
      var query;
      query = new Query(this.finder, this.filters, this.orderBy);
      query._distinct = {
        reduce: reduce,
        target: target
      };
      return query;
    };

    Query.prototype.where = function(query) {
      return this._filters(query, function(target, req) {
        var set;
        switch (req != null ? req.constructor : void 0) {
          case Array:
            set = set_for(req);
            return function(o) {
              return set[o[target]];
            };
          case RegExp:
            return function(o) {
              return req.test(o[target]);
            };
          case Function:
            return req;
          case null:
          case Boolean:
          case String:
          case Number:
            return function(o) {
              return o[target] === req;
            };
          default:
            console.log([type(req, req)]);
            throw Error('unimplemented');
        }
      });
    };

    Query.prototype.search = function(text) {
      var item, list, regexp;
      if (!text) {
        return this;
      }
      list = (function() {
        var i, len, ref, results;
        ref = text.split(/\s+/);
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          item = ref[i];
          item = item.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
          if (!item.length) {
            continue;
          }
          results.push("(" + item + ")");
        }
        return results;
      })();
      if (!list.length) {
        return this;
      }
      regexp = new RegExp(list.join("|"), "ig");
      return this.where(function(o) {
        return (!o.search_words) || regexp.test(o.search_words);
      });
    };

    Query.prototype.sort = function(sortBy, orderBy) {
      if (_.isEqual([sortBy, orderBy], [this.sortBy, this.orderBy])) {
        return this;
      }
      return new Query(this.finder, this.filters, sortBy, orderBy);
    };

    Query.prototype.shuffle = function() {
      return new Query(this.finder, this.filters, Math.random);
    };

    Query.prototype.clear = function() {
      delete this._reduce;
      delete this._list;
      delete this._hash;
      return delete this._memory;
    };

    Query.prototype.save = function() {
      return this.finder.save(this);
    };

    Query.prototype.find = function(id) {
      return this.hash[id];
    };

    Query.prototype.finds = function(ids) {
      var i, id, len, o, results;
      results = [];
      for (i = 0, len = ids.length; i < len; i++) {
        id = ids[i];
        if (o = this.hash[id]) {
          results.push(o);
        }
      }
      return results;
    };

    Query.prototype.pluck = function() {
      var keys;
      keys = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      switch (keys.length) {
        case 0:
          return this.list.map(function() {
            return null;
          });
        case 1:
          return this.list.map(function(o) {
            var a;
            a = _.at(o, keys)[0];
            return a;
          });
        default:
          return this.list.map(function(o) {
            return _.at(o, keys);
          });
      }
    };

    Object.defineProperties(Query.prototype, {
      reduce: {
        get: function() {
          if (this._reduce == null) {
            this.finder.calculate(this);
          }
          return this._reduce;
        }
      },
      list: {
        get: function() {
          if (this._list == null) {
            this.finder.calculate(this);
          }
          return this._list;
        }
      },
      hash: {
        get: function() {
          if (this._hash == null) {
            this.finder.calculate(this);
          }
          return this._hash;
        }
      },
      memory: {
        get: function() {
          if (this._memory == null) {
            this.finder.calculate(this);
          }
          return this._memory;
        }
      },
      ids: {
        get: function() {
          return Object.keys(this.memory);
        }
      }
    });

    return Query;

  })();

}).call(this);

(function() {
  var Mem, _, cache_scope, f_item, f_merge, f_remove, f_set, rehash,
    slice = [].slice,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  _ = require("lodash");

  cache_scope = function(key, finder, query_call) {
    switch (query_call != null ? query_call.constructor : void 0) {
      case Function:
        return finder.query.all[key] = function() {
          var args, base, name;
          args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
          return (base = finder.query)[name = key + ":" + (JSON.stringify(args))] != null ? base[name] : base[name] = query_call.apply(null, args);
        };
      default:
        return finder.query.all[key] = query_call;
    }
  };

  f_set = function(list, parent) {
    var key, ref, val;
    this.finder.diff = {};
    ref = this.finder.query.all._memory;
    for (key in ref) {
      val = ref[key];
      this.finder.query.all._memory = {};
      break;
    }
    return this.set_base("merge", list, parent);
  };

  f_merge = function(list, parent) {
    return this.set_base("merge", list, parent);
  };

  f_remove = function(list) {
    return this.set_base(false, list, null);
  };

  f_item = function(cb) {
    return function(item, parent) {
      return cb.call(this, [item], parent);
    };
  };

  rehash = function() {
    return this.finder.rehash(this.responses);
  };

  Mem = module.exports;

  Mem.Rule = (function() {
    Rule.responses = {};

    Rule.Model = (function() {
      Model.update = function(item, old) {};

      Model.create = function(item) {};

      Model["delete"] = function(old) {};

      function Model(o, m) {
        if (!o._id) {
          o._id = o[m.id];
        }
        if (!o[m.id]) {
          o[m.id] = o._id;
        }
      }

      return Model;

    })();

    Rule.prototype.set = f_set;

    Rule.prototype.reset = f_set;

    Rule.prototype.merge = f_merge;

    Rule.prototype.reject = f_remove;

    Rule.prototype.add = f_item(f_merge);

    Rule.prototype.append = f_item(f_merge);

    Rule.prototype.create = f_item(f_merge);

    Rule.prototype.remove = f_item(f_remove);

    Rule.prototype.clear_cache = rehash;

    Rule.prototype.refresh = rehash;

    Rule.prototype.rehash = rehash;

    function Rule(field) {
      this.field = field;
      this.model_id = this.field + "_id";
      this.model_list = this.field + "s";
    }

    Rule.prototype.schema = function(cb) {
      var base, definer, deploy, deploys, i, len, name;
      this.responses = (base = Mem.Rule.responses)[name = this.field] != null ? base[name] : base[name] = [];
      this.finder = new Mem.Finder("_id");
      deploys = [];
      this.validates = [];
      definer = {
        scope: (function(_this) {
          return function(cb) {
            var key, query_call, ref, results;
            _this.finder.scope = cb(_this.finder.query.all);
            ref = _this.finder.scope;
            results = [];
            for (key in ref) {
              query_call = ref[key];
              results.push(cache_scope(key, _this.finder, query_call));
            }
            return results;
          };
        })(this),
        depend_on: (function(_this) {
          return function(parent) {
            var base1;
            if ((base1 = Mem.Rule.responses)[parent] == null) {
              base1[parent] = [];
            }
            return Mem.Rule.responses[parent].push(_this);
          };
        })(this),
        belongs_to: (function(_this) {
          return function(parent, option) {
            var dependent, parent_id, parents;
            parents = parent + "s";
            parent_id = parent + "_id";
            deploys.push(function() {
              return Object.defineProperty(_this.model.prototype, parent, {
                get: function() {
                  return Mem.Query[parents].find(this[parent_id]);
                }
              });
            });
            dependent = option != null ? option.dependent : void 0;
            if (dependent) {
              definer.depend_on(parent);
              return _this.validates.push(function(o) {
                return o[parent] != null;
              });
            }
          };
        })(this),
        has_many: (function(_this) {
          return function(children, option) {
            var all, key, query;
            key = _this.model_id;
            all = _this.finder.query.all;
            query = option != null ? option.query : void 0;
            cache_scope(children, _this.finder, function(id) {
              if (query == null) {
                query = Mem.Query[children];
              }
              return query.where(function(o) {
                return o[key] === id;
              });
            });
            return deploys.push(function() {
              return Object.defineProperty(_this.model.prototype, children, {
                get: function() {
                  return all[children](this._id);
                }
              });
            });
          };
        })(this),
        shuffle: function() {
          var query;
          query = this.finder.query.all.shuffle();
          query._memory = this.finder.query.all._memory;
          return Mem.Query[this.model_list] = this.finder.query.all = query;
        },
        order: (function(_this) {
          return function(sortBy, orderBy) {
            var query;
            query = _this.finder.query.all.sort(sortBy, orderBy);
            query._memory = _this.finder.query.all._memory;
            return Mem.Query[_this.model_list] = _this.finder.query.all = query;
          };
        })(this),
        protect: (function(_this) {
          return function() {
            var keys;
            keys = 1 <= arguments.length ? slice.call(arguments, 0) : [];
            return _this.protect = function(o, old) {
              var i, key, len, results;
              results = [];
              for (i = 0, len = keys.length; i < len; i++) {
                key = keys[i];
                results.push(o[key] = old[key]);
              }
              return results;
            };
          };
        })(this),
        model: Mem.Rule.Model
      };
      cb.call(definer, this);
      this.model = definer.model;
      this.model.id = this.model_id;
      this.model.list = this.model_list;
      if (definer.model === Mem.Rule.Model) {
        this.model = (function(superClass) {
          extend(model, superClass);

          function model() {
            return model.__super__.constructor.apply(this, arguments);
          }

          return model;

        })(this.model);
      }
      for (i = 0, len = deploys.length; i < len; i++) {
        deploy = deploys[i];
        deploy();
      }
      Mem.Model[this.field] = this.model;
      Mem.Collection[this.field] = this;
      Mem.Query[this.model_list] = this.finder.query.all;
      return this;
    };

    Rule.prototype.set_base = function(mode, from, parent) {
      var all, each, finder;
      finder = this.finder;
      finder.map_reduce = this.model.map_reduce != null;
      all = finder.query.all._memory;
      each = function(process) {
        var i, id, item, len, ref, ref1;
        switch (from != null ? from.constructor : void 0) {
          case Array:
            ref = from || [];
            for (i = 0, len = ref.length; i < len; i++) {
              item = ref[i];
              if (!item) {
                continue;
              }
              process(item);
            }
            break;
          case Object:
            ref1 = from || {};
            for (id in ref1) {
              item = ref1[id];
              if (!item) {
                continue;
              }
              item._id = id;
              process(item);
            }
        }
      };
      switch (mode) {
        case "merge":
          each((function(_this) {
            return function(item) {
              var chk, emit, every, i, key, len, o, old, ref, val;
              for (key in parent) {
                val = parent[key];
                item[key] = val;
              }
              item.__proto__ = _this.model.prototype;
              _this.model.call(item, item, _this.model);
              every = true;
              ref = _this.validates;
              for (i = 0, len = ref.length; i < len; i++) {
                chk = ref[i];
                if (!(!chk(item))) {
                  continue;
                }
                every = false;
                break;
              }
              if (every) {
                o = {
                  item: item,
                  emits: []
                };
                old = all[item._id];
                if (old != null) {
                  _this.model.update(item, old);
                } else {
                  _this.model.create(item);
                }
                all[item._id] = o;
                if (finder.map_reduce) {
                  emit = function() {
                    var cmd, j, keys;
                    keys = 2 <= arguments.length ? slice.call(arguments, 0, j = arguments.length - 1) : (j = 0, []), cmd = arguments[j++];
                    return o.emits.push([keys, cmd]);
                  };
                  _this.model.map_reduce(item, emit);
                }
              }
            };
          })(this));
          break;
        default:
          each((function(_this) {
            return function(item) {
              var old;
              old = all[item._id];
              if (old != null) {
                _this.model["delete"](old);
                delete all[item._id];
              }
            };
          })(this));
      }
      this.rehash();
    };

    return Rule;

  })();

}).call(this);

(function() {
  var Mem, Serial, array_base_parser, base, escaped, func, key, pack, patch_size, serial, string_parser, string_serializer, symbol_parser, symbol_serializer, textfy, unpack, url_serializer;

  serial = null;

  base = function(code) {
    var c, i, len, n, ref;
    serial = {
      to_s: code,
      to_i: {}
    };
    ref = serial.to_s;
    for (n = i = 0, len = ref.length; i < len; n = ++i) {
      c = ref[n];
      serial.to_i[c] = n;
    }
    return serial.size = serial.to_s.length;
  };

  base("0123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz");

  patch_size = serial.size * serial.size * serial.size;

  textfy = function(cb) {
    return function(val) {
      switch (val) {
        case "":
        case null:
        case void 0:
          return "";
        default:
          return cb(val);
      }
    };
  };

  string_parser = string_serializer = textfy(String);

  symbol_parser = textfy(decodeURI);

  url_serializer = textfy(encodeURI);

  symbol_serializer = textfy(function(val) {
    return String(val).replace(/[~\/=.&\?\#\[\]()\"'`;]/g, function(s) {
      return "%" + s.charCodeAt(0).toString(16).toUpperCase();
    });
  });

  array_base_parser = function(val) {
    if (Array.isArray(val)) {
      return val;
    }
    switch (val) {
      case "":
      case null:
      case void 0:
        return [];
      default:
        return string_parser(val).split(",");
    }
  };

  pack = {
    Url: {},
    Thru: function(o) {
      return o;
    },
    Keys: function(val) {
      var item, key, list;
      list = (function() {
        var results;
        if (Array.isArray(val)) {
          return val;
        } else {
          results = [];
          for (key in val) {
            item = val[key];
            if (!item) {
              continue;
            }
            results.push(key);
          }
          return results;
        }
      })();
      return pack.Array(list.sort());
    },
    Array: function(val) {
      if (Array.isArray(val)) {
        return val.join(",");
      } else {
        return string_parser(val);
      }
    },
    Date: function(val) {
      var result, time;
      time = Math.floor(val);
      result = "";
      while (time >= 1) {
        result += serial.to_s[time % serial.size];
        time = Math.floor(time / serial.size);
      }
      return result;
    },
    Bool: function(bool) {
      if (bool) {
        return "T";
      } else {
        return "F";
      }
    },
    Text: symbol_serializer,
    Cookie: symbol_serializer,
    Url: url_serializer,
    Number: string_serializer,
    String: string_serializer,
    "null": string_serializer,
    undefined: string_serializer
  };

  unpack = {
    Url: {},
    Thru: function(o) {
      return o;
    },
    HtmlGon: function(html) {
      var codes, pattern, script;
      pattern = /<script.*?>([\s\S]*?)<\/script>/ig;
      codes = [];
      while (script = pattern.exec(html)) {
        codes.push(script[1]);
      }
      return new Function("window", codes.join("\n"));
    },
    Keys: function(val) {
      var bool, hash, i, key, len, list;
      hash = {};
      if (val.length) {
        list = array_base_parser(val);
        for (i = 0, len = list.length; i < len; i++) {
          key = list[i];
          hash[key] = true;
        }
      } else {
        for (key in val) {
          bool = val[key];
          if (bool) {
            hash[key] = true;
          }
        }
      }
      return hash;
    },
    Array: function(val) {
      return array_base_parser(val);
    },
    Date: function(code) {
      var c, i, len, n, result;
      if (0 < code) {
        return code;
      }
      base = 1;
      result = 0;
      for (i = 0, len = code.length; i < len; i++) {
        c = code[i];
        n = serial.to_i[c];
        if (n == null) {
          return Number.NaN;
        }
        result += n * base;
        base *= serial.size;
      }
      return result;
    },
    Bool: function(val) {
      switch (val) {
        case true:
        case "T":
          return true;
        case false:
        case "F":
          return false;
        default:
          return Number.NaN;
      }
    },
    Text: symbol_parser,
    Cookie: symbol_parser,
    Url: symbol_parser,
    Number: Number,
    String: string_parser,
    "null": string_parser,
    undefined: string_parser
  };

  Serial = {
    url: {},
    ID: {
      now: function() {
        return Serial.ID.at(_.now());
      },
      at: function(date, count) {
        if (count == null) {
          count = Math.random() * patch_size;
        }
        return pack.Date(date * patch_size + count);
      }
    }
  };

  escaped = "([^\\~\\/\\=\\.\\&\\[\\]\\(\\)\\\"\\'\\`\\;]*)";

  for (key in unpack) {
    func = unpack[key];
    Serial.url[key] = (function() {
      switch (key) {
        case "Number":
          return "([-]?[\\.0-9]+)";
        case "Date":
          return "([0-9a-zA-Z]+)";
        case "Array":
        case "Keys":
          return escaped;
        case "Url":
        case "Cookie":
          return escaped;
        case "Text":
          return escaped;
        default:
          return escaped;
      }
    })();
  }

  Mem = module.exports;

  Mem.pack = pack;

  Mem.unpack = unpack;

  Mem.Serial = Serial;

}).call(this);
