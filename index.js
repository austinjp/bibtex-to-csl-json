var b2cj = function() {};
b2cj.prototype.parsefile = function(bibfile, lang, localesfile, stylefile) {

    var fs = require("fs");
    var util = require("util");
    var citeproc = require("citeproc-js-node-patch");
    var zotbib = require("zotero-bibtex-parse");

    var json = zotbib.toJSON(fs.readFileSync(bibfile, 'utf8'));
    var csljson = jsonToCSLJSON(json);

    var sys = new citeproc.simpleSys();
    var locale = fs.readFileSync(localesfile, 'utf8');
    var style = fs.readFileSync(stylefile, 'utf8');

    sys.addLocale(lang, locale);
    sys.items = csljson;

    var engine = sys.newEngine(style, lang, null);
    engine.updateItems(Object.keys(sys.items));

    var bib = engine.makeBibliography();

    return {
	bibliography: bib,
	csljson: csljson
    };

}

    

function jsonToCSLJSON(json) {
    // This is half-arsed, but it works for my purposes.
    var cslJson = {};
    for (var key in json) {
        if (json.hasOwnProperty(key)) {
	    var obj = json[key];

	    var ID;

	    for (k2 in obj) {
                if (obj.hasOwnProperty(k2)) {

		    if (typeof k2 === "string") {
                        if (k2.toLowerCase() === "citationkey") {
			    ID = obj[k2];
			    cslJson[ID] = {};
                        }
		    }

		    if (typeof ID !== "undefined") {
                        /*
                          if (k2.toLowerCase() === "entrytype") {
                          // Ignore for now..?
                          }
                        */
                        if (k2.toLowerCase() === "entrytags") {
			    // Copy the object making all keys lower case.
			    // Means there is far less checking to do.
			    var oldObj = obj[k2];
			    var tags = {};
			    var oldKey, oldKeys = Object.keys(oldObj);
			    var n = oldKeys.length;
			    while (n--) {
                                oldKey = oldKeys[n];
                                tags[oldKey.toLowerCase()] = oldObj[oldKey];
			    }

			    // All keys here must be lower case or a weird error pops out.
			    cslJson[ID]["id"] = ID;
			    cslJson[ID]["url"] = tags.url ? tags.url : undefined;
			    cslJson[ID]["doi"] = tags.doi ? tags.doi : undefined;
			    cslJson[ID]["title"] = tags.title ? tags.title : undefined;
			    cslJson[ID]["page"] = tags.pages ? tags.pages : undefined;

			    // FIXME Placeholder function, parse date.
			    cslJson[ID]["accessed"] = { "day":"1","month":"9","year":"2012" };

			    // FIXME Placeholder function, parse authors.
			    cslJson[ID]["author"] = [{ "given": Math.random().toString(26).substring(2,7), "family": Math.random().toString(26).substring(2,7) }];
                        }
		    }

                }
	    }
        }
    }
    return cslJson;
}

exports.b2cj = new b2cj();
