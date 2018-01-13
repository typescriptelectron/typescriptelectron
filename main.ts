const electron = require('electron')

// Check if we are in development
const isDev = require('electron-is-dev')

// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow
// ipcMain
const ipcMain = electron.ipcMain
// Menu
const Menu = electron.Menu
const MenuItem = electron.MenuItem

// File system
const fs = require("fs")
// Child process
const { spawn } = require("child_process")

const path = require('path')
const url = require('url')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow:any
let mainContents:any

let config:any={
  windows:{
    main:{
      props:{
        width:1000,
        height:700
      }
    }
  }
}

function equipWindow(id:string,w:any){
  w.on("move",(e:any)=>{
    let pos=w.getPosition()
    let props=config.windows[id].props
    props.x=pos[0]
    props.y=pos[1]
    writeConfig(mainWindow)
  })
  w.on("resize",(e:any)=>{    
    let size=w.getSize()    
    let props=config.windows[id].props
    props.width=size[0]
    props.height=size[1]
    writeConfig(mainWindow)
  })
}

function readConfig(callback:any){  
  fs.readFile("config.json", 'utf8', function (err:any, data:any) {
    if (err){
      console.log(err)        
    }else{
      //console.log(data)
      try{
        let parsedConfig=JSON.parse(data)
        config=parsedConfig
        //console.log(config)
      }catch(err){
        console.log(err)
      }        
    }  
    callback()    
  })  
}

function writeConfig(w:any){
  fs.writeFile('config.json', JSON.stringify(config,null,2), (err:any) => {
    if(err){
      console.log(err)
    }else{
      //console.log(config)
    }
  })
  if(w!=null) w.webContents.send('setConfig', config)
}

class LogItem{
  text:string=""
  constructor(text:string){
    this.text=text
  }
}

class Log{
  items:LogItem[]=[]
  log(li:LogItem){
    this.items.unshift(li)
  }
  reportHtml():string{
    return "<pre>"+this.items.map(item=>item.text).join("")+"</pre>"
  }
}

let log=new Log()

let buildproc

function buildProcLog(li:LogItem){
  log.log(li)
  mainWindow.webContents.send('setBuildLog', log.reportHtml())
}

function doProject(action:string){
  buildproc=spawn(config.pythonPath,["build.py",action])
  buildproc.on("error",(err:any)=>console.log(err))
  buildproc.stdout.on("data",(data:any)=>{
    buildProcLog(new LogItem(data))
  })
  buildproc.stderr.on("data",(data:any)=>{
    buildProcLog(new LogItem(data))
  })
}

function buildProject(){doProject("build")}
function deleteProject(){doProject("delete")}

function createWindow () {
  // Create the browser window.

  readConfig(()=>{
      // and load the index.html of the app.
      mainWindow = new BrowserWindow(config.windows.main.props)

      mainWindow.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
      }))

      mainContents=mainWindow.webContents

      mainContents.on("did-finish-load",() => {    
        writeConfig(mainWindow)
      })

      // Open the DevTools.
      // mainWindow.webContents.openDevTools()

      // Emitted when the window is closed.
      mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
      })

      equipWindow("main",mainWindow)

      if(isDev){
        let filemenu=Menu.getApplicationMenu().items[0].submenu

        filemenu.items[0].visible=false

        filemenu.append(new MenuItem({label: 'Delete Project', click() { deleteProject() }}))
        filemenu.append(new MenuItem({label: 'Build Project', click() { buildProject() }}))
        filemenu.append(new MenuItem({label: 'Exit', click() { quit() }}))
      }else{
        const template=[
          {
            label:"File",
            submenu:[
              {
                label:"Exit",
                click:()=>{quit()}
              }
            ]
          },
          {
            label:"Project",
            submenu:[
              {
                label:"Delete",
                click:()=>{deleteProject()}
              },
              {
                label:"Build",
                click:()=>{buildProject()}
              }
            ]
          }
        ]

        let menu=Menu.buildFromTemplate(template)

        mainWindow.setMenu(menu)
      }

      ipcMain.on("configchanged",(event:any,arg:any)=>{
        config=arg
        writeConfig(null)
      })
    }
  )
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

function quit(){
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
}

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  quit()
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

const dialog = electron.dialog
exports.selectPythonPath=function (){
  dialog.showOpenDialog(
    mainWindow,
    {
      title:"Select Python path",
      buttonLabel:"Select",
      properties: ['openFile']
    },
    (filePaths:string[])=>{
      if(filePaths!=undefined) if(filePaths.length>0){
        config.pythonPath=filePaths[0]
        writeConfig(mainWindow)
      }
    }
  )
}
