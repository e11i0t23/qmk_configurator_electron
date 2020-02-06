import {dfuProgrammerFlash} from './programmers/dfu-programmer';
import {Family, dfuUtilFlash} from './programmers/dfu-util';
import isUndefined from 'lodash/isUndefined';
import {AVRDudeFlash, Family as AVRDudeFamily} from './programmers/avrdude';
import {tlc} from './programmers/teensy_loader_cli';
import {atmelSamBa} from './programmers/mdloader';

import usb from 'usb';

export const deviceIDs: Map<number, string> = new Map([
  [0x03eb, 'dfu-programmer'], // Atmel vendor id
  [0x2341, 'caterina'], // Arduino vendor id
  [0x1b4f, 'caterina'], // Sparkfun vendor id
  [0x239a, 'caterina'], // adafruit vendor id
  [0x0483, 'dfu-util'],
  [0x1c11, 'dfu-util'],
  [0x16c0, 'avrisp/usbasp'],
  [0x1781, 'usbtiny'],
]);
let flashing = false;
let intervalID: NodeJS.Timeout;
let timeout: number;
/**
 * Selects the programmer to use
 * @param {String} processor
 * @module selector
 */
function selector(processor?: string): void {
  const USBdevices = usb.getDeviceList();
  const USBdevicesQTY = USBdevices.length;
  for (const USBdevice of USBdevices) {
    const vendorID = USBdevice.deviceDescriptor.idVendor;
    const productID = USBdevice.deviceDescriptor.idProduct;
    // Check if known VID for AVR/ARM programmers
    const programmer = deviceIDs.get(vendorID);
    if (!isUndefined(programmer)) {
      // Forwards onto seperate programming scripts found in ./modules/programmers
      switch (programmer) {
        case 'dfu-programmer':
          if (!flashing) {
            if (productID === 0x6124) {
              window.Bridge.statusAppend(' flashing atmel SamBa with mdloader');
              atmelSamBa();
            } else {
              window.Bridge.statusAppend('Using DFU-Programmer');
              dfuProgrammerFlash(
                productID,
                processor,
                window.Bridge.statusAppendNoLF
              );
            }
            flashing = true;
          }
          break;
        case 'caterina':
          if (!flashing) {
            flashing = true;
            window.Bridge.statusAppend('Using avrdude to flash caterina');
            AVRDudeFlash(
              window.inputPath,
              AVRDudeFamily.CATERINA,
              window.Bridge.statusAppendNoLF
            );
          }
          break;
        case 'avrisp/usbasp':
          if (!flashing) {
            flashing = true;
            if (productID == 0x0483) {
              window.Bridge.statusAppend('Using avrdude to flash avrisp');
              AVRDudeFlash(
                window.inputPath,
                AVRDudeFamily.AVRISP,
                window.Bridge.statusAppendNoLF
              );
            }
            if (productID == 0x05dc) {
              window.Bridge.statusAppend('Using avrdude to flash USBasp');
              AVRDudeFlash(
                window.inputPath,
                AVRDudeFamily.USBASP,
                window.Bridge.statusAppendNoLF
              );
            }
            if (productID == 0x0486 || productID == 0x0478) {
              window.Bridge.statusAppend(
                'Using Teensy loader to flash HalfKey'
              );
              tlc();
            }
          }
          break;
        case 'usbtiny':
          if (!flashing) {
            flashing = true;
            window.Bridge.statusAppend('Using avrdude to flash caterina');
            AVRDudeFlash(
              window.inputPath,
              AVRDudeFamily.USBTINY,
              window.Bridge.statusAppendNoLF
            );
          }
          break;
        case 'dfu-util':
          if (!flashing) {
            flashing = true;
            window.Bridge.statusAppend('Using dfu-util to flash dfu');
            if (vendorID === 0x0483) {
              dfuUtilFlash(
                window.inputPath,
                Family.stm32,
                window.Bridge.statusAppendNoLF
              );
            } else if (vendorID === 0x1c11) {
              dfuUtilFlash(
                window.inputPath,
                Family.kiibohd,
                window.Bridge.statusAppendNoLF
              );
            }
          }
          break;
        default:
          window.Bridge.statusAppend(
            'Programmer not yet implemented for this device'
          );
          break;
      }
      break;
    } else if (USBdevice == USBdevices[USBdevicesQTY - 1]) {
      if (!window.Bridge.autoFlash)
        window.Bridge.statusAppend(
          'ERROR: No USB Device Found. Try pressing reset on your keyboard'
        );
      else
        window.Bridge.statusAppend(
          'ERROR: No USB Device Found Retrying in 5 secs'
        );
    }
  }
}

/**
 * Calls API for processor the calls selector (repeatedly if autoflash)
 * @param {String} keyboard Takes a keyboard name from configurator
 * @param {String} processor Takes a processor name from form
 * @member selector
 */
export function routes(keyboard: string): void {
  console.log(keyboard);
  window.Bridge.autoFlash = false;
  flashing = false;
  if (keyboard != null) {
    window.Bridge.autoFlash = true;
    try {
      fetch('https://api.qmk.fm/v1/keyboards/' + keyboard)
        .then((res) => res.json())
        .then((data) => data.keyboards[keyboard].processor)
        .then((processor) => {
          flashing = false;
          selector(processor);
          console.log('Auto Flash: ', window.Bridge.autoFlash);
          if (window.Bridge.autoFlash) {
            timeout = 0;
            intervalID = setInterval(() => {
              if (timeout == 9) {
                window.Bridge.statusAppend('Flashing Timed-out');
                clearInterval(intervalID);
              } else if (!flashing) {
                selector(processor);
                timeout++;
              } else clearInterval(intervalID);
            }, 5000);
          }
        })
        .catch((err) => console.error(err));
    } catch (err) {
      console.error(err);
    }
  } else {
    selector();
  }
}
