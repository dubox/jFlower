const os = require('os');
const http = require('http');
const md5 = require('./libs/md5');

module.exports = {
    //runTime:runTime.common,
    toast: function (msg, code) {
        utools.showNotification(msg, 'main'); //
    },
    //获取内网ip
    getLocalIp: function () {
        var map = [];
        var nif = os.networkInterfaces();
        console.log('nif:',nif);
        for (let i in nif) {
            if (nif[i].length > 1)
                for (let ii in nif[i]) {
                    if (nif[i][ii].address.indexOf('192.168') === 0)
                        return nif[i][ii].address;
                }
        }
        return '';
    },

    clearFeatures: function () {
        //移除动态加载的功能
        var f = utools.getFeatures();
        for (let i in f) {
            if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(f[i].code)) {
                utools.removeFeature(f[i].code);
            }
        }
    },
    addFeature: function (ip, id) {
        utools.setFeature({
            "code": "" + ip,
            "explain": "发送到：" + ip,
            // "icon": "res/xxx.png",
            // "icon": "data:image/png;base64,xxx...",
            // "platform": ["win32", "darwin", "linux"]
            "cmds": [

                {
                    "type": "over",
                    "label": "发送文字",
                    // 排除的正则 (可选)
                    //"exclude":"/xxx/i",
                    // 长度限制（主输入框中的字符不少于） (可选)
                    "minLength": 1,
                    // 长度限制（不多于） (可选)
                    //"maxLength": 1
                },
                {
                    "type": "files",
                    "label": "发送文件",
                    // 支持file或directory (可选)
                    "fileType": "file",
                    // 文件名称正则匹配  (可选)
                    //"match": "/xxx/",
                    // 数量限制（不少于） (可选)
                    "minNum": 1,
                    // 数量限制（不多于） (可选)
                    "maxNum": 1
                },
                {
                    // 类型，可能的值（img, files, regex, over）
                    "type": "img",
                    // 文字说明，在搜索列表中出现（必须）
                    "label": "发送图片"
                },


            ]
        })
    },
    detectDevice: function () {

        var _this = this;
        this.clearFeatures();
        var localIp = _this.getLocalIp();
        var ipSeg = localIp.split('.');
        ipSeg.pop();
        var ips = [];
        for (let i = 1; i < 256; i++) {
            var ip = ipSeg.join('.') + '.' + i;
            (function (ip) {
                http.get(`http://${ip}:8891/detect`, {
                    headers: {
                        'ip': localIp,
                        'id': utools.getLocalId()
                    }
                }, (res) => {
                    console.log(ip);
                    console.log('res:', res);
                    if (ip == localIp) return;
                    ips.push(ip);
                    _this.addFeature(ip, res.headers.id);
                    res.resume();
                }).on('error', (err) => {});
            })(ip);

        }
        return ips;
    },
    getPlatform: function () {
        if (utools.isMacOs()) {
            console.log('mac');
            return 'mac';
        }
        if (utools.isWindows()) {
            console.log('win');
            return 'win';
        }
        if (utools.isLinux()) {
            console.log('linux');
            return 'linux';
        }
    },
    md5(str) {
        return md5(str);
    }

}