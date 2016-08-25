var b2cj = function() {};
b2cj.prototype.parsefile = function() {
    console.log("Success!");
};

exports.b2cj = new b2cj();


{

    var fs = require("fs");
    var util = require("util");
    var citeproc = require("citeproc-js-node-patch");
    var zotbib = require("zotero-bibtex-parse");

    var bibfile;
    bibfile = 'literature.bib'; // mine
    // bibfile = 'literature2.bib'; // the one from citeproc-js-node or whatever

    var bibtex = fs.readFileSync(bibfile, 'utf8');

    var items = {
	"14058/RN9M5BF3": {
            "accessed": {
		"month":"9", "year":"2010", "day":"10"
            },
            "id":"14058/RN9M5BF3",
            "author": [ { "given":"Adel", "family":"Hendaoui" }, { "given":"Moez", "family":"Limayem" }, { "given":"Craig W.", "family":"Thompson" } ],
            "title":"3D Social Virtual Worlds: <i>Research Issues and Challenges</i>",
            "type":"article-journal",
            "versionNumber":6816
	}
    };

    var json = zotbib.toJSON(bibtex);

    var jcsl = jsonToCSLJSON(json);


    // console.log(items);
    // console.log("###########################");
    // console.log(jcsl);
    // throw '';

    // var json = bibtexParse(fs.readFileSync('literature.bib', 'utf8'));
    // var json = bib2json(fs.readFileSync('literature.bib','utf8'));

    var lang = 'en-US';

    var sys = new citeproc.simpleSys();
    var locale = fs.readFileSync('./assets/csl/locales/locales-' + lang + '.xml', 'utf8');
    var style = fs.readFileSync('./assets/csl/styles/harvard-imperial-college-london.csl', 'utf8');

    sys.addLocale(lang, locale);

    var engine = sys.newEngine(style, lang, null);
    // var engine = citeproc.CSL.Engine(sys, style, lang);

    sys.items = jcsl;
    // sys.items = items2;

    engine.updateItems(Object.keys(sys.items));
    var bib = engine.makeBibliography();

    console.log(util.inspect(bib), true,null,true);


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

				cslJson[ID]["id"] = ID;
				cslJson[ID]["url"] = tags.url ? tags.url : "";
				cslJson[ID]["doi"] = tags.doi ? tags.doi : "";
				cslJson[ID]["title"] = tags.title ? tags.title : "";
				cslJson[ID]["page"] = tags.pages ? tags.pages : "";

				cslJson[ID]["accessed"] = { "month":"9","year":"2012" };
				cslJson[ID]["author"] = [{ "given": Math.random().toString(26).substring(2,7), "family": Math.random().toString(26).substring(2,7) }];
                            }
			}

                    }
		}
            }
	}
	return cslJson;
    }
}
