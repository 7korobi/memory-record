/**
 memory-record - activerecord like in-memory data manager
 @version v0.1.1
 @link https://github.com/7korobi/memory-record
 @license 
**/


(function() {
  var Mem;

  module.exports = Mem = {
    Sync: {},
    Query: {},
    Collection: {}
  };

}).call(this);

(function() {
  var Mem;

  Mem = module.exports;

  Mem.Finder = (function() {
    function Finder(sort_by) {
      var all;
      this.sort_by = sort_by;
      all = new Mem.Query(this, [], false, this.sort_by);
      all._memory = {};
      this.scope = {
        all: all
      };
      this.query = {
        all: all
      };
    }

    Finder.prototype.rehash = function(rules, diff) {
      var i, len, rule;
      delete this.query.all._reduce;
      delete this.query.all._list;
      delete this.query.all._hash;
      this.query = {
        all: this.query.all
      };
      for (i = 0, len = rules.length; i < len; i++) {
        rule = rules[i];
        rule.rehash(diff);
      }
    };

    Finder.prototype.save = function(query) {
      var _id, i, len, message, o, ref, ref1;
      if (!this.sync) {
        return;
      }
      try {
        ref = this.sync.load_index();
        for (i = 0, len = ref.length; i < len; i++) {
          _id = ref[i];
          if (!query.hash[_id]) {
            this.sync["delete"](_id);
          }
        }
        ref1 = query.hash;
        for (_id in ref1) {
          o = ref1[_id];
          this.sync.store(_id, o);
        }
        this.sync.store_index(Object.keys(query.hash));
        return true;
      } catch (_error) {
        message = _error.message;
        console.log(message);
        return false;
      }
    };

    Finder.prototype.calculate_reduce = function(query) {
      var base, calc, emits, group, i, id, init, item, j, key, keys, last, len, len1, map, o, reduce, ref, ref1, ref2;
      init = function(map) {
        var o;
        o = {};
        if (map.count) {
          o.count = 0;
        }
        if (map.all) {
          o.all = 0;
        }
        if (map.push) {
          o.push = [];
        }
        if (map.set) {
          o.set = {};
        }
        return o;
      };
      reduce = function(item, o, map) {
        if (map.push) {
          o.push.push(map.push);
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
      ref = query._memory;
      for (id in ref) {
        ref1 = ref[id], item = ref1.item, emits = ref1.emits;
        for (i = 0, len = emits.length; i < len; i++) {
          ref2 = emits[i], keys = ref2[0], last = ref2[1], map = ref2[2];
          o = base;
          for (j = 0, len1 = keys.length; j < len1; j++) {
            key = keys[j];
            o = o[key] || (o[key] = {});
          }
          o = o[last] || (o[last] = init(map));
          reduce(item, o, map);
        }
      }
      for (group in base) {
        emits = base[group];
        for (key in emits) {
          map = emits[key];
          calc(map);
        }
      }
      return query._reduce = base;
    };

    Finder.prototype.calculate_sort = function(query) {
      var gt, i, is_array, len, list, lt, o, ref, s;
      list = query._list;
      ref = query.desc ? [1, -1] : [-1, 1], lt = ref[0], gt = ref[1];
      s = query.orders = {};
      for (i = 0, len = list.length; i < len; i++) {
        o = list[i];
        s[o._id] = query.sort_by(o);
      }
      if (list.length) {
        is_array = Array.isArray(query.sort_by(list[0]));
      }
      return query._list = is_array ? list.sort(function(a, b) {
        var a_list, a_val, b_list, b_val, index, j, len1;
        a_list = s[a._id];
        b_list = s[b._id];
        for (index = j = 0, len1 = a_list.length; j < len1; index = ++j) {
          a_val = a_list[index];
          b_val = b_list[index];
          if (a_val < b_val) {
            return lt;
          }
          if (a_val > b_val) {
            return gt;
          }
        }
        return 0;
      }) : list.sort(function(a, b) {
        var a_val, b_val;
        a_val = s[a._id];
        b_val = s[b._id];
        if (a_val < b_val) {
          return lt;
        }
        if (a_val > b_val) {
          return gt;
        }
        return 0;
      });
    };

    Finder.prototype.calculate_group = function(query) {
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

    Finder.prototype.calculate_list = function(query, all) {
      var deploy, filters, id, o;
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
          ref = query.filters;
          for (i = 0, len = ref.length; i < len; i++) {
            filters = ref[i];
            if (!filters(o.item)) {
              o = null;
            }
            if (!o) {
              break;
            }
          }
          if (!o) {
            continue;
          }
          results.push(deploy(id, o));
        }
        return results;
      })();
    };

    Finder.prototype.calculate = function(query) {
      this.calculate_list(query, this.query.all._memory);
      if (query._list.length && (this.map_reduce != null)) {
        this.calculate_reduce(query);
        if (query._distinct != null) {
          this.calculate_group(query);
        }
      }
      this.calculate_sort(query);
    };

    return Finder;

  })();

}).call(this);

(function() {
  var Mem, def, set_for, type,
    slice = [].slice;

  type = function(o) {
    return o != null ? o.constructor : void 0;
  };

  def = function(obj, key, arg) {
    var configurable, enumerable, get, set;
    get = arg.get, set = arg.set;
    configurable = false;
    enumerable = false;
    Object.defineProperty(obj, key, {
      configurable: configurable,
      enumerable: enumerable,
      get: get,
      set: set
    });
  };

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
    function Query(finder, filters1, desc1, sort_by1) {
      this.finder = finder;
      this.filters = filters1;
      this.desc = desc1;
      this.sort_by = sort_by1;
    }

    Query.prototype._filters = function(query, cb) {
      var filters, req, target;
      if (!query) {
        return this;
      }
      filters = this.filters.concat();
      switch (type(query)) {
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
          console.log([type(query, query)]);
          throw Error('unimplemented');
      }
      return new Query(this.finder, filters, this.desc, this.sort_by);
    };

    Query.prototype["in"] = function(query) {
      return this._filters(query, function(target, req) {
        switch (type(req)) {
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
            console.log([type(req, req)]);
            throw Error('unimplemented');
        }
      });
    };

    Query.prototype.distinct = function(reduce, target) {
      var query;
      query = new Query(this.finder, this.filters, this.desc, this.sort_by);
      query._distinct = {
        reduce: reduce,
        target: target
      };
      return query;
    };

    Query.prototype.where = function(query) {
      return this._filters(query, function(target, req) {
        var set;
        switch (type(req)) {
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

    Query.prototype.sort = function(desc, order) {
      var sort_by;
      if (order == null) {
        order = this.sort_by;
      }
      sort_by = (function() {
        switch (type(order)) {
          case Function:
            return order;
          case String:
          case Number:
            return function(o) {
              return o[order];
            };
          default:
            console.log([type(req, req)]);
            throw Error('unimplemented');
        }
      })();
      if (desc === this.desc && sort_by === this.sort_by) {
        return this;
      }
      return new Query(this.finder, this.filters, desc, sort_by);
    };

    Query.prototype.shuffle = function() {
      return new Query(this.finder, this.filters, false, Math.random);
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

    Query.prototype.fetch = function() {
      return this;
    };

    def(Query.prototype, "reduce", {
      get: function() {
        if (this._reduce == null) {
          this.finder.calculate(this);
        }
        return this._reduce;
      }
    });

    def(Query.prototype, "list", {
      get: function() {
        if (this._list == null) {
          this.finder.calculate(this);
        }
        return this._list;
      }
    });

    def(Query.prototype, "hash", {
      get: function() {
        if (this._hash == null) {
          this.finder.calculate(this);
        }
        return this._hash;
      }
    });

    def(Query.prototype, "memory", {
      get: function() {
        if (this._memory == null) {
          this.finder.calculate(this);
        }
        return this._memory;
      }
    });

    def(Query.prototype, "ids", {
      get: function() {
        return Object.keys(this.memory);
      }
    });

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
            return o[keys[0]];
          });
        default:
          return this.list.map(function(o) {
            var i, key, len, results;
            results = [];
            for (i = 0, len = keys.length; i < len; i++) {
              key = keys[i];
              results.push(o[key]);
            }
            return results;
          });
      }
    };

    return Query;

  })();

}).call(this);

(function() {
  var Mem, def, type,
    slice = [].slice;

  type = function(o) {
    return o != null ? o.constructor : void 0;
  };

  def = function(obj, key, arg) {
    var configurable, enumerable, get, set;
    get = arg.get, set = arg.set;
    configurable = false;
    enumerable = false;
    Object.defineProperty(obj, key, {
      configurable: configurable,
      enumerable: enumerable,
      get: get,
      set: set
    });
  };

  Mem = module.exports;

  Mem.Rule = (function() {
    var f_item, f_merge, f_remove, f_set;

    Rule.responses = {};

    f_set = function(list, parent) {
      var key, ref, val;
      this.finder.diff = {};
      ref = this.finder.query.all._memory;
      for (key in ref) {
        val = ref[key];
        this.finder.query.all._memory = {};
        this.finder.diff.del = true;
        break;
      }
      return this.set_base("merge", list, parent);
    };

    f_merge = function(list, parent) {
      this.finder.diff = {};
      return this.set_base("merge", list, parent);
    };

    f_remove = function(list) {
      this.finder.diff = {};
      return this.set_base(false, list, null);
    };

    f_item = function(cb) {
      return function(item, parent) {
        switch (type(item)) {
          case Object:
            return cb.call(this, [item], parent);
          default:
            throw Error('invalid data : #{item}');
        }
      };
    };

    Rule.prototype.set = f_set;

    Rule.prototype.reset = f_set;

    Rule.prototype.merge = f_merge;

    Rule.prototype.reject = f_remove;

    Rule.prototype.add = f_item(f_merge);

    Rule.prototype.create = f_item(f_merge);

    Rule.prototype.remove = f_item(f_remove);

    Rule.prototype.fetch = function() {
      var _id, list, message, sync;
      sync = this.finder.sync;
      if (!sync) {
        return false;
      }
      try {
        list = (function() {
          var i, len, ref, results;
          ref = sync.load_index();
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            _id = ref[i];
            results.push(sync.load(_id));
          }
          return results;
        })();
        f_set.call(this, list);
        return true;
      } catch (_error) {
        message = _error.message;
        console.log(message);
        return false;
      }
    };

    function Rule(field) {
      var base;
      this.id = field + "_id";
      this.list_name = field + "s";
      this.base_obj = {};
      this.validates = [];
      this.responses = (base = Mem.Rule.responses)[field] != null ? base[field] : base[field] = [];
      this.map_reduce = function() {};
      this.protect = function() {};
      this.deploy = (function(_this) {
        return function(o) {
          if (!o._id) {
            o._id = o[_this.id];
          }
          if (!o[_this.id]) {
            return o[_this.id] = o._id;
          }
        };
      })(this);
      this.finder = new Mem.Finder(function(list) {
        return list;
      });
      this.finder.name = this.list_name;
      Mem.Collection[field] = this;
      Mem.Query[this.list_name] = this.finder.query.all;
    }

    Rule.prototype.schema = function(cb) {
      var cache_scope, definer;
      cache_scope = function(key, finder, query_call) {
        switch (type(query_call)) {
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
      definer = {
        sync: (function(_this) {
          return function(storage, table_name) {
            if (table_name == null) {
              table_name = _this.list_name;
            }
            return _this.finder.sync = new storage(table_name);
          };
        })(this),
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
        "default": (function(_this) {
          return function(cb) {
            var key, ref, results, val;
            ref = cb();
            results = [];
            for (key in ref) {
              val = ref[key];
              results.push(_this.base_obj[key] = val);
            }
            return results;
          };
        })(this),
        depend_on: (function(_this) {
          return function(parent) {
            var base;
            if ((base = Mem.Rule.responses)[parent] == null) {
              base[parent] = [];
            }
            return Mem.Rule.responses[parent].push(_this);
          };
        })(this),
        belongs_to: (function(_this) {
          return function(parent, option) {
            var dependent, parent_id, parents;
            parents = parent + "s";
            parent_id = parent + "_id";
            def(_this.base_obj, parent, {
              get: function() {
                return Mem.Query[parents].find(this[parent_id]);
              }
            });
            dependent = (option != null ? option.dependent : void 0) != null;
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
            key = _this.id;
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
            return def(_this.base_obj, children, {
              get: function() {
                return all[children](this._id);
              }
            });
          };
        })(this),
        shuffle: function() {
          var query;
          query = this.finder.query.all.shuffle();
          query._memory = this.finder.query.all._memory;
          return Mem.Query[this.list_name] = this.finder.query.all = query;
        },
        order: (function(_this) {
          return function(order) {
            var query;
            query = _this.finder.query.all.sort(false, order);
            query._memory = _this.finder.query.all._memory;
            return Mem.Query[_this.list_name] = _this.finder.query.all = query;
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
        deploy: (function(_this) {
          return function(deploy) {
            _this.deploy = deploy;
          };
        })(this),
        map_reduce: (function(_this) {
          return function(map_reduce) {
            _this.map_reduce = map_reduce;
          };
        })(this)
      };
      return cb.call(definer, this);
    };

    Rule.prototype.rehash = function(diff) {
      return this.finder.rehash(this.responses, diff);
    };

    Rule.prototype.set_base = function(mode, from, parent) {
      var all, deployer, diff, each, finder, validate_item;
      finder = this.finder;
      diff = finder.diff;
      all = finder.query.all._memory;
      deployer = (function(_this) {
        return function(o) {
          o.__proto__ = _this.base_obj;
          return _this.deploy(o);
        };
      })(this);
      validate_item = (function(_this) {
        return function(item) {
          var i, len, ref, validate;
          ref = _this.validates;
          for (i = 0, len = ref.length; i < len; i++) {
            validate = ref[i];
            if (!validate(item)) {
              return false;
            }
          }
          return true;
        };
      })(this);
      each = function(process) {
        var i, id, item, len, ref, ref1;
        switch (type(from)) {
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
              var emit, key, o, old, val;
              for (key in parent) {
                val = parent[key];
                item[key] = val;
              }
              deployer(item);
              if (!validate_item(item)) {
                return;
              }
              o = {
                item: item,
                emits: []
              };
              old = all[item._id];
              if (old != null) {
                _this.protect(item, old.item);
                diff.change = true;
              } else {
                diff.add = true;
              }
              all[item._id] = o;
              emit = function() {
                var i, keys, last, map;
                keys = 3 <= arguments.length ? slice.call(arguments, 0, i = arguments.length - 2) : (i = 0, []), last = arguments[i++], map = arguments[i++];
                finder.map_reduce = true;
                return o.emits.push([keys, last, map]);
              };
              _this.map_reduce(o.item, emit);
            };
          })(this));
          break;
        default:
          each((function(_this) {
            return function(item) {
              var old;
              old = all[item._id];
              if (old != null) {
                diff.del = true;
                delete all[item._id];
              }
            };
          })(this));
      }
      this.rehash(diff);
    };

    return Rule;

  })();

}).call(this);

(function() {
  var Mem, Serial, array_base_parser, base, func, key, pack, patch_size, serial, string_parser, string_serializer, unpack;

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

  string_parser = function(val) {
    switch (val) {
      case "":
      case null:
      case void 0:
        return "";
      default:
        return String(val);
    }
  };

  string_serializer = function(val) {
    switch (val) {
      case "":
      case null:
      case void 0:
        return "";
      default:
        return String(val).replace(/[~\/=.&\?\#\[\]()\"'`;]/g, function(s) {
          return "%" + s.charCodeAt(0).toString(16);
        });
    }
  };

  array_base_parser = function(val) {
    if (Array.isArray(val)) {
      return val;
    } else {
      return ("" + val).split(",");
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
        return "" + val;
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
    Number: string_serializer,
    Text: string_serializer,
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
      if (val.length) {
        return array_base_parser(val);
      } else {
        return [];
      }
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
    Number: Number,
    Text: string_parser,
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
          return "([^\\~\\/\\=\\.\\&\\[\\]\\(\\)\\\"\\'\\`\\;]*)";
        case "Text":
          return "([^\\~\\/\\=\\.\\&\\[\\]\\(\\)\\\"\\'\\`\\;]*)";
        default:
          return "([^\\~\\/\\=\\.\\&\\[\\]\\(\\)\\\"\\'\\`\\;]+)";
      }
    })();
  }

  Mem = module.exports;

  Mem.pack = pack;

  Mem.unpack = unpack;

  Mem.Serial = Serial;

}).call(this);

(function() {
  var Sync, pack, ref, test, testStorage, unpack, web_storage;

  ref = module.exports, Sync = ref.Sync, pack = ref.pack, unpack = ref.unpack;

  web_storage = function(storage) {
    return function(name) {
      var key;
      key = function(_id) {
        return name + "~" + _id;
      };
      return {
        load_index: function() {
          var str;
          str = storage.getItem(name);
          if (str) {
            return unpack.Array(str);
          } else {
            return [];
          }
        },
        load: function(_id) {
          return JSON.parse(storage.getItem(key(_id)) || (function() {
            throw "Record Not Found";
          })());
        },
        store_index: function(ids) {
          return storage.setItem(name, pack.Array(ids));
        },
        store: function(_id, model) {
          return storage.setItem(key(_id), JSON.stringify(model));
        },
        "delete": function(_id) {
          return storage.removeItem(key(_id));
        }
      };
    };
  };

  test = {};

  testStorage = {
    key: function(idx) {
      return Object.keys(test)[idx];
    },
    setItem: function(key, val) {
      test[key] = val;
      console.log(":: " + key + " => " + val);
      return void 0;
    },
    getItem: function(key) {
      var val;
      return val = test[key];
    },
    removeItem: function(key) {
      var val;
      val = test[key];
      delete test[key];
      console.log(":: " + key + " delete (" + val + ")");
      return void 0;
    }
  };

  if (typeof sessionStorage !== "undefined" && sessionStorage !== null) {
    Sync.session = web_storage(sessionStorage);
  }

  if (typeof localStorage !== "undefined" && localStorage !== null) {
    Sync.local = web_storage(localStorage);
  }

  Sync.test = web_storage(testStorage);

}).call(this);
