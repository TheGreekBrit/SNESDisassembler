'use strict';
const DEBUG = 1;

const bodyParser = require('body-parser'),
      express = require('express'),
      fs = require('fs'),
      multer = require('multer'),
      Promise = require('promise');

const Tools = require('./dis_tools/dis.js');

const upload = multer({destination: 'uploads/', fileFilter: fileFilter});
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.raw({type: 'application/octet-stream', limit: '16mb'}));

// Index page
app.get('/', (req, res) => {
	res.sendFile(__dirname + '/index.html');
});

// Handle file upload
// spins off rom parsing functions
app.post('/', upload.single('romfile'), (req, res) => {

	// return if no file given
	if (!req.file) {
		console.error('No file received');
		console.error('request:', Object.keys(req));
		res.status(500).send('No file received!').end();
	}
	 
	let header = [],
	    romfile = req.file,
	    numBytesToParse = req.body['disWholeRom']? romfile.size: req.body['bytes'],
	    romdata = romfile.buffer;

	if (numBytesToParse > romfile.size)
		res.status(400).send(`<h1><b>ERROR: Byte count exceeds ROM size<br />Bytes given: ${numBytesToParse}<br />ROM Size: ${romfile.size}</b></h1>`);

	if (isNaN(parseInt(numBytesToParse)) || numBytesToParse < 1)
		res.status(400).send('<h1><b>ERROR: Byte count must be a positive number greater than 0.</b></h1>');

	/*
	 * ROM LOADED AT THIS POINT
	 * @romdata - buffer of ROM bytes
	 * @romfile - file metadata
	 */
	if (DEBUG) console.log('ROM loaded');
	Tools.checkHeader(romfile, romdata)
		.then(hasHeader => {
			if (hasHeader) {
				if (DEBUG) console.log('has header, truncating...');
				header = romdata.slice(0, 512);
				romdata = romdata.slice(512);
				if (DEBUG) console.log('new rom length: ' + romdata.length);
				if (numBytesToParse > romdata.length) {
					numBytesToParse = romdata.length;
					if (DEBUG) console.log('readjusting numBytesToDis after truncating header');
				}
			}
			
			/*
			 * PARSE ROM
			 */
			Tools.romParse(romdata, romfile, header, numBytesToParse)
				.then((data, extra=null) => {
					if (DEBUG) console.log('finished parsing ROM, sending 200');
					// Handle returned (parsed) ROM data
					res.status(200).send(data).end();
				})
				.catch(err => {
					// Handle errors from ROM parsing
					if (DEBUG) console.error('ERROR PARSING ROM', err);
					res.status(500).send(err).end();
				});

		})
		.catch(err => { reject({err: 1, msg: 'ERROR READING HEADER', data: err}); });
});

if (module === require.main) {
	// [START server]
	// Start the server
	const server = app.listen(process.env.PORT || 8080, () => {
		const port = server.address().port;
		console.log(`App listening on port ${port}`);
	});
	// [END server]
}

// Limits file extensions to the following:
// .smc - headered SNES
// .sfc - unheadered SNES
function fileFilter(arg, file, cb) {
	switch(file.originalname.slice(-3)) {
		case 'smc':
		case 'sfc':
			cb(null, true);
			break;
		default:
			cb(null, false);
	}
}

module.exports = app;
