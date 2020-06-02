var Utils = require('./utils');

global.runTime = {
    client: {
        fileSend: {
            name: '',
            size: 0,
            sent: 0,
            to: '',
            startTime: 0
        }
    },
    server: {
        fileReceive: {
            name: '',
            size: 0,
            receive: 0,
            from: '',
            position: '',
            startTime: 0
        }
    },
    _settings: {
        sharePath: '',

    },
    //取值
    get settings() {
        this.loadSettings();
        return this._settings;
    },
    //赋值
    get setting() {
        setTimeout(this.updSettings, 0);
        return this._settings;
    },

    localIp: Utils.getLocalIp(),
    localId: utools.getLocalId(),
    platform: Utils.getPlatform(),


    loadSettings: function () {
        var res = utools.db.get(this.localId);
        console.log(res);
        if (res) {
            this._settings = res.data;
        }
    },

    updSettings: function () {
        let res = utools.db.get(this.localId);
        rev = res ? res._rev : '';
        res = utools.db.put({
            _id: this.localId,
            _rev: rev,
            data: this._settings
        }); console.log(res);

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
    history: {
        ip: '',
        id: '',
        type: 1,//1 from,2 to
        content: '',
        contentTpye: 'img',//text file
        time: ''
    }
}

//runTime.updSettings();
//runTime.loadSettings();