require('./runtime');
var Server = require('./server');
var Utils = require('./utils');
var Clients = require('./clients');


console.log(`本机ip：${Utils.getLocalIp()}`);



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
        Utils.detectDevice();
        window.app.ui.runTime.serverState = true;
    });

});
utools.onPluginOut(() => {
    console.log('用户退出插件')
});
utools.onPluginReady(() => {
    console.log('onPluginReady');
    runTime.init();

    window.app = {
        ready: false,
        localIp: runTime.localIp,
        openShareUrl: () => { utools.shellOpenExternal('http://' + runTime.localIp + ':' + Server.port + '/share'); },
        checkServer: function (cb) { Server.check(cb); },
        //detectDevice: () => { Utils.detectDevice(); },
        clientRunTime: runTime.client,
        serverRunTime: Server.runTime,
        settings: runTime.settings,
        updSettings() { runTime.updSettings(); },
        showFile: function (path) {
            utools.shellShowItemInFolder(path);
        },
        selectPath: function (defaultPath) {
            let path = utools.showOpenDialog({
                title: '选择文件夹',
                defaultPath: runTime.settings.sharePath || utools.getPath('downloads'),
                buttonLabel: '选择',
                properties: ['openDirectory']
            });
            console.log(path);
            if (path)
                runTime.setting.sharePath = path[0];
            return !!path;
        },
        init() {

        }
    };
    require('./ui/index');
});
