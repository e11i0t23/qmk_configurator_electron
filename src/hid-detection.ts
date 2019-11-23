import usbDetect from 'usb-detection'
import HID from 'node-hid'

export function hidInit(){
    usbDetect.startMonitoring();
}

usbDetect.on('add', function(device) { 
  setTimeout(function () { 
    var devices = HID.devices();
    devices.forEach(d => { 
      if(d.vendorId === device.vendorId && d.productId === device.productId && d.usage === 6){ 
        window.Bridge.statusAppend(`HID Device Connected: ${d.manufacturer}:${d.product}`);
      }
    })
  }, 500)
});
usbDetect.on('remove', function(device) { window.Bridge.statusAppend('HID Device Disconnected')});