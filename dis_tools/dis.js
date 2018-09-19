const DEBUG=true;

const fs = require('fs'),
      Promise = require('promise'),
      instructions = JSON.parse(fs.readFileSync('./dis_tools/instructions.json'));

console.log(instructions['0xef']);

if (DEBUG)
	console.log('DEBUG ENABLED');

function parse(rom, metadata, numBytes) {
	return new Promise((fulfill, reject) => {
		let header = [],
			lines = [],
			parsedHex = [],
			pc = 0;

		// truncate header data if necessary
		if (DEBUG) console.log('checking header...');
		checkHeader(metadata, rom)
			.then(hasHeader => {
				if (hasHeader) {
					if (DEBUG) console.log('has header. truncating...');
					header = rom.splice(0, 512);
				}
			})
			.catch(err => { reject({err: 1, msg: 'ERROR READING HEADER', data: err}); });
		
		// Convert ROM to hex
		if (DEBUG) console.log('converting ROM buffer to hex');
		rom.forEach((val, idx, rom) => {
			rom[idx] = toHex(rom[idx]);
		});
		
		// Parse ROM line-by-line
		if (DEBUG) console.log('starting ROM parse');
		readLine(rom, pc, flags)
			.then((line, pc) => {
				//pc = pc;
				if (DEBUG) console.log('finished reading line');
				console.log(line.line());
				console.log('new pc: ' + pc);
				fulfill(line);
			})
			.catch(err => { reject({err: 2, msg: 'ERROR PARSING LINE', data: err}); });

		// Return parsed ROM data
		//fulfill(parsed);

	});
}

// Returns true if the ROM has a header
// smc files only
function checkHeader(metadata, romdata=null) {
	return new Promise((fulfull, reject) => {
		if (!metadata)
			reject('bad metadata');
		fulfill(metadata.originalname.endsWith('.smc'));
	});
}

function toHex(num,prefix=false) {
        return prefix ? num.toString(16) : '0x'.concat(num.toString(16));
}

function readLine(rom, pc, flags) {
	return new Promise((fulfill, reject) => {
		let address = '0x',
		    args = [],
		    bytesRaw = [],
		    length = 0,
		    line = {},
		    opcode = '',
		    prefix = '';

		address = '0x' + pc;
		opcode = instructions[rom[pc]].opcode;
		prefix = instructions[rom[pc]].prefix;
		length = instructions[rom[pc]].length;

		if (DEBUG) console.log('reading line args');
		// read 2-3 additional byte args
		for (let i=1; i <= length; i++) {
			args.push(rom[pc+i]);
		}
		if (DEBUG) console.log('reading line bytes');
		// store all associated bytes
		for (let i=0; i<=length; i++) {
			bytesRaw.push(rom[pc]);
		}

		line = {
			address: address,
			opcode: opcode,
			prefix: prefix,
			length: length,
			bytesRaw: bytesRaw,
			args: args,
			flags: flags,
			// example string of all elements
			line: () => {
				if (DEBUG) console.log('running line concat (line.line())');
				return `${self.address} ${self.opcode} ${self.prefix}${self.args.join('')}  ; bytes: ${self.bytesRaw.join(' ')}  flags: ${self.flags}`;
			}
		}

		if (line) {
			if (DEBUG) console.log('finished parsing line, fulfilling...');
			fulfill(line, pc+length);
		}
		else {
			if (DEBUG) console.error('ERROR PARSING LINE, REJECTING...');
			reject(line);
		}
	});
}


module.exports = {
        parse: parse
}
