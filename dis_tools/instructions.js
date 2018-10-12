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

                return flags;
        },
        SEP: function (bytes, flags) {

                return flags;
        },
	ADC: function (bytes, flags) { return flags; },
        AND: function (bytes, flags) { return flags; },
        ASL: function (bytes, flags) { return flags; },
        BCC: function (bytes, flags) { return flags; },
        BCS: function (bytes, flags) { return flags; },
        BEQ: function (bytes, flags) { return flags; },
        BIT: function (bytes, flags) { return flags; },
        BMI: function (bytes, flags) { return flags; },
        BNE: function (bytes, flags) { return flags; },
        BPL: function (bytes, flags) { return flags; },
        BRA: function (bytes, flags) { return flags; },
        BRK: function (bytes, flags) { return flags; },
        BRL: function (bytes, flags) { return flags; },
        BVC: function (bytes, flags) { return flags; },
        BVS: function (bytes, flags) { return flags; },
        CMP: function (bytes, flags) { return flags; },
        COP: function (bytes, flags) { return flags; },
        CPX: function (bytes, flags) { return flags; },
        CPY: function (bytes, flags) { return flags; },
        DEC: function (bytes, flags) { return flags; },
        DEX: function (bytes, flags) { return flags; },
        DEY: function (bytes, flags) { return flags; },
        EOR: function (bytes, flags) { return flags; },
        INC: function (bytes, flags) { return flags; },
        INX: function (bytes, flags) { return flags; },
        INY: function (bytes, flags) { return flags; },
        JMP: function (bytes, flags) { return flags; },
        JML: function (bytes, flags) { return flags; },
        JSR: function (bytes, flags) { return flags; },
        JSL: function (bytes, flags) { return flags; },
        JSR: function (bytes, flags) { return flags; },
        LDA: function (bytes, flags) { return flags; },
        LDX: function (bytes, flags) { return flags; },
        LDY: function (bytes, flags) { return flags; },
	LSR: function (bytes, flags) { return flags; },
        MVN: function (bytes, flags) { return flags; },
        MVP: function (bytes, flags) { return flags; },
        NOP: function (bytes, flags) { return flags; },
        ORA: function (bytes, flags) { return flags; },
        PEA: function (bytes, flags) { return flags; },
        PEI: function (bytes, flags) { return flags; },
        PER: function (bytes, flags) { return flags; },
        PHA: function (bytes, flags) { return flags; },
        PHB: function (bytes, flags) { return flags; },
        PHD: function (bytes, flags) { return flags; },
        PHK: function (bytes, flags) { return flags; },
        PHP: function (bytes, flags) { return flags; },
        PHX: function (bytes, flags) { return flags; },
        PHY: function (bytes, flags) { return flags; },
        PLA: function (bytes, flags) { return flags; },
        PLB: function (bytes, flags) { return flags; },
        PLD: function (bytes, flags) { return flags; },
        PLP: function (bytes, flags) { return flags; },
        PLX: function (bytes, flags) { return flags; },
        PLY: function (bytes, flags) { return flags; },
        ROL: function (bytes, flags) { return flags; },
        ROR: function (bytes, flags) { return flags; },
        RTI: function (bytes, flags) { return flags; },
        RTL: function (bytes, flags) { return flags; },
        RTS: function (bytes, flags) { return flags; },
        SBC: function (bytes, flags) { return flags; },
        STA: function (bytes, flags) { return flags; },
        STP: function (bytes, flags) { return flags; },
        STX: function (bytes, flags) { return flags; },
        STY: function (bytes, flags) { return flags; },
        STZ: function (bytes, flags) { return flags; },
        TAX: function (bytes, flags) { return flags; },
        TAY: function (bytes, flags) { return flags; },
        TCD: function (bytes, flags) { return flags; },
        TCS: function (bytes, flags) { return flags; },
        TDC: function (bytes, flags) { return flags; },
        TRB: function (bytes, flags) { return flags; },
        TSB: function (bytes, flags) { return flags; },
        TSC: function (bytes, flags) { return flags; },
        TSX: function (bytes, flags) { return flags; },
        TXA: function (bytes, flags) { return flags; },
        TXS: function (bytes, flags) { return flags; },
        TXY: function (bytes, flags) { return flags; },
        TYA: function (bytes, flags) { return flags; },
        TYX: function (bytes, flags) { return flags; },
        WAI: function (bytes, flags) { return flags; },
        WDM: function (bytes, flags) { return flags; },
        XBA: function (bytes, flags) { return flags; },
        XCE: function (bytes, flags) { return flags; }
}
