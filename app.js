'use strict';
const DEBUG = 1;

const bodyParser = require('body-parser'),
      express = require('express'),
      fs = require('fs'),
      multer = require('multer'),
      Promise = require('promise');

const romParse = require('./dis_tools/dis.js').parse;

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
        if (!req.file) {
                console.error('No file received');
                console.log('req:',Object.keys(req));
                res.status(500).send('No file received!');
        } else {
                let romfile = req.file,
                    romdata = romfile.buffer,
                    bytes = req.body['bytes'];

                if (bytes > romfile.size)
                        res.status(400).send(`<h1><b>ERROR: Byte count exceeds ROM size<br />Bytes given: ${bytes}<br />ROM Size: ${romfile.size} bytes</b></h1>`);

                if (bytes < 0)
                        res.status(400).send('<h1><b>ERROR: Byte count may not be negative</b></h1>');

                if (isNaN(parseInt(bytes)))
                        res.status(400).send('<h1><b>ERROR: Byte count must be a positivenumber</b></h1>');

		/*
		 * ROM LOADED AT THIS POINT
		 * @romdata - buffer of ROM bytes
		 * @romfile - file metadata
		 */
		if (DEBUG) console.log('ROM loaded');
		romParse(romdata, romfile)
			.then((data, extra=null) => {
				if (DEBUG) console.log('finished parsing ROM, sending 200');
				// Handle returned (parsed) ROM data
				res.status(200).send(data);
			})
			.catch(err => {
				// Handle errors from ROM parsing
				if (DEBUG) console.error('ERROR PARSING ROM', err);
				res.status(500).send(err);
			});

        }
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
