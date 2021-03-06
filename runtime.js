//var Utils = require('./utils');
const os = require('os');
const fs = require('fs');
const userData = require('./userdata');

//global.runTime = 
module.exports = {
    init: function () {
        this.localId = utools.getLocalId();
        this.settings; //加载设置
        console.log(userData)
        this.loadHistory(); //加载历史记录
        // if(!this.settings.name)this.setting.name = os.hostname;
        // if(!this.settings.otherIpSeg){
        //     console.log('www');
        //     this.setting.otherIpSeg = '1';}

    },
    client: {
        targetIp: '',
        targetId: '',
        type: '',
        content: '',
        fileSend: {
            name: '',
            size: 0,
            sent: 0,
            to: '',
            startTime: 0
        }
    },
    server: {
        fromIp: '',
        fromId: '',
        type: '',
        content: '',
        fileReceive: {
            name: '',
            size: 0,
            receive: 0,
            from: '',
            position: '',
            startTime: 0
        }
    },
    waitingFiles: { //合并到history？
        //等待请求的待发送文件
        'token': {
            path: '',
            time: 0,
            ip: '',
        },
        check(token, ip) {
            if (token.length != 32) return false;
            var file = this[token];
            if (!file) return false;
            if (file.ip != ip) return false;
            if ((new Date().getTime()) - file.time > 60000) return false;
            let path = file.path;
            delete this[token];
            return path;
        }
    },

    localIp: '', //Utils.getLocalIp(),
    localId: '',
    platform: '', //Utils.getPlatform(),

    _settings: {
        log: false,
        sharePath: '',
        sharing: false,
        name: os.hostname,
        otherIpSeg: '',
        canBeFound: true,
        findingCode: {
            isOnly: false, //仅拥有一样暗号的主机可以找到我
            code: '' //暗号
        },
        localIp: '', //用户指定的本地ip
        localPort: 8891, //本地端口，即server监听端口
        targetPort: 8891, //目标端口，即需要扫描的其他主机的端口
        // hosts: {
        //     aaswws133s2s:{
        //         id:'aaswws133s2s',
        //         ip:'192.168.1.111',
        //         name:'abc',

        //         lastActive:1287554455
        //     }
        // },

    },
    //取值
    get settings() {
        this.loadSettings();
        return this._settings;
    },
    //赋值
    get setting() {
        var _this = this;
        setTimeout(() => {
            _this.updSettings();
        }, 0);
        return this._settings;
    },


    loadSettings: function () {
        var res = utools.db.get(this.localId + ':settings');
        //console.log(res);
        if (res) {
            for (let i in res.data)
                this._settings[i] = res.data[i];
        }
    },

    updSettings: function () {
        let res = utools.db.get(this.localId + ':settings'); // console.log(this.localId, res); console.log(this);
        rev = res ? res._rev : '';
        res2 = utools.db.put({
            _id: this.localId + ':settings',
            _rev: rev,
            data: JSON.parse(JSON.stringify(this._settings))
        });
        console.log(res2);

    },

    set: function (key, value) {
        var key_arr = key.split('.');
        var that = this;
        for (let i in key_arr) {
            that = that[i];
        }
    },


    clear: function (key) {
        var keys = key.split('.');
        var target = null;
        for (let i in keys) {

        }
    },
    history: [{
        ip: '',
        id: '',
        type: 1, //1 from,2 to
        content: '',
        contentType: 'img', //text file
        time: ''
    }],
    loadHistory: function () {
        var res = userData.get('history', []);
        console.log('load history:', res);
        this.history = res;
    },
    addHistory: function (data) {
        console.log(data);
        this.history.push(data);

        let res = userData.put('history', this.history);
        console.log('put history:', res);
    },
    updHistory: function () {
        let res = userData.put('history', this.history);
        console.log('upd history:', res);
    },
    delHistory: function (index) {
        this.history.splice(index, 1);
        this.updHistory();
    }
}

//runTime.updSettings();
//runTime.loadSettings();