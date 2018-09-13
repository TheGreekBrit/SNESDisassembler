'use strict';

const bodyParser = require('body-parser'),
      express = require('express'),
      fs = require('fs'),
      multer = require('multer');

const parseChunk = require('./YoshiDisassembler/dis.js').parse;

const upload = multer({destination: 'uploads/', fileFilter: fileFilter});
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.raw({type: 'application/octet-stream', limit: '16mb'}));

app.get('/', (req, res) => {
  //res.status(200).send('Hello, world!');
  res.sendFile(__dirname + '/index.html');
});

app.post('/', upload.single('romfile'), (req, res, next) => {
        if (!req.file) {
                console.error('No file received');
                console.log('req:',Object.keys(req));
                res.status(500).send('No file received!');
        } else {
                let romfile = req.file,
                    romdata = romfile.buffer,
                    bytes = req.body['bytes'];

                if(bytes > romfile.size)
                        res.status(400).send(`<h1><b>ERROR: Byte count exceeds ROM size<br />Bytes given: ${bytes}<br />ROM Size: ${romfile.size} bytes</b></h1>`);

                else if(bytes < 0)
                        res.status(400).send('<h1><b>ERROR: Byte count may not be negative</b></h1>');

                else if(isNaN(parseInt(bytes)))
                        res.status(400).send('<h1><b>ERROR: Byte count must be a positivenumber</b></h1>');

                let parsedBytes = parseChunk(romdata, bytes);

                console.log('file:',romfile);
                //console.log('bytes:',bytes);
                //console.log(parsedBytes.join(' '));

                res.status(200).send(`${romfile.originalname}<br />Size: ${romfile.size} bytes<br /><br /><b>First ${bytes} bytes:</b><br /><br />${parsedBytes.join(' ')}`);
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

function fileFilter(arg, file, cb) {
        if(file.originalname.endsWith('.smc') || file.originalname.endsWith('.sfc'))
                cb(null,true);
        else
                cb(null,false);
}

module.exports = app;
