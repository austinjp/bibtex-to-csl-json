var util = require("util");
var b2cj = require(".").b2cj;
var output = b2cj.parsefile("./literature.bib",
			    "en-US",
			    "./assets/csl/locales/locales-en-US.xml",
			    "./assets/csl/styles/harvard-imperial-college-london.csl");

