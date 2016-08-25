var util = require("util");
var b = require(".");
var output = b.b2cj("./literature.bib",
		    "en-US",
		    "./assets/csl/locales/locales-en-US.xml",
		    "./assets/csl/styles/harvard-imperial-college-london.csl");
console.log(util.inspect(output, true,null,true));
