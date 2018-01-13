"use strict";
var electron = require('electron');
// Check if we are in development
var isDev = require('electron-is-dev');
// Module to control application life.
var app = electron.app;
// Module to create native browser window.
var BrowserWindow = electron.BrowserWindow;
// ipcMain
var ipcMain = electron.ipcMain;
// Menu
var Menu = electron.Menu;
var MenuItem = electron.MenuItem;
// File system
var fs = require("fs");
// Child process
var spawn = require("child_process").spawn;
var path = require('path');
var url = require('url');
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow;
var mainContents;
var config = {
    windows: {
        main: {
            props: {
                width: 1000,
                height: 700
            }
        }
    }
};
function equipWindow(id, w) {
    w.on("move", function (e) {
        var pos = w.getPosition();
        var props = config.windows[id].props;
        props.x = pos[0];
        props.y = pos[1];
        writeConfig(mainWindow);
    });
    w.on("resize", function (e) {
        var size = w.getSize();
        var props = config.windows[id].props;
        props.width = size[0];
        props.height = size[1];
        writeConfig(mainWindow);
    });
}
function readConfig(callback) {
    fs.readFile("config.json", 'utf8', function (err, data) {
        if (err) {
            console.log(err);
        }
        else {
            //console.log(data)
            try {
                var parsedConfig = JSON.parse(data);
                config = parsedConfig;
                //console.log(config)
            }
            catch (err) {
                console.log(err);
            }
        }
        callback();
    });
}
function writeConfig(w) {
    fs.writeFile('config.json', JSON.stringify(config, null, 2), function (err) {
        if (err) {
            console.log(err);
        }
        else {
            //console.log(config)
        }
    });
    if (w != null)
        w.webContents.send('setConfig', config);
}
var LogItem = /** @class */ (function () {
    function LogItem(text) {
        this.text = "";
        this.text = text;
    }
    return LogItem;
}());
var Log = /** @class */ (function () {
    function Log() {
        this.items = [];
    }
    Log.prototype.log = function (li) {
        this.items.unshift(li);
    };
    Log.prototype.reportHtml = function () {
        return "<pre>" + this.items.map(function (item) { return item.text; }).join("") + "</pre>";
    };
    return Log;
}());
var log = new Log();
var buildproc;
function buildProcLog(li) {
    log.log(li);
    mainWindow.webContents.send('setBuildLog', log.reportHtml());
}
function doProject(action) {
    buildproc = spawn(config.pythonPath, ["build.py", action]);
    buildproc.on("error", function (err) { return console.log(err); });
    buildproc.stdout.on("data", function (data) {
        buildProcLog(new LogItem(data));
    });
    buildproc.stderr.on("data", function (data) {
        buildProcLog(new LogItem(data));
    });
}
function buildProject() { doProject("build"); }
function deleteProject() { doProject("delete"); }
function createWindow() {
    // Create the browser window.
    readConfig(function () {
        // and load the index.html of the app.
        mainWindow = new BrowserWindow(config.windows.main.props);
        mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'index.html'),
            protocol: 'file:',
            slashes: true
        }));
        mainContents = mainWindow.webContents;
        mainContents.on("did-finish-load", function () {
            writeConfig(mainWindow);
        });
        // Open the DevTools.
        // mainWindow.webContents.openDevTools()
        // Emitted when the window is closed.
        mainWindow.on('closed', function () {
            // Dereference the window object, usually you would store windows
            // in an array if your app supports multi windows, this is the time
            // when you should delete the corresponding element.
            mainWindow = null;
        });
        equipWindow("main", mainWindow);
        if (isDev) {
            var filemenu = Menu.getApplicationMenu().items[0].submenu;
            filemenu.items[0].visible = false;
            filemenu.append(new MenuItem({ label: 'Delete Project', click: function () { deleteProject(); } }));
            filemenu.append(new MenuItem({ label: 'Build Project', click: function () { buildProject(); } }));
            filemenu.append(new MenuItem({ label: 'Exit', click: function () { quit(); } }));
        }
        else {
            var template = [
                {
                    label: "File",
                    submenu: [
                        {
                            label: "Exit",
                            click: function () { quit(); }
                        }
                    ]
                },
                {
                    label: "Project",
                    submenu: [
                        {
                            label: "Delete",
                            click: function () { deleteProject(); }
                        },
                        {
                            label: "Build",
                            click: function () { buildProject(); }
                        }
                    ]
                }
            ];
            var menu = Menu.buildFromTemplate(template);
            mainWindow.setMenu(menu);
        }
        ipcMain.on("configchanged", function (event, arg) {
            config = arg;
            writeConfig(null);
        });
    });
}
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);
function quit() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
}
// Quit when all windows are closed.
app.on('window-all-closed', function () {
    quit();
});
app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
var dialog = electron.dialog;
exports.selectPythonPath = function () {
    dialog.showOpenDialog(mainWindow, {
        title: "Select Python path",
        buttonLabel: "Select",
        properties: ['openFile']
    }, function (filePaths) {
        if (filePaths != undefined)
            if (filePaths.length > 0) {
                config.pythonPath = filePaths[0];
                writeConfig(mainWindow);
            }
    });
};
