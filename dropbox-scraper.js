var system = require('system');
var fs = require('fs');
var fileName = 'scrape_result.txt';
var selector = 'a.filename-link';

var folders = [];
var files = {};

var i = 0;
while (system.args[i]) {
	switch (system.args[i]) {
		case '-u':
			folders.push(system.args[++i]);
			break;
		case '-f':
			fileName = system.args[++i];
			break;
		case '-s':
			selector = system.args[++i];
			break;
	}
	i++;
}

if (folders.length == 0) {
	console.log('No url specified, prease provide an url with the -u argument.');
	phantom.exit(1);
}

function getLinks(selector) {
    var links = document.querySelectorAll(selector) || [];
    var linkMap = {folders: [], files: []};
    for (i = 0; i < links.length; i++) {
    	var url = links[i].getAttribute('href').replace(/\?.*$/gi, '');
    	if (!!url.match(/.*?\/[^\.]+$/gi)) {
    		linkMap.folders.push(url);
    	} else  {
    		linkMap.files.push(url + '?dl=1');
    	}
    }
    return linkMap;
}

function writeToFile(files) {
	console.log('Scrape complete.');
	if (Object.keys(files).length > 0) {
		console.log('Writing ' + Object.keys(files).length + ' file urls to \'' + fileName + '\'')
		fs.write(fileName, '', 'w');
		for (var key in files) {
			fs.write(fileName, key + '\n', 'a');
		}
	} else {
		console.log('No files found');
	}
	phantom.exit(0);
}

function scrapeNext() {

	if (folders.length == 0) {
		writeToFile(files);
		return;
	}

	var url = folders.shift();
	console.log('Scraping: ' + url);

	var page = require('webpage').create();
	page.onConsoleMessage = function (msg) { console.log(msg); };
	page.onError = function (msg) { console.log(msg); };

	page.open(url + '?lst', function(status) {

		var links = page.evaluate(getLinks, selector);
	    folders = folders.concat(links.folders);
	    for (var i = 0; i < links.files.length; i++) {
	    	files[links.files[i]] = true;
	    }
		
		console.log('  ' + status + ' - Found [d:' + links.folders.length + ',f:' + links.files.length + '] Total [d:' + folders.length + ',f:' + Object.keys(files).length + ']');

	    page.close();
	    setTimeout(scrapeNext, 100);
	});
}

scrapeNext();
