DEBUG=true;

if (DEBUG)
        console.log('DEBUG ENABLED');

let fs = require('fs');

//let readStream = fs.createReadStream('./yoshi.sfc');

//let data = []

//readStream.on('data', chunk => {
//      chunk.forEach(i => {
//              data.push(i);
//      });
//});

//readStream.on('end', tmp => parse(data));

function parse(data, numBytes) {
        let parsed = [];

        for(let i=0,j=1; i < numBytes; i++) {
                parsed.push(toHex(data[i]));

                //split up bytes into rows
                if(DEBUG) {
                        if(j == 25) {
                                parsed.push('<br />');
                                j = 0;
                        }
                }
                j++;
        }
        return parsed;
}

function toHex(num,prefix=false) {
        return prefix ? num.toString(16) : '0x'.concat(num.toString(16));
}

module.exports = {
        parse: parse
}
