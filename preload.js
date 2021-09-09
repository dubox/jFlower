global.runTime = require('./runtime');
var Server = require('./server');
var Utils = require('./utils');
var Clients = require('./clients');
//const { runTime } = require('./server');
//const runtime = require('./runtime');

const fs = require('fs');
//const { runTime } = require('./clients');
//console.log(`本机ip：${Utils.getLocalIp()}`);

window.fs = fs;

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
                try {
                    Utils.detectDevice();
                } catch (e) {
                    Utils.log('e:', e);
                }

                window.app.ui.runTime.serverState = true;
                window.app.ui.runTime.localIp = runTime.localIp;
                window.app.ui.runTime.localPort = Server.port;
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
            setTimeout(function () {
                Utils.detectDevice();
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
        delHistory: function (index) {
            return runTime.delHistory(index);
        },
        updHistory() {
            runTime.updHistory();
        },
        fileSend:{
            cancel(_id){
                Clients.cancelFileSend(_id);
            },
            pause(_id){
                Clients.pauseFileSend(_id);
            },
            resume(_id){
                Clients.resumeFileSend(_id);
            },
        },
        init() {

        }
    };
    require('./ui/index');
    Utils.log("onPluginReady:runTime:", JSON.parse(JSON.stringify(runTime._settings)));
});