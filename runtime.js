var Utils = require('./utils');

global.runTime = {
    init: function () {
        this.localId = utools.getLocalId(); console.log(this.localId);
        this.settings;
    },
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
        setTimeout(() => { _this.updSettings(); }, 0);
        return this._settings;
    },


    loadSettings: function () {
        var res = utools.db.get(this.localId);
        console.log(res);
        if (res) {
            for (let i in res.data)
                this._settings[i] = res.data[i];
        }
    },

    updSettings: function () {
        let res = utools.db.get(this.localId); console.log(this.localId, res); console.log(this);
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