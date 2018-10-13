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

//todo move this & clean up
class Flags {
	constructor(memory8Bit, index8Bit) {
		this.base = 'EnvMXdizc';
		this.current = 0b100110000;
		this.MEMORY = memory8Bit;
		this.INDEX = index8Bit;
		this.set = VAL => this.current = VAL;

		this.getBit = POS => this.current & POS; //(1 << POS);
		this.setBit = POS => {
			if (DEBUG) console.log('setting bit:', POS, this.current);
			this.current |= (1 << POS);
			console.log(this.current)
		};
		this.clearBit = POS => this.current = this.current & ~(1 << POS);

		this.setFlags = VAL => {
			if (DEBUG) console.log('setting bits:', isHex('0x' + VAL, console.log), this.current);
			isHex('0x' + VAL, (res, hex) => {
				this.current |= hex;
			});
			console.log(this.current)
		};
		this.resetFlags = VAL => {
			if (DEBUG) console.log('resetting bits:', isHex('0x' + VAL, console.log), this.current);
			isHex('0x' + VAL, (res, hex) => {
				this.current &= ~hex;
			});
			console.log(this.current);
		};

		this.getString = function () {
			console.log('getString()', this.current);
			return _.split(this.base, '')
				.reverse()
				.map((ch, idx, arr) => {
					console.log(ch, this.getBit(2 ** idx));
					return this.getBit(2 ** idx) ? ch.toUpperCase() : ch.toLowerCase();
				})
				.reverse()
				.join('');
		};

		this.carry = {
			pos: 0,     // position
			get: () => this.getBit(this.carry.pos),
			set: () => this.setBit(this.carry.pos),
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
		this.index = {
			pos: 4,     // position
			get: () => this.getBit(this.index.pos),
			set: () => this.setBit(this.index.pos),
			reset: () => this.clearBit(this.index.pos),
			triggers: [/REP/, /SEP/]
		};
		this.memory = {
			pos: 5,     // position
			get: () => this.getBit(this.memory.pos),
			set: () => this.setBit(this.memory.pos),
			reset: () => this.clearBit(this.memory.pos),
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

	get CARRY() { return this.current & (1 << 0); }
	get ZERO() { return this.current & (1 << 1); }
	get IRQ() { return this.current & (1 << 2); }
	get DECIMAL() { return this.current & (1 << 3); }
	get INDEX() { return this.current & (1 << 4); }
	get MEMORY() { return this.current & (1 << 5); }
	get OVERFLOW() { return this.current & (1 << 6); }
	get NEGATIVE() { return this.current & (1 << 7); }
	get EMULATION() { return this.current & (1 << 8); }

	set CARRY(x) { x? this.current |= (1 << 0): this.current &= ~(1 << 0); }
	set ZERO(x) { x? this.current |= (1 << 1): this.current &= ~(1 << 1); }
	set IRQ(x) { x? this.current |= (1 << 2): this.current &= ~(1 << 2); }
	set DECIMAL(x) { x? this.current |= (1 << 3): this.current &= ~(1 << 3); }
	set INDEX(x) { x? this.current |= (1 << 4): this.current &= ~(1 << 4); }
	set MEMORY(x) { x? this.current |= (1 << 5): this.current &= ~(1 << 5); }
	set OVERFLOW(x) { x? this.current |= (1 << 6): this.current &= ~(1 << 6); }
	set NEGATIVE(x) { x? this.current |= (1 << 7): this.current &= ~(1 << 7); }
	set EMULATION(x) { x? this.current |= (1 << 8): this.current &= ~(1 << 8); }

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
function parse(rom, metadata, pc, header=[], numBytes, flags, callback) {
	let numBytesToDis = parseInt(numBytes) || rom.length;
		//flags = new Flags();

	if (DEBUG) console.log('begin ROM parse');

	return new Promise((fulfill, reject) => {
		if (DEBUG) console.log('pc:',pc);
		parseRecursive(rom, pc, pc, flags, numBytesToDis, (err, data) => {
			if (err)
				reject({err: 2, msg: 'ERROR PARSING LINE', data: data});

			if (DEBUG) console.log('COMPLETE! RETURNING...');
			if (LINES_DATA && LINES_DIS) {
				LINES_DATA = [];
				fulfill(LINES_DIS.join('<br />'));
				LINES_DIS = [];
			}
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

		const MemoryOpcodes = ['LDA', 'SBC', 'ADC', 'BIT', 'AND', 'CMP',
								'EOR', 'ORA'],
			IndexOpcodes = ['LDX', 'LDY', 'CPX', 'CPY'];
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

		if (DEBUG > 1) console.log('INDEX',flags.INDEX,'MEMORY',flags.MEMORY,'FORMAT',format);
		if (format.startsWith('#')) {
			if (!flags.MEMORY) {
				if (MemoryOpcodes.indexOf(opcode) > -1)
					length++;
			}
			if (!flags.INDEX) {
				if (IndexOpcodes.indexOf(opcode) > -1)
					length++;
			}
		}

		// read 2-3 additional byte args
		if (DEBUG) console.log('reading line args');
		for (let i=1; i < length; i++) {
			args.push(toHex(rom[pc+i]));
		}

		// store all associated bytes
		if (DEBUG) console.log('reading line bytes');
		for (let i=0; i<length; i++) {
			bytesRaw.push(toHex(rom[pc+i]));
		}

		if (DEBUG>1) console.log('assembling line string');
		compiled = _.template(format),
			parsed = compiled({bytes: args.reverse().join('')})

		if (DEBUG) console.log('executing run function');
		//eval("opcodeFunctions." + opcode + "(args)");
		flags = opcodeFunctions[opcode](toHex(args.reverse().join('')), flags);
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

function parseData(rom, pc, numBytes, byteSizer='db', lineSize=8) {
	return new Promise((fulfill, reject) => {
		if (!numBytes) reject('ERROR NO BYTES TO DISASSEMBLE');
		let bytes = [],
			bytesRaw = [],
			bytesExtra = [],
			bytesExtraRaw = [],
			rows = [],
			length = 1;

		switch (byteSizer) {
			case 'db':
				length = 1;
				break;
			case 'dw':
				length = 2;
				break;
			case 'dl':
				length = 3;
				break;
			case 'dd':
				length = 4;
				break;
			default:
				length = 1;
		}

		if (DEBUG) console.log('byte length:', length);

		for (let i = 0; i < numBytes;) {
			console.log(numBytes - i);

			if ((numBytes - i) < length) {  // handle extraneous bytes
				if (DEBUG) console.log('handling extra bytes', rom[pc]);
				//length = 1;
				bytesExtra.push('$' + toHex(rom[pc]));
				pc++;

				if (i + 1 === numBytes) break;
				i += 1;
				continue;
			}

			for (let j = 0; j < length; j++) {
				bytesRaw.push(toHex(rom[pc + j]));
				if (DEBUG) console.log('pushed bytesraw:', rom[pc+j], j);
			}
			bytes.push('$' + bytesRaw.reverse().join(''));
			if (DEBUG) console.log('pushed bytes:', bytesRaw.reverse().join(''), i);

			bytesRaw = [];
			pc += length;
			i += length;
		}
		if (DEBUG) console.log('chunking bytes:',bytes);
		bytes = _.chunk(bytes, lineSize);
		_.each(bytes, row => {
			rows.push(byteSizer + ' ' + row.join(', ') + '<br />');
		});
		bytesExtra.length? rows.push('db ' + bytesExtra.join(', ')): {};
		fulfill(`${rows.join('')}`);
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
	romParse: parse,
	parseData: parseData,
	Flags: Flags
};
