var fs = require("fs");
var util = require("util");
var citeproc = require("citeproc-js-node");
// var bibtexparser = require("zotero-bibtex-parse"); // Seems to strip curly braces :(
var bibtexparser = require("bibtex-parser-js");
var nameParts = require('nameparts');

function B2CJ(bibfile, lang, localesfile, stylefile) {
    this.bibfile = bibfile;
    this.lang = lang;
    this.localesfile = localesfile;
    this.stylefile = stylefile;

    var json = bibtexparser.toJSON(fs.readFileSync(this.bibfile, 'utf8'));
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

function stripBraces(s) {
    s = s.replace(/^{+/, "");
    s = s.replace(/}+$/, "");
    return s;
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

    // console.log(util.inspect(json, true, null, true));

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
			    // Makes checking keys far simpler.
			    var oldObj = obj[k2];
			    var tags = {};
			    var oldKey, oldKeys = Object.keys(oldObj);
			    var n = oldKeys.length;
			    while (n--) {
                                oldKey = oldKeys[n];
                                tags[oldKey.toLowerCase()] = oldObj[oldKey];
			    }

			    // All keys here must be lower case or an error about disambiguating keys pops out.
			    cslJson[ID]["id"] = ID;
			    cslJson[ID]["url"] = tags.url ? tags.url : undefined;
			    cslJson[ID]["doi"] = tags.doi ? tags.doi : undefined;
			    cslJson[ID]["title"] = tags.title ? stripBraces(tags.title) : undefined;
			    cslJson[ID]["page"] = tags.pages ? tags.pages : undefined;
			    cslJson[ID]["journal"] = tags.journal ? stripBraces(tags.journal) : undefined;

			    // Parse date.
			    cslJson[ID]["issued"] = { year: undefined, month: undefined, day: undefined };
			    cslJson[ID]["issued"]["year"] = tags.year ? tags.year : undefined;
			    cslJson[ID]["issued"]["month"] = tags.month ? monthToNum(tags.month) : undefined;
			    cslJson[ID]["issued"]["day"] = tags.day ? tags.day : undefined;

			    // Parse authors
			    // FIXME Needs to better understand names of institutions vs people,
			    // and those marked "do not touch" i.e. wrapped in curly braces.
			    cslJson[ID]["author"] = [];
			    if (tags.author.match(/^{/)) {
				// Do not parse authors that are wrapped in curly braces,
				// since this means "do not touch" in bibtex (I think!)
				cslJson[ID]["author"].push({
				    "family": stripBraces(tags.author)
				});
			    } else {
				var auths = tags.author ? tags.author.split(/\s+and\s+/) : [];
				if (auths.length >= 1) {
				    for (var a in auths) {
					var nameGiven, nameFamily;
					var n = auths[a];
					if (typeof n === "string") {
					    var parts = nameParts.parse(n);

					    nameGiven = parts.firstName ? parts.firstName : undefined;
					    nameFamily = parts.lastName ? parts.lastName : undefined;
					    cslJson[ID]["author"].push({
						"given": nameGiven,
						"family": nameFamily
					    });
					}/* else {
					    console.log("Not a string: " + typeof n);
					}*/
				    }
				} else {
				    var nameGiven, nameFamily;
				    var n = tags.author;
				    if (typeof n === "string") {
					var parts = nameParts.parse(n);

					nameGiven = parts.firstName ? parts.firstName : undefined;
					nameFamily = parts.lastName ? parts.lastName : undefined;
					cslJson[ID]["author"].push({
					    "given": nameGiven,
					    "family": nameFamily
					});
				    }/* else {
					console.log("Not a string: " + typeof n);
				    }*/
				}
			    }
                        }
		    }

                }
	    }
        }
    }
    return cslJson;
}

module.exports = {
    b2cj: function(bibfile, lang, localesfile, stylefile) {
	return new B2CJ(bibfile, lang, localesfile, stylefile);
    }
}
