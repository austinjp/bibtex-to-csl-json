// var b2cj = function() {};
// b2cj.prototype.parsefile = function(bibfile, lang, localesfile, stylefile) {

var fs = require("fs");
var util = require("util");
var citeproc = require("citeproc-js-node-patch");
var zotbib = require("zotero-bibtex-parse");
var nameParts = require('nameparts');

function B2CJ(bibfile, lang, localesfile, stylefile) {
    this.bibfile = bibfile;
    this.lang = lang;
    this.localesfile = localesfile;
    this.stylefile = stylefile;

    var json = zotbib.toJSON(fs.readFileSync(this.bibfile, 'utf8'));
    var csljson = jsonToCSLJSON(json);

    var sys = new citeproc.simpleSys();
    var locale = fs.readFileSync(this.localesfile, 'utf8');
    var style = fs.readFileSync(this.stylefile, 'utf8');

    sys.addLocale(this.lang, locale);
    sys.items = csljson;

    var engine = sys.newEngine(style, this.lang, null);
    engine.updateItems(Object.keys(sys.items));

    var bib = engine.makeBibliography();

    return {
	bibliography: bib,
	csljson: csljson
    };
}


function monthToNum(month) {
    // FIXME Use a standard lib for this.

    // Return numbers and numeric strings without further analysis
    if (typeof month === "number") { return month; }
    if (!isNaN(parseFloat(month))) { return month; }

    switch(true) {
	case /^ja/i.test(month): return 01;
	case /^f/i.test(month): return 02;
	case /^mar/i.test(month): return 03;
	case /^ap/i.test(month): return 04;
	case /^may/i.test(month): return 05;
	case /^jun/i.test(month): return 06;
	case /^jul/i.test(month): return 07;
	case /^au/i.test(month): return 08;
	case /^s/i.test(month): return 09;
	case /^o/i.test(month): return 10;
	case /^n/i.test(month): return 11;
	case /^d/i.test(month): return 12;
    }

    return undefined;
}
    

function jsonToCSLJSON(json) {
    // This is half-arsed, but it works for my purposes.

    this.json = json;
    var cslJson = {};

    for (var key in this.json) {
        if (this.json.hasOwnProperty(key)) {
	    var obj = this.json[key];

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

			    // Parse date.
			    cslJson[ID]["issued"] = { year: undefined, month: undefined, day: undefined };
			    cslJson[ID]["issued"]["year"] = tags.year ? tags.year : undefined;
			    cslJson[ID]["issued"]["month"] = tags.month ? monthToNum(tags.month) : undefined;
			    cslJson[ID]["issued"]["day"] = tags.day ? tags.day : undefined;

			    // Parse authors
			    // FIXME Needs to better understand names of institutions vs people,
			    // and those marked "do not touch" i.e. wrapped in curly braces.
			    cslJson[ID]["author"] = [];
			    var auths = tags.author ? tags.author.split(/\s+and\s+/) : [];
			    if (auths.length >= 2) {
				for (var a in auths) {
				    var nameGiven, nameFamily;
				    nameGiven = nameParts.parse(auths[a]).firstName;
				    nameFamily = nameParts.parse(auths[a]).lastName;
				    cslJson[ID]["author"].push({
					"given": nameParts.parse(auths[a]).firstName,
					"family": nameParts.parse(auths[a]).lastName,
				    });
				}
			    } else {
				cslJson[ID]["author"].push( { "family": tags.author } );
			    }
                        }
		    }

                }
	    }
        }
    }
    return cslJson;
}

// exports.b2cj = new b2cj();
module.exports = {
    b2cj: function(bibfile, lang, localesfile, stylefile) {
	return new B2CJ(bibfile, lang, localesfile, stylefile);
    }
}
