const { dfuProgrammerFlash } = require('./programmers/dfu-programmer');
const usb = require('usb');

const deviceIDs = {
	1003: 'dfu-programmer',
	9025: 'avrdude',
	6991: 'avrdude',
	9114: 'avrdude',
	1155: 'dfu-util'
};

function routes(keyboard) {
	fetch('http://api.qmk.fm/v1/keyboards/' + keyboard)
		.then(res => res.json())
		.then(data => data.keyboards[keyboard].processor)
		.then(processor => {
			USBdevices = usb.getDeviceList();
			USBdevicesQTY = USBdevices.length;
			for (let USBdevice of USBdevices) {
				vendorID = USBdevice.deviceDescriptor.idVendor.toString();
				productID = USBdevice.deviceDescriptor.idProduct.toString();
				// Check if known VID for AVR/ARM programmers
				if (Object.keys(deviceIDs).includes(vendorID)) {
					programmer = deviceIDs[vendorID];
					// Forwards onto seperate programming scripts found in ./modules/programmers
					switch (programmer) {
						case 'dfu-programmer':
							window.Bridge.statusAppend('\nUsing DFU-Programmer');
							dfuProgrammerFlash(productID, processor);
							break;
						case 'avrdude':
							window.Bridge.statusAppend('\nnot implemented yet');
							break;
						case 'dfu-util':
							window.Bridge.statusAppend('\nnot implemented yet');
							break;
						default:
							window.Bridge.statusAppend('\nProgrammer not yet implemented for this device');
							break;
					}
					break;
				} else if (USBdevice == USBdevices[USBdevicesQTY - 1]) {
					window.Bridge.statusAppend('\nRROR: No USB Device Found');
				}
			}
		})
		.catch(err => console.error(err));
}

module.exports = { routes };
