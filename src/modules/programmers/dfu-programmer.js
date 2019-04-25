const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const atmelDevices = {
	12270: ['atmega8u2'],
	12271: ['atmega16u2'],
	12272: ['atmega32u2'],
	12273: ['at32uc3a3'],
	12275: ['atmega16u4'],
	12276: ['atmega32u4'],
	12278: ['at32uc3b0', 'at32uc3b1'],
	12279: ['at90usb82'],
	12280: ['at32uc3a0', 'at32uc3a1'],
	12281: ['at90usb646'],
	12282: ['at90usb162'],
	12283: ['at90usb1286', 'at90usb1287'],
	12285: ['at89c5130', 'at89c5131'],
	12287: ['at89c5132', 'at89c5snd1c']
};

var found = false;

var dfuProgrammer = path.resolve('programmers', './dfu-programmer');

if (process.platform == 'win32') {
	dfuProgrammer = dfuProgrammer + '.exe';
	console.log(dfuProgrammer);
}

function dfuProgrammerFlash(productID, processor) {
	DFUdevice = '';
	if (Object.keys(atmelDevices).includes(productID)) {
		console.log(atmelDevices[productID])
		for (var i = 0; i < atmelDevices[productID].length; i++){
			dev = atmelDevices[productID][i]
			console.log(dev)
			if ((dev == processor) & !found) {
				DFUdevice = processor;
				console.log(DFUdevice);
        found = true;
				window.Bridge.statusAppend("found USB Device")
				flash(DFUdevice)
			}
		}
	}
	if (!found) {
		window.Bridge.statusAppend('\nPlease connect the Keyboard and enter reset');
	}
}

module.exports = {
	dfuProgrammerFlash
};

async function flash(Device){
	commands = [`${dfuProgrammer} ${Device} erase --force`, `${dfuProgrammer} ${Device} flash ${window.inputPath}`, `${dfuProgrammer} ${Device} reset`]
	console.log(commands)
	for (let v = 0; v < commands.length; v++) {
		const command = commands[v];
		const {stdout, stderro} = await exec(command)
		if (stderro) {
			console.error(`error: ${stderr}`);
			break;
  	}
		console.log(`Stdout: \n ${stdout}`);
		window.Bridge.statusAppend(`\n ${stdout}`)
	}
}

