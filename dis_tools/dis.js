const DEBUG = 2;
//const OVERRIDE = 200;

let opcodeFunctions = require('./instructions.js');
const _ = require('lodash'),
	fs = require('fs'),
	os = require('os'),
	Promise = require('promise'),
	instructions = JSON.parse(fs.readFileSync('./dis_tools/instructions.json'));

let LINES_DATA = [], // raw data objects for each line
	LINES_DIS = [];  // "human-readable" disassembled string

if (DEBUG) console.log(instructions['0xef']);
if (DEBUG) console.log('DEBUG ENABLED');

function initFlags() {
	this.base = 'EnvMXdizc';
	this.current = 0b00110000;
	this.get = function () { return this.current.toString(2) };
	this.set = function (VAL) { this.current = VAL };
	this.getBit = POS => { return this.current & POS; };
	this.setBit = function (POS) {
		if (DEBUG) console.log('setting bit:', POS);
		this.current = this.current | (1 << POS);
	};
	this.clearBit = POS => this.current = this.current & ~(1 << POS);

	this.getString = function () {
		console.log(this.base);
		return _.split(this.base,'')
			.reverse()
			.map((ch, idx, arr) => {
				console.log(ch,this.getBit(2**idx));
				return this.getBit(2**idx)? ch.toUpperCase(): ch.toLowerCase();
			})
			.reverse()
			.join('');
	};

	this.carry = {
		pos: 0,     // position
		get: () => this.getBit(this.carry.pos),
		set: () => { this.setBit(this.carry.pos) },
		reset: () => this.clearBit(this.carry.pos),
		triggers: [/SEC/, /CLC/]
	};
	this.zero = {
		pos: 1,     // position
		get: () => this.getBit(this.zero.pos),
		set: () => this.setBit(this.zero.pos),
		reset: () => this.clearBit(this.zero.pos),
		triggers: []
	};
	this.irq = {
		pos: 2,     // position
		get: () => this.getBit(this.irq.pos),
		set: () => this.setBit(this.irq.pos),
		reset: () => this.clearBit(this.irq.pos),
		triggers: [/SEI/, /CLI/]
	};
	this.decimal = {
		pos: 3,     // position
		get: () => this.getBit(this.decimal.pos),
		set: () => this.setBit(this.decimal.pos),
		reset: () => this.clearBit(this.decimal.pos),
		triggers: [/SED/, /CLD/]
	};
	this.index8bit = {
		pos: 4,     // position
		get: () => this.getBit(this.index8bit.pos),
		set: () => this.setBit(this.index8bit.pos),
		reset: () => this.clearBit(this.index8bit.pos),
		triggers: [/REP/, /SEP/]
	};
	this.accumulator8bit = {
		pos: 5,     // position
		get: () => this.getBit(this.accumulator8bit.pos),
		set: () => this.setBit(this.accumulator8bit.pos),
		reset: () => this.clearBit(this.accumulator8bit.pos),
		triggers: [/SEC/, /CLC/]
	};
	this.overflow = {
		pos: 6,     // position
		get: () => this.getBit(this.overflow.pos),
		set: () => this.setBit(this.overflow.pos),
		reset: () => this.clearBit(this.overflow.pos),
		triggers: [/SEP/, /CLV/]
	};
	this.negative = {
		pos: 7,     // position
		get: () => this.getBit(this.negative.pos),
		set: () => this.setBit(this.negative.pos),
		reset: () => this.clearBit(this.negative.pos),
		triggers: []
	};
	this.emulation = {
		pos: 8,     // position
		get: () => this.getBit(this.emulation.pos),
		set: () => this.setBit(this.emulation.pos),
		reset: () => this.clearBit(this.emulation.pos),
		triggers: ['XCE']
	};
}

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
function parse(rom, metadata, pc, header=[], numBytes, callback) {
	let numBytesToDis = parseInt(numBytes) || rom.length,
		flags = new initFlags();

	if (DEBUG) console.log('begin ROM parse');

	return new Promise((fulfill, reject) => {
		if (DEBUG) console.log('pc:',pc);
		parseRecursive(rom, pc, pc, flags, numBytesToDis, (err, data) => {
			if (err)
				reject({err: 2, msg: 'ERROR PARSING LINE', data: data});
			//.then(data => {
			if (DEBUG) console.log('COMPLETE! RETURNING...');
			if (LINES_DATA && LINES_DIS) {
				LINES_DATA = [];
				fulfill(LINES_DIS.join('<br />'));
				LINES_DIS = [];
			}
			//})
			//.catch(err => reject({err: 2, msg: 'ERROR PARSING LINE', data: err}));
		});
	});
}

/*
 * Begin ROM parsing. Recursively called until the whole ROM is disassembled.
 * Kicks off the readLine() function, which disassembles each line
 * @rom - buffer of rom bytes
 * @pc - current program counter
 * @flags - object containing processor flags
 * @callback - callback to parse(), executed either when we finish or when there's an error
 */
function parseRecursive(rom, pc=0, pcstart=0, flags, numBytesToDis, callback) {
	if (DEBUG > 1) console.log('start parseRecursive()');
	if (DEBUG > 1) console.log('pcstart:',pcstart);
	// parse one line (opcode + 1-3 args, or data)
	readLine(rom, pc, flags)
		.then(function (newline, newpc, newflags) {
			console.log('FLAGS:',flags.getString());
			if (DEBUG) console.log('finished:', newpc);
			pc += newline.length;
			if (DEBUG) console.log('starting:' + pc);

			// store parsed line data
			LINES_DATA.push(newline);
			LINES_DIS.push(newline.line());

			// continue until we run out of bytes
			if (pc <= pcstart+numBytesToDis) {
				if (DEBUG > 1) console.log('continuing to next line. pcstart:', pcstart);
				if (DEBUG > 1) console.log('numBytesToDis:', numBytesToDis);
				if (DEBUG > 1) console.log('pc:', pc);
				parseRecursive(rom, pc, pcstart, flags, numBytesToDis, callback);
			}
			else
				callback(0, LINES_DIS); // callback to main function
		})
		// throw error if there's any problems
		.catch(err => {
			callback(1, err);
		});

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
function readLine(rom, pc, flags) {
	return new Promise((fulfill, reject) => {
		if (DEBUG) console.log('rom size:', rom.length, 'pc:', pc, 'flags:', flags);

		let address = pc,
		    args        = [],
		    bytesRaw    = [],
			compiled    = '',
		    currByte    = '0x',
			format      = '',
		    length      = 0,
		    line        = {},
		    opcode      = '',
			parsed      = '',
		    prefix      = '',
			run         = e => console.log('No run function specified');

		pc = Number(pc);
		currByte = toHex(rom[pc], true);
		
		if (DEBUG) console.log('current byte (dec):', rom[Number(pc)]);
		if (DEBUG) console.log('current byte (hex):', currByte);
		
		opcode  = instructions[currByte].opcode;
		format  = instructions[currByte].format;
		length  = instructions[currByte].length;
		//run     = instructions[currByte].run;

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

		if (DEBUG>1) console.log('assembling line string');
		compiled = _.template(format),
			parsed = compiled({bytes: args.reverse().join('')})

		if (DEBUG) console.log('executing run function');
		//eval("opcodeFunctions." + opcode + "(args)");
		flags = opcodeFunctions[opcode](args, flags);

		line = {
			address: address,
			opcode: opcode,
			format: parsed,
			length: length,
			bytesRaw: bytesRaw,
			args: args,
			flags: flags,
			// concat all elements in line
			line: () => {
				let tab = '&nbsp;&nbsp;&nbsp;&nbsp;'; // four spaces
				if (DEBUG) console.log('running line concat (line.line())');
				// TODO refactor and space properly
				return `${toHex(address,true,6)}${tab}${tab}${opcode}${tab}${parsed}${tab}${tab}${tab}${tab};${tab}BYTES: ${bytesRaw.join(' ')}${tab}${tab}FLAGS: ${flags.getString()}`;
			}
		};
		//console.log('flags:',flags)

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


/*
 * Checks if the ROM has an SMC header
 * @metadata - rom file metadata
 * @rom - buffer of rom bytes
 *
 * Returns:
 * @hasHeader - bool indicating whether the ROM has a header
 */
function checkHeader(metadata, rom=null) {
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

function isHex(str, callback) {
	if (DEBUG > 1) console.log('begin isHex:('+str+')');

	let re_hexch = /(0[xX])?[0-9a-fA-F]{1,6}/,
		re_hexprefix = /^0[xX]/;

	if (str.match(re_hexch)) {
		if (!str.match(re_hexprefix))
			str = '0x'.concat(str);

		callback(true, Number(str));	// validate "0xyyyyyy"
	} else callback(false, null);
}


module.exports = {
	checkHeader: checkHeader,
	isHex: isHex,
	toHex: toHex,
        romParse: parse
};
