const Avrgirl = require('avrgirl-arduino');
const fs = require('fs');
/**
 * Flashing function for caterina bootloader using avrgirl
 * @param {String} board Arduino Board we flash to
 * @module programmers/caterina
 */
async function avrFlash(board) {
  if (!board) board = 'micro';
  const avrgirl = new Avrgirl({
    board: board,
  });
  const filesize = await fs.statSync(window.inputPath).size;
  console.log(filesize);
  if (filesize <=80684) {
    avrgirl.flash(window.inputPath, function(error) {
      if (error) {
        window.Bridge.statusAppend(error);
      } else window.Bridge.statusAppend('Successfully flashed board');
    });
  } else {
    window.Bridge.statusAppend('Invalid file provided');
  }
}

module.exports = {
  avrFlash,
};
