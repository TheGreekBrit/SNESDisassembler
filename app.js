'use strict';
const DEBUG = 2;

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
		res.status(500).send('No file received!');
	}

	// parse user-defined values
	let header = [],					// placeholder array for SMC header
	    romfile = req.file, 				// rom file
	    startpc = req.body['startpc'] || '0x000000', 	// starting pc address (default: 0x000000)
	    disWholeRom = req.body['disWholeRom'], 		// boolean specifying whether to dis 'numBytesToDis' bytes, or the whole rom
	    numBytesToParse = req.body['bytes'] || 1024, 	// number of bytes to disassemble (default 1024)
	    romdata = romfile.buffer; 				// buffer containing sequential rom bytes

	if (DEBUG) console.log('initial startpc:', startpc);

	// Sanitize numBytesToParse
	if (numBytesToParse > romfile.size)
		res.status(400).send(`<h1><b>ERROR: Byte count exceeds ROM size<br />Bytes given: ${numBytesToParse}<br />ROM Size: ${romfile.size}</b></h1>`);

	else if (isNaN(parseInt(numBytesToParse)) || numBytesToParse < 1)
		res.status(400).send('<h1><b>ERROR: Byte count must be a positive number greater than zero.</b></h1>');
	/*
	 * ROM loaded at this point. Begin file processing
	 * @romdata - buffer of ROM bytes
	 * @romfile - file metadata
	 */
	if (DEBUG) console.log('ROM loaded');
	Tools.checkHeader(romfile, romdata)
		.then(hasHeader => {
			if (hasHeader) {
				if (DEBUG) console.log('has smc header, truncating...');
				if (DEBUG) console.log('old rom size:', romdata.length);
				header = romdata.slice(0, 512);				//\ chop the header off 
				romdata = romdata.slice(512);				/// first 512 bytes go into @header
				if (DEBUG) console.log('new rom size:', romdata.length);
			}
			
			if (DEBUG) console.log('initial pc:', pc);
			if (disWholeRom) {
				if (DEBUG > 1) console.log('beging check disWholeRom');
				numBytesToParse = romdata.length;			// sets up numBytesToParse to dis the whole rom, if neede

				pc = 0;							// pc -> 0 for full rom dis
			}
			else {
				if (DEBUG) console.log('begin startpc isHex:', startpc);
				// Validate user's startpc value, if given
				Tools.isHex(startpc, (isHex, convertedpc) => {
					if (DEBUG > 1) console.log('begin startpc isHex callback. isHex?', isHex);
					if (!isHex)
						res.status(400).send('Invalid program counter. Please use a hex value such that 0xROMSIZE >= 0xYOURPC >= 0x000000');
					else pc = convertedpc;				// starting pc (in decimal)
				});

				if (numBytesToParse > romdata.length) {			//\ handle edge case where the user enters:
					numBytesToParse = romdata.length;		/// romdata.length > numBytesToParse > romdata.length-512
					if (DEBUG) console.log('adjusted numBytesToParse after truncating header');
				}
			}
			
			if (DEBUG) console.log('final pc before parsing:', startpc);
			if (DEBUG) console.log('final numBytesToParse:', numBytesToParse);

			/*
			 * Begin parsing ROM bytes
			 * @romdata - buffer of rom bytes
			 * @romfile - rom metadata object
			 * @pc - program counter / index into the disassembly bytes
			 * @header - array of 512 header bytes, if applicable
			 * @numBytesToParse - number of bytes to disassemble
			 */
			Tools.romParse(romdata, romfile, pc, header, numBytesToParse)
				.then((data, extra=null) => {
					if (DEBUG) console.log('finished parsing ROM, sending 200');
					// Send results of ROM parsing to the user
					res.status(200).send(data);
				})
				.catch(err => {
					// Handle errors from ROM parsing
					if (DEBUG) console.error('ERROR PARSING ROM', err);
					res.status(500).send(err);
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
