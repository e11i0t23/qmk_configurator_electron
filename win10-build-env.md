* Install [Git for Windows](https://github.com/git-for-windows/git/releases/download/v2.6.3.windows.1/Git-2.6.3-64-bit.exe)
* Install [Node](https://nodejs.org/en/download/)
* Install [Python 2.7.3](https://www.python.org/ftp/python/2.7.3/python-2.7.3.amd64.msi)
* Install [Microsoft Visual Studio 2015 Community](https://go.microsoft.com/fwlink/?LinkId=532606&clcid=0x409)
* Open the command prompt as Administrator, run the following commands, then close the command prompt (a new prompt is required before the new environment variables will be available)
  * **npm install -g npm**
    * (Upgrades to npm v3, which no longer nests dependencies indefinitely. No more "maximum path length exceeded" errors due to the 260 character path limit in Windows, or needing to delete node_modules with rimraf.)
  * **setx PYTHON C:\Python27\python.exe /m**
    * (May need to change path to your custom install directory.)
* Open a new command prompt and run the following commands. If these install without errors, you have bypassed one of the most frustrating experiences for npm users on Windows.
  * **npm install -g node-gyp**
  * **npm install -g socket.io**
