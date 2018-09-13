let fs = require('fs');

let readStream = fs.createReadStream('./yoshi.sfc');

let data = []

readStream.on('data', chunk => {
	chunk.forEach(i => {
		data.push(i);
	});
});

readStream.on('end', tmp => parse(data));

function parse(data) {
	for(let i=0; i < 5; i++) {
		console.log(toHex(data[i]))
	}
}

function toHex(num,prefix=false) {
	return prefix ? num.toString(16) : '0x'.concat(num.toString(16));
}
