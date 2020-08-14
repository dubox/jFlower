var Utils = require('./utils');

global.runTime = {
    init: function () {
        this.localId = utools.getLocalId();
        this.settings; //加载设置
        this.loadHistory(); //加载历史记录

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
        'tokenxxxxxxxxx': {
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

    localIp: Utils.getLocalIp(),
    localId: '',
    platform: Utils.getPlatform(),

    _settings: {
        sharePath: '',
        sharing: false,

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
        console.log(res);
        if (res) {
            for (let i in res.data)
                this._settings[i] = res.data[i];
        }
    },

    updSettings: function () {
        let res = utools.db.get(this.localId + ':settings'); // console.log(this.localId, res); console.log(this);
        rev = res ? res._rev : '';
        res = utools.db.put({
            _id: this.localId + ':settings',
            _rev: rev,
            data: this._settings
        });
        console.log(res);

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
        var res = utools.db.get(this.localId + ':history');
        console.log(res);
        if (res) {
            this.history = res.data;
        } else {
            this.history = [];
        }
    },
    addHistory: function (data) {
        console.log(data);
        this.history.push(data);

        let res = utools.db.get(this.localId + ':history'); // console.log(this.localId, res); console.log(this);
        rev = res ? res._rev : '';
        res = utools.db.put({
            _id: this.localId + ':history',
            _rev: rev,
            data: this.history
        });
        console.log(res);
    },
    updHistory: function () {
        let res = utools.db.get(this.localId + ':history'); // console.log(this.localId, res); console.log(this);
        rev = res ? res._rev : '';
        res = utools.db.put({
            _id: this.localId + ':history',
            _rev: rev,
            data: this.history
        });
        console.log(res);
    }
}

//runTime.updSettings();
//runTime.loadSettings();