

let options = {
    title: '测试窗口',
    width: 128,
    height: 300,
    useContentSize:true,
    fullscreen: false,
    // autoHideMenuBar: true,
    //skipTaskbar: true,
    backgroundColor: '#323332',
    webPreferences: {
        preload: './ui/freeWin/winCtrl.js',
        nodeIntegration: true,
        enableRemoteModule:true,
        contextIsolation: true
    },
    hasShadow: false,
        transparent: true,
        backgroundColor: '#00ffffff',
        frame: false,
        titleBarStyle: 'customButtonsOnHover',//'hiddenInset', //
};console.log(options)
const win = utools.createBrowserWindow('ui/freeWin/index.html', options, () => {
    
});
console.log(win);
win.webContents.openDevTools();
win.webContents.send('ping',window.app.history[0]);