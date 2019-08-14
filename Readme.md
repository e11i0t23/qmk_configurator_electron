# QMK Configurator Desktop

Beta version of an Electron based configurator desktop app with intergrated flashing

## Development

We recommend you install and use [NVM](https://github.com/creationix/nvm) to manage node versions. There is a .nvmrc file in the root of the project directory that has been tested with our dependencies.

### Select node version
```shell
nvm use
```

### Project setup
```
yarn install  
yarn run dist
```  
A build must be performed as it invokes rebuilding native modules (this will be updated soon)

### Compiles for development
```
yarn run start
```

### Compiles and minifies for production
```
yarn run dist
```

## App Structure
```  
├──dist  (generated on `yarn run dist`)  
├──build (contains extra files required for build)  
├──programmers  (This contains the binaries for the included programmers)  
└──src  
    ├──modules  (flashing related files)  
      ├──programmers (Scripts that invoke the different programmers)  
      └──selector.js (choses which programming module to use)
    ├──flash.js  (contains functions shared with the vue app 
    ├──main.js  (main file invoked by electron)  
    └──preload.js  (shares code between electron and vue)  
```

### Supporting following bootloaders:
  - DFU (Atmel, LUFA) via [dfu-programmer](http://dfu-programmer.github.io/)
  - Caterina (Arduino, Pro Micro) via [avrdude](http://nongnu.org/avrdude/)
  - Halfkay (Teensy, Ergodox EZ) via [teensy_loader_cli](https://pjrc.com/teensy/loader_cli.html)
  - STM32 (ARM) via [dfu-util](http://dfu-util.sourceforge.net/)
  - Kiibohd (ARM) via [dfu-util](http://dfu-util.sourceforge.net/)
  - Massdrop via [mdloader](https://github.com/Massdrop/mdloader)  

### And the following ISP flasher protocols:
  - USBTiny (AVR Pocket) via [avrdude](http://nongnu.org/avrdude/)
  - AVRISP (Arduino ISP) via [avrdude](http://nongnu.org/avrdude/)
