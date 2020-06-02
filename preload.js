require('./runtime');
var Server = require('./server');
var Utils = require('./utils');
var Clients = require('./clients');


Utils.toast(`本机ip：${Utils.getLocalIp()}`);

window.app = {
    localIp: Utils.getLocalIp(),
    checkServer: function (cb) { Server.check(cb); },
    detectDevice: () => { Utils.detectDevice(); },
    clientRunTime: runTime.client,
    serverRunTime: Server.runTime,
    showFile: function (path) {
        utools.shellShowItemInFolder(path);
    },
    selectPath: function () {
        let path = utools.showSaveDialog({
            title: '选择文件夹',
            defaultPath: utools.getPath('downloads'),
            buttonLabel: '选择'
        });
        if (path)
            runTime.setting.sharePath = path;
        return !!path;
    },
    checkPathServer() {

    }
}


utools.onPluginEnter(({ code, type, payload, optional }) => {
    console.log('用户进入插件', code, type, payload);

    if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(code)) {

        if (type == 'files') {
            Clients.sendFile(code, payload, Clients.sentCallback);
        } else if (type == 'img') {
            Clients.sendImg(code, payload, Clients.sentCallback);
        } else {
            Clients.sendText(code, payload, Clients.sentCallback);
        }


    }
    window.app.ui.runTime.serverState = false;
    Server.check(() => {
        console.log('server check ok');
        window.app.ui.runTime.serverState = true;
    });

});
utools.onPluginOut(() => {
    console.log('用户退出插件')
})
utools.onPluginReady(() => {
    console.log('onPluginReady');

})


