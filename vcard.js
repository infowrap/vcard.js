//     ____________
//    |            |    A Javascript parser for vCards
//    |  vCard.js  |    Created by Mattt Thompson, 2008
//    |            |    Released under the MIT License
//     ̅̅̅̅̅̅̅̅̅̅̅̅

// Refiined by Infowrap for expanded use

//
// Adding Javascript 1.6 Compatibility

var vCard;

if (!Array.prototype.forEach) {
  Array.prototype.forEach = function(d, c) {
    var a, b, _results;

    c = c || this;
    b = 0;
    a = this.length;
    _results = [];
    while (b < a) {
      d.call(c, this[b], b, this);
      _results.push(b++);
    }
    return _results;
  };
}

if (typeof Prototype !== "undefined" || !Array.prototype.map) {
  Array.prototype.map = function(d, c) {
    var a, b, e;

    c = c || this;
    e = [];
    b = 0;
    a = this.length;
    while (b < a) {
      e.push(d.call(c, this[b], b, this));
      b++;
    }
    return e;
  };
}

if (typeof Prototype !== "undefined" || !Array.prototype.filter) {
  Array.prototype.filter = function(d, c) {
    var a, b, e;

    c = c || this;
    e = [];
    b = 0;
    a = this.length;
    while (b < a) {
      if (d.call(c, this[b], b, this)) {
        e.push(this[b]);
      }
      b++;
    }
    return e;
  };
}

["forEach", "map", "filter", "slice", "concat"].forEach(function(a) {
  if (!Array[a]) {
    return Array[a] = function(b) {
      return this.prototype[a].apply(b, Array.prototype.slice.call(arguments, 1));
    };
  }
});

Date.ISO8601PartMap = {
  Year: 1,
  Month: 3,
  Date: 5,
  Hours: 7,
  Minutes: 8,
  Seconds: 9
};

Date.matchISO8601 = function(a) {
  return a.match(/^(\d{4})(-?(\d{2}))?(-?(\d{2}))?(T(\d{2}):?(\d{2})(:?(\d{2}))?)?(Z?(([+\-])(\d{2}):?(\d{2})))?$/);
};

Date.parseISO8601 = function(e) {
  var a, b, c, d, f, part;

  b = this.matchISO8601(e);
  if (b) {
    a = new Date;
    c = void 0;
    d = 0;
    for (f in this.ISO8601PartMap) {
      if (part = b[this.ISO8601PartMap[f]]) {
        a["set" + f]((f === "Month" ? parseInt(part) - 1 : parseInt(part)));
      } else {
        a["set" + f]((f === "Date" ? 1 : 0));
      }
    }
    if (b[11]) {
      d = (parseInt(b[14]) * 60) + parseInt(b[15]);
      d *= (parseInt[13] === "-" ? 1 : -1);
    }
    d -= a.getTimezoneOffset();
    a.setTime(a.getTime() + (d * 60 * 1000));
    return a;
  }
};

vCard = {
  initialize: function(_input) {
    var vc;

    vc = {};
    this.parse(_input, vc);
    vc.prototype = vCard.Base;
    return vCard.extend(vc, vCard.SingletonMethods);
  },
  parse: function(_input, fields) {
    var key, line, lines, n, properties, regexps, results, type, value, _results;

    regexps = {
      simple: /^(version|fn|title|org|bday)\:(.+)$/i,
      complex: /^([^\:\;]+);([^\:]+)\:(.+)$/,
      key: /item\d{1,2}\./,
      properties: /((type=)?(.+);?)+/,
      cleanup: /^\;+|\;+$/g
    };
    lines = _input.split(/\r?\n/);
    _results = [];
    for (n in lines) {
      line = lines[n];
      if (regexps["simple"].test(line)) {
        results = line.match(regexps["simple"]);
        key = results[1].toLowerCase();
        value = results[2];
        if (key === 'org') {
          value = value.replace(regexps['cleanup'], "");
        }
        _results.push(fields[key] = value);
      } else if (regexps["complex"].test(line)) {
        results = line.match(regexps["complex"]);
        key = results[1].replace(regexps["key"], "").toLowerCase();
        properties = results[2].split(";");
        properties = Array.filter(properties, function(p) {
          return !p.match(/[a-z]+=[a-z]+/);
        });
        properties = Array.map(properties, function(p) {
          return p.replace(/type=/g, "");
        });
        type = key === "tel" ? properties[0] || "default" : type = properties.pop() || "default";
        type = type.toLowerCase();
        value = results[3].replace(regexps['cleanup'], "");
        value = key === 'adr' ? value.replace("\\", "") : value;
        value = (/;/.test(value) ? [value.split(";")] : value);
        value[0] = key === 'adr' ? _.compact(value[0]) : value[0];
        fields[key] = fields[key] || {};
        fields[key][type] = fields[key][type] || [];
        _results.push(fields[key][type] = fields[key][type].concat(value));
      } else {
        _results.push(void 0);
      }
    }
    return _results;
  },
  SingletonMethods: {
    to_html: function() {
      var adr_fields, field, n, output, type, value;

      output = "<div class=\"vcard\">";
      if (this.photo) {
        output += "<img class=\"photo\" src=\"data:image/png;base64," + this.photo["base64"][0] + "\" />";
      }
      output += "<span class=\"fn\">" + this.fn + "</span>";
      if (this.title) {
        output += "<span class=\"title\">" + this.title + "</span>";
      }
      if (this.org) {
        output += "<span class=\"org\">" + this.org + "</span>";
      }
      output += "<hr/>";
      for (type in this.adr) {
        for (n in this.adr[type]) {
          value = this.adr[type][n];
          output += "<address class=\"adr\">";
          output += "<span class=\"type\">" + type + "</span>";
          output += "<div class=\"content\">";
          adr_fields = ["post-office-box", "extended-address", "street-address", "locality", "region", "postal-code", "country-name"];
          for (field in adr_fields) {
            if (value[field]) {
              output += "<span class=\"" + adr_fields[field] + "\">";
              output += value[field];
              output += "</span>";
            }
          }
          output += "</div>";
          output += "</address>";
        }
      }
      for (type in this.tel) {
        for (n in this.tel[type]) {
          value = this.tel[type][n];
          output += "<span class=\"tel\">";
          output += "<span class=\"type\">" + type + "</span>";
          output += "<span class=\"value\">" + value + "</span>";
          output += "</span>";
        }
      }
      for (type in this.email) {
        for (n in this.email[type]) {
          value = this.email[type][n];
          output += "<span class=\"email\">";
          output += "<span class=\"type\">" + type + "</span>";
          output += "<a class=\"value\" href=\"mailto:" + value + "\">" + value + "</a>";
          output += "</span>";
        }
      }
      for (type in this.url) {
        for (n in this.url[type]) {
          value = this.url[type][n];
          output += "<span class=\"url\">";
          output += "<span class=\"type\">" + type + "</span>";
          output += "<a class=\"value\" href=\"" + value + "\">" + value + "</a>";
          output += "</span>";
        }
      }
      output += "</div>";
      output = output.replace(/\\n/g, "<br/>");
      return output;
    }
  },
  extend: function(dest, source) {
    var prop;

    for (prop in source) {
      dest[prop] = source[prop];
    }
    return dest;
  },
  Base: {}
};
