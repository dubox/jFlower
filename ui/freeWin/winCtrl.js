const {ipcRenderer} = require('electron');

window.app = {
    h:{}
};
console.log('ooo');
var ipcTargetId = 0;
ipcRenderer.on('ping', (event, data) => {console.log('999');
    console.log(event);
    console.log(data);
    ipcTargetId = event.senderId;
    window.app.h = data;
    window.app.ui.item = data;
})
ipcRenderer.send('pong', 'sssss');
ipcRenderer.sendTo(0, 'pong','0000')
// require("./index");


window.EXT = {
    minimize(){
        ipcRenderer.sendTo(ipcTargetId, 'pong',{act:'minimize'});
    },
};