global.runTime = require('./runtime');
var Server = require('./server');
var Utils = require('./utils');
var Clients = require('./clients');


console.log(`本机ip：${Utils.getLocalIp()}`);



utools.onPluginEnter(({
    code,
    type,
    payload,
    optional
}) => {
    console.log('用户进入插件', code, type, payload);

    if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(code)) {

        if (type == 'files') {
            Clients.sendFile(code, payload, Clients.sentCallback);
        } else if (type == 'img') {
            Clients.sendImg(code, payload, Clients.sentCallback);
        } else {
            Clients.sendText(code, payload, Clients.sentCallback);
        }

    } else {
        window.app.ui.runTime.serverState = false;
        Server.check(() => {
            console.log('server check ok');
            setTimeout(function () {
                Utils.detectDevice();
                if (runTime.settings.otherIpSeg >= 0)
                    Utils.detectDevice(runTime.settings.otherIpSeg);
                window.app.ui.runTime.serverState = true;
                window.app.localIp = runTime.localIp;
            }, 0);

        });
    }
    //滚动到列表底部
    setTimeout(() => {
        window.document.querySelector('#history .ivu-scroll-content').scrollIntoView(0);
    }, 0);


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
        openShareUrl: () => {
            utools.shellOpenExternal('http://' + runTime.localIp + ':' + Server.port + '/share');
        },
        openUrl: (url) => {
            utools.shellOpenExternal(url);
        },
        checkServer: function (cb) {
            Server.check(cb);
        },
        //detectDevice: () => { Utils.detectDevice(); },
        clientRunTime: runTime.client,
        serverRunTime: Server.runTime,
        settings: runTime.settings,
        history: runTime.history,
        updSettings() {
            runTime.updSettings();
        },
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
        detect: function (ipSeg) {
            console.log('sssssssddd');
            setTimeout(function () {
                Utils.detectDevice(ipSeg);
                if (ipSeg) Utils.detectDevice();
            }, 0);
        },
        clearDB: function (doc) {
            if (doc) return utools.db.remove(runTime.localId + ':' + doc);
            utools.db.remove(runTime.localId + ':settings');
            utools.db.remove(runTime.localId + ':history');
        },
        copy: function (content, type) {
            if (type == 'file')
                return utools.copyFile(content);
            if (type == 'img')
                return utools.copyImage(content);

            return utools.copyText(content);
        },
        init() {

        }
    };
    require('./ui/index');
});