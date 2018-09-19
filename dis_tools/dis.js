const DEBUG = 1;

const fs = require('fs'),
      Promise = require('promise'),
      instructions = JSON.parse(fs.readFileSync('./dis_tools/instructions.json'));

if (DEBUG) console.log(instructions['0xef']);
if (DEBUG) console.log('DEBUG ENABLED');

function parse(rom, metadata, numBytes) {
	return new Promise((fulfill, reject) => {
		let flags = {}, 
		    header = [],
		    lines = [],
		    parsedHex = [],
		    pc = 0;

		// truncate header data if necessary
		if (DEBUG) console.log('checking header...');
		checkHeader(metadata, rom)
			.then(hasHeader => {
				if (hasHeader) {
					if (DEBUG) console.log('has header. truncating...');
					header = rom.slice(0, 512);
					rom = rom.slice(512);
					if (DEBUG) console.log('new rom length: ' + rom.length);
				}
		
				/*	
				// Convert ROM to hex
				if (DEBUG) console.log('converting ROM buffer to hex');
				rom.forEach((val, idx, rom) => {
					rom[idx] = toHex(rom[idx], true);
				});

				for (let i=0; i < rom.length-1; i++) {
					rom[i] = toHex(rom[i], true);
				}
				*/
		
				// Parse ROM line-by-line
				if (DEBUG) console.log('starting ROM parse');
				//for (; pc < numBytes;) {
				readLine(rom, pc, flags)
					.then(line => {
						pc += line.length;
						console.log(pc);
						if (DEBUG) console.log('finished reading line');
						console.log(line.line());
						console.log('new pc: ' + pc);
						lines.push(line.line());
						fulfill(line.line());
					})
					.catch(err => { reject({err: 2, msg: 'ERROR PARSING LINE', data: err}); });
				//}
			})
			.catch(err => { reject({err: 1, msg: 'ERROR READING HEADER', data: err}); });
	});
}

// Returns true if the ROM has a header
// smc files only
function checkHeader(metadata, romdata=null) {
	return new Promise((fulfill, reject) => {
		if (!metadata)
			reject('bad metadata');
		fulfill(metadata.originalname.endsWith('.smc'));
	});
}

function toHex(num,prefix=false) {
	//console.log('original:',num,'new:',num.toString(16))
        return prefix ? '0x'.concat(Number(num).toString(16)) : Number(num).toString(16);
}

function readLine(rom, pc, flags='') {
	return new Promise((fulfill, reject) => {
		let address = '0x',
		    args = [],
		    bytesRaw = [],
		    currByte = '0x',
		    length = 0,
		    line = {},
		    opcode = '',
		    prefix = '';

		address = toHex(pc, true);
		//currByte = toHex(rom[pc], true);
		currByte = toHex(rom[pc], true);
		console.log(currByte)
		opcode = instructions[currByte].opcode;
		prefix = instructions[currByte].prefix;
		length = instructions[currByte].length;

		if (DEBUG) console.log('reading line args');
		// read 2-3 additional byte args
		for (let i=1; i < length; i++) {
			args.push(toHex(rom[pc+i]));
		}
		if (DEBUG) console.log('reading line bytes');
		// store all associated bytes
		for (let i=0; i<length; i++) {
			bytesRaw.push(toHex(rom[pc]));
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
				return `${address} ${opcode} ${length>1?prefix:''}${args.join('')}  ; bytes: ${bytesRaw.join(' ')}  flags: ${flags}`;
			}
		}

		if (line) {
			if (DEBUG) console.log('finished parsing line, fulfilling...');
			console.log(pc,length);
			fulfill(line);
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
