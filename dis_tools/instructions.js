module.exports = {
	SEI: function (bytes, flags) {
		console.log('RAN SEI')
		flags.irq.set();
		return flags;
	},
	CLI: function (bytes, flags) {
		flags.irq.reset();
		return flags;
	},
	SEC: function (bytes, flags) {
		flags.carry.set();
		return flags;
	},
	CLC: function (bytes, flags) {
		flags.carry.reset();
		return flags;
	},
	SED: function (bytes, flags) {
		flags.decimal.set();
		return flags;
	},
	CLD: function (bytes, flags) {
		flags.decimal.reset();
		return flags;
	},
	CLV: function (bytes, flags) {
		flags.overflow.reset();
		return flags;
	},
	REP: function (bytes, flags) {
	    console.log('REP #$',bytes);
	    flags.resetFlags(Number('0x' + bytes));
		return flags;
	},
	SEP: function (bytes, flags) {
	    flags.setFlags(Number('0x' + bytes));
		return flags;
	},
    ADC: (bytes, flags) => { return flags; },
    AND: (bytes, flags) => { return flags; },
    ASL: (bytes, flags) => { return flags; },
    BCC: (bytes, flags) => { return flags; },
    BCS: (bytes, flags) => { return flags; },
    BEQ: (bytes, flags) => { return flags; },
    BIT: (bytes, flags) => { return flags; },
    BMI: (bytes, flags) => { return flags; },
    BNE: (bytes, flags) => { return flags; },
    BPL: (bytes, flags) => { return flags; },
    BRA: (bytes, flags) => { return flags; },
    BRK: (bytes, flags) => { return flags; },
    BRL: (bytes, flags) => { return flags; },
    BVC: (bytes, flags) => { return flags; },
    BVS: (bytes, flags) => { return flags; },
    CMP: (bytes, flags) => { return flags; },
    COP: (bytes, flags) => { return flags; },
    CPX: (bytes, flags) => { return flags; },
    CPY: (bytes, flags) => { return flags; },
    DEC: (bytes, flags) => { return flags; },
    DEX: (bytes, flags) => { return flags; },
    DEY: (bytes, flags) => { return flags; },
    EOR: (bytes, flags) => { return flags; },
    INC: (bytes, flags) => { return flags; },
    INX: (bytes, flags) => { return flags; },
    INY: (bytes, flags) => { return flags; },
    JMP: (bytes, flags) => { return flags; },
    JML: (bytes, flags) => { return flags; },
    JSR: (bytes, flags) => { return flags; },
    JSL: (bytes, flags) => { return flags; },
    JSR: (bytes, flags) => { return flags; },
    LDA: (bytes, flags) => { return flags; },
    LDX: (bytes, flags) => { return flags; },
    LDY: (bytes, flags) => { return flags; },
	LSR: (bytes, flags) => { return flags; },
    MVN: (bytes, flags) => { return flags; },
    MVP: (bytes, flags) => { return flags; },
    NOP: (bytes, flags) => { return flags; },
    ORA: (bytes, flags) => { return flags; },
    PEA: (bytes, flags) => { return flags; },
    PEI: (bytes, flags) => { return flags; },
    PER: (bytes, flags) => { return flags; },
    PHA: (bytes, flags) => { return flags; },
    PHB: (bytes, flags) => { return flags; },
    PHD: (bytes, flags) => { return flags; },
    PHK: (bytes, flags) => { return flags; },
    PHP: (bytes, flags) => { return flags; },
    PHX: (bytes, flags) => { return flags; },
    PHY: (bytes, flags) => { return flags; },
    PLA: (bytes, flags) => { return flags; },
    PLB: (bytes, flags) => { return flags; },
    PLD: (bytes, flags) => { return flags; },
    PLP: (bytes, flags) => { return flags; },
    PLX: (bytes, flags) => { return flags; },
    PLY: (bytes, flags) => { return flags; },
    ROL: (bytes, flags) => { return flags; },
    ROR: (bytes, flags) => { return flags; },
    RTI: (bytes, flags) => { return flags; },
    RTL: (bytes, flags) => { return flags; },
    RTS: (bytes, flags) => { return flags; },
    SBC: (bytes, flags) => { return flags; },
    STA: (bytes, flags) => { return flags; },
    STP: (bytes, flags) => { return flags; },
    STX: (bytes, flags) => { return flags; },
    STY: (bytes, flags) => { return flags; },
    STZ: (bytes, flags) => { return flags; },
    TAX: (bytes, flags) => { return flags; },
    TAY: (bytes, flags) => { return flags; },
    TCD: (bytes, flags) => { return flags; },
    TCS: (bytes, flags) => { return flags; },
    TDC: (bytes, flags) => { return flags; },
    TRB: (bytes, flags) => { return flags; },
    TSB: (bytes, flags) => { return flags; },
    TSC: (bytes, flags) => { return flags; },
    TSX: (bytes, flags) => { return flags; },
    TXA: (bytes, flags) => { return flags; },
    TXS: (bytes, flags) => { return flags; },
    TXY: (bytes, flags) => { return flags; },
    TYA: (bytes, flags) => { return flags; },
    TYX: (bytes, flags) => { return flags; },
    WAI: (bytes, flags) => { return flags; },
    WDM: (bytes, flags) => { return flags; },
    XBA: (bytes, flags) => { return flags; },
    XCE: (bytes, flags) => { return flags; }
}