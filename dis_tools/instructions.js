
module.exports = {
	SEI: function (bytes) {
		console.log('RAN SEI')
		flags.irq.set();
	},
	CLI: function (bytes) {
		flags.irq.reset();
	},
	SEC: function (bytes) {
		flags.carry.set();
	},
	CLC: function (bytes) {
		flags.carry.reset();
	},
	SED: function (bytes) {
		flags.decimal.set();
	},
	CLD: function (bytes) {
		flags.decimal.reset();
	},
	CLV: function (bytes) {
		flags.overflow.reset();
	},
	REP: function (bytes) {

	},
	SEP: function (bytes) {

	}
}

