import usbDetect from 'usb-detection';
import HID from 'node-hid';
import {deviceIDs} from './modules/selector';
import usb from 'usb';
import isUndefined from 'lodash/isUndefined';

export function detectionInit() {
  usbDetect.startMonitoring();

  const USBdevices = usb.getDeviceList();
  setTimeout(function() {
    USBdevices.forEach((device) => {
      console.log(device);
      const programmer = deviceIDs.get(device.deviceDescriptor.idVendor);
      if (!isUndefined(programmer)) {
        window.Bridge.statusAppend(
          `${programmer} device connected: ${device.deviceDescriptor.iProduct}`
        );
      }
    });
  }, 2000);
}

usbDetect.on('add', function(device) {
  setTimeout(function() {
    var devices = HID.devices();
    devices.forEach((d) => {
      if (
        d.vendorId === device.vendorId &&
        d.productId === device.productId &&
        d.usage === 6
      ) {
        window.Bridge.statusAppend(
          `HID Device Connected: ${d.manufacturer}:${d.product}`
        );
      }
    });
  }, 500);
  const programmer = deviceIDs.get(device.vendorId);
  if (!isUndefined(programmer)) {
    window.Bridge.statusAppend(
      `${programmer} device connected: ${device.deviceName}`
    );
  }
});

usbDetect.on('remove', function(device) {
  const programmer = deviceIDs.get(device.vendorId);
  if (!isUndefined(programmer)) {
    window.Bridge.statusAppend(
      `${programmer} device disconnected: ${device.deviceName}`
    );
  } else {
    window.Bridge.statusAppend(
      `USB device disconnected: ${device.manufacturer}:${device.deviceName}`
    );
  }
});
