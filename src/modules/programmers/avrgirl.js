const Avrgirl = require('avrgirl-arduino');

/*
  |Programmerc-----------------------|Board Option String|
  |:---------------------------------|:------------------|
  |Arduino Uno                       |uno|
  |Arduino Mega                      |mega|
  |Arduino ADK                       |adk|
  |Arduino Leonardo                  |leonardo|
  |Arduino Micro                     |micro|
  |Arduino Nano                      |nano|
  |Arduino Nano (with new bootloader)|nano (new bootloader)|
  |Arduino Lilypad USB               |lilypad-usb|
  |Arduino Duemilanove               |duemilanove168|
  |Arduino Yun                       |yun|
  |Arduino Esplora                   |esplora|
  |RedBearLab Blend Micro            |blend-micro|
  |Tiny Circuits Tinyduino           |tinyduino|
  |SparkFun Pro Micro                |sf-pro-micro|
  |Qtechknow Qduino                  |qduino|
  |Pinoccio Scout                    |pinoccio|
  |Femtoduino IMUduino               |imuduino|
  |Adafruit Feather 32u4 Basic Proto |feather|
  |Arduboy                           |arduboy|
  |Adafruit Circuit Playground       |circuit-playground-classic|
  |BQ ZUM                            |bqZum|
  |BQ ZUM Core 2                     |zumcore2|
  |BQ ZUM Junior                     |zumjunior|
*/


/**
 * Processing unit for flashing with avrgirl(caterina)
 * @param {String} board caterina based board to flash
 */
function avrGirlFlash(board) {
  const avrgirl = new Avrgirl({
    board: board,
    manualReset: true,
  });

  avrgirl.flash(window.filepath, function(error) {
    if (error) {
      console.error(error);
      window.Bridge.statusAppend('\n');
      window.Bridge.statusAppend(error);
    } else {
      window.Bridge.statusAppend('\n \n Successfully Flashed Keymap onto device');
    }
  });
}

module.exports = {
  avrGirlFlash,
};

