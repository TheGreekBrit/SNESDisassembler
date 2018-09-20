const DEBUG = 2;
//const OVERRIDE = 200;

const fs = require('fs'),
      Promise = require('promise'),
      instructions = JSON.parse(fs.readFileSync('./dis_tools/instructions.json'));

let LINES_DATA = [], // raw data objects for each line
    LINES_DIS = [];  // "human-readable" disassembled string

if (DEBUG) console.log(instructions['0xef']);
if (DEBUG) console.log('DEBUG ENABLED');

/*
 * Master parse function. Called from the main app.
 * @rom - buffer of rom bytes, integers
 * @metadata - rom file metadata
 * @pc - initial program counter
 * @header - array of header bytes, if any
 * @numBytes - number of bytes to disassemble, provided by the user when uploading a rom
 *
 * Returns:
 * @lines - joined string of all disassembled bytes, separated by newlines
 */
function parse(rom, metadata, pc=0, header=[], numBytes) {
	return new Promise((fulfill, reject) => {
		let flags = {},
		    lines = [],
		    numBytesToDis = numBytes || rom.length,
		    parsedHex = [];
		
		if (DEBUG) console.log('begin ROM parse');
		parseRecursive(rom, pc, flags, numBytesToDis, (errCode, data) => {
			if (errCode)
				reject({err: 2, msg: 'ERROR PARSING LINE', data: data});

			if (DEBUG) console.log('COMPLETE! RETURNING...');
			if (LINES_DATA && LINES_DIS)
				fulfill(LINES_DIS.join('<br />'));
		});
	});
}

/*
 * Checks if the ROM has an SMC header
 * @metadata - rom file metadata
 *
 * Returns:
 * @hasHeader - bool indicating whether the ROM has a header
 */
function checkHeader(metadata, romdata=null) {
	return new Promise((fulfill, reject) => {
		if (!metadata)
			reject('bad metadata');
		fulfill(metadata.originalname.endsWith('.smc'));
	});
}

/*
 * Converts integers to hexadecimal
 * @num - number to convert
 * @prefix - boolean specifying whether '0x' should be prefixed to the hex digit. default: false.
 * @padSize - number of digits to pad the hex digit to. default: 2
 *
 * Returns:
 * @hex - converted hexadecimal digit
 */
function toHex(num, prefix=false, padSize=2) {
        return prefix ? '0x'.concat(Number(num).toString(16).padStart(padSize, '0')) : Number(num).toString(16).padStart(padSize, '0');
}

function isHex(str) {
	if (DEBUG > 1) console.log('begin isHex:('+str+')');

	let re_hexch = /(0[xX])?[0-9a-fA-F]{1,6}/,
	    re_hexprefix = /^0[xX]/;
	
	if (str.match(re_hexch)) {
		if (!str.match(re_hexprefix))
			str = '0x'.concat(str);

		return Number(str);	// validate "0xyyyyyy"
	} else return false;
}

/*
 * Begin ROM parsing. Recursively called until the whole ROM is disassembled.
 * Kicks off the readLine() function, which disassembles each line
 * @rom - buffer of rom bytes
 * @pc - current program counter
 * @flags - object containing processor flags
 * @callback - callback to parse(), executed either when we finish or when there's an error
 */
function parseRecursive(rom, pc, flags, numBytesToDis, callback) {
	if (DEBUG > 1) console.log('start parseRecursive()');
	// parse one line (opcode + 1-3 args, or data)
	readLine(rom, pc, flags)
		.then((newline, newpc, newflags) => {
			if (DEBUG) console.log('finished:', pc);
			pc += newline.length;
			if (DEBUG) console.log('starting:' + pc);

			// store parsed line data
			LINES_DATA.push(newline);
			LINES_DIS.push(newline.line());

			// continue until we run out of bytes
			if (pc <= numBytesToDis)
				parseRecursive(rom, pc, newflags, numBytesToDis, callback);
			else
				callback(false, LINES_DIS); // callback to main function
		})
		// throw error if there's any problems
		.catch(err => { callback(true, err); });
}

/*
 * Parse line (byte.opcode.length bytes) at program counter @pc
 * @rom - buffer of rom bytes in hex
 * @pc - current program counter
 * @flags - object containing processor flags
 *
 * Returns::
 * @line - object containing all dis'd line components, and a function to cat the elements together
 * @pc - program counter, unaltered
 * @flags - object containing processor flags
 */
function readLine(rom, pc=0, flags='') {
	return new Promise((fulfill, reject) => {
		//if (DEBUG) console.log('rom size:', rom.length, 'pc:', pc, 'flags:', flags);

		let address = pc,
		    args = [],
		    bytesRaw = [],
		    currByte = '0x',
		    length = 0,
		    line = {},
		    opcode = '',
		    pc = Number(pc),
		    prefix = '';
		
		currByte = toHex(rom[pc], true);
		
		if (DEBUG) console.log('current byte (dec):', rom[Number(pc)]);
		if (DEBUG) console.log('current byte (hex):', currByte);
		
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
			bytesRaw.push(toHex(rom[pc+i]));
		}

		line = {
			address: address,
			opcode: opcode,
			prefix: prefix,
			length: length,
			bytesRaw: bytesRaw,
			args: args,
			flags: flags,
			// concat all elements in line
			line: () => {
				let tab = '&nbsp;&nbsp;&nbsp;&nbsp;'; // four spaces
				if (DEBUG) console.log('running line concat (line.line())');
				// TODO refactor and space properly
				return `${toHex(address,true,6)}${tab}${tab}${opcode}${tab}${length>1?prefix:tab}${args.reverse().join('')}${tab}${tab}${tab}${tab};${tab}BYTES: ${bytesRaw.join(' ')}${tab}${tab}FLAGS: ${flags}`;
			}
		}

		if (line) {
			if (DEBUG) console.log('finished parsing line, fulfilling...');
			fulfill(line, pc, flags);
		}
		else {
			if (DEBUG) console.error('ERROR PARSING LINE, REJECTING...');
			reject(line);
		}
	});
}


module.exports = {
	checkHeader: checkHeader,
	isHex: isHex,
	toHex: toHex,
        romParse: parse
}
