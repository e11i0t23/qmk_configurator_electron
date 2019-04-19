const temp = require("temp");
const path = require("path");
const wget = require("node-wget-promise");
const selector = require("./modules/selector");

temp.track();
temp.mkdir("qmkconfigurator", function(err, dirPath) {
  window.tempFolder = dirPath;
});

var dfuProgrammer = path.resolve("dfu", "./dfu-programmer");

if (process.platform == "win32") {
  dfuProgrammer = dfuProgrammer + ".exe";
  console.log(dfuProgrammer);
}

async function flashURL(url, keyboard, filename) {
  console.log(url, keyboard, filename);
  window.inputPath = path.join(window.tempFolder, filename);
  wget(url, { output: window.inputPath })
    .then(window.Bridge.statusAppend("File downloaded to " + window.inputPath))
    .then(selector.routes(keyboard))
    .catch(err => console.error(err));
}

module.exports = {
  flashURL
};
