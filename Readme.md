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
yarn run build
```  
A build must be performed as it invokes rebuilding native modules

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
├──programmers  (This contains the binaries for the included programmers)  
└──src  
    ├──modules  (flashing related files)  
      ├──programmers (Scripts that invoke the different programmers)  
      └──selector.js (choses which programming module to use)
    ├──flash.js  (contains functions shared with the vue app 
    ├──main.js  (main file invoked by electron)  
    └──preload.js  (shares code between electron and vue)  
```
