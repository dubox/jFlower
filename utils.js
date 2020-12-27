const os = require('os');
const http = require('http');
const md5 = require('./libs/md5');
const vm = require('vm');
const {
    Worker,
    isMainThread,
    parentPort,
    workerData
} = require('worker_threads');

module.exports = {
    //runTime:runTime.common,
    toast: function (msg, code) {
        utools.showNotification(msg, 'main'); //
    },
    //获取内网ip
    getLocalIp: function () {
        var map = [];
        var nif = os.networkInterfaces();
        console.log('nif:', nif);
        for (let i in nif) {
            if (nif[i].length > 1)
                for (let ii in nif[i]) {
                    if (nif[i][ii].address.indexOf('192.168') === 0)
                        return runTime.localIp = nif[i][ii].address;
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
    addFeature: function (ip, name, id) {
        utools.setFeature({
            "code": "" + ip,
            "explain": `发送给：${name}(${ip})`,
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
    detectDevice5: function (_ipSeg) {
        var _this = this;
        //this.clearFeatures();
        var localId = utools.getLocalId();
        var localIp = _this.getLocalIp();
        var ipSeg = localIp.split('.');
        ipSeg = ipSeg[0] + '.' + ipSeg[1];

        console.log(ipSeg);

        var ips = [];

        for (let j = 0; j < 256; j++) {
            for (let i = 0; i < 256; i++) {
                var ip = ipSeg + '.' + j + '.' + i;
                (function (ip) {
                    //console.log(ip, '-', new Date().getTime());
                    const req = http.get(`http://${ip}:8891/detect`, {
                        headers: {
                            'ip': localIp,
                            'id': localId,
                            'name': runTime.settings.name
                        },
                        timeout: 100,
                    }, (res) => {
                        console.log(ip);
                        console.log('res:', res);
                        if (ip == localIp) return;
                        ips.push(ip);
                        _this.addFeature(ip, res.headers.name, res.headers.id);
                        res.resume();
                    }).on('timeout', () => {
                        req.destroy();
                    }).on('error', (err) => {
                        utools.removeFeature(ip);
                        if (i == 255)
                            console.log(ip, '-', new Date().getTime());
                    });
                })(ip);
            }
        }
    },
    detectDevice: function (_ipSeg) {
        var _this = this;
        //this.clearFeatures();
        var localId = utools.getLocalId();
        var localIp = _this.getLocalIp();
        var ipSeg = localIp.split('.');
        if (typeof _ipSeg == 'undefined') {
            ipSeg = ipSeg[0] + '.' + ipSeg[1] + '.' + ipSeg[2];
        } else {
            ipSeg = ipSeg[0] + '.' + ipSeg[1] + '.' + _ipSeg;
        }
        console.log(ipSeg);

        var ips = [];

        for (let i = 0; i < 256; i++) {
            var ip = ipSeg + '.' + i;
            (function (ip) {
                //console.log(ip, '-', new Date().getTime());
                const req = http.get(`http://${ip}:8891/detect`, {
                    headers: {
                        'ip': localIp,
                        'id': localId,
                        'name': runTime.settings.name
                    },
                    timeout: 100,
                }, (res) => {
                    console.log(ip);
                    console.log('res:', res);
                    if (ip == localIp) return;
                    ips.push(ip);
                    _this.addFeature(ip, res.headers.name, res.headers.id);
                    res.resume();
                    if (i == 255 && typeof _ipSeg != 'undefined')
                        _this.toast('扫描完毕！');
                }).on('timeout', () => {
                    // 必须监听 timeout 事件 并中止请求 否则请求参数中的 timeout 没有效果
                    req.destroy();
                }).on('error', (err) => {
                    //console.log(ip, '-', new Date().getTime());
                    utools.removeFeature(ip);
                    if (i == 255 && typeof _ipSeg != 'undefined')
                        _this.toast('扫描完毕！');
                });
            })(ip);
        }
    },
    detectDevice4: function () {
        if (isMainThread) {
            const worker = new Worker('./detect.js');
            worker.on('message', function (data) {
                console.log('message:', data)
            });
        }
    },
    detectDevice3: function () {

        var _this = this;
        this.clearFeatures();
        var localIp = _this.getLocalIp();
        var ipSeg = localIp.split('.');
        ipSeg.pop();
        ipSeg.pop();
        var ips = [];
        const context = {
            ips: [],
            ipSeg: ipSeg,
            localIp: localIp,
            http: http,
            utools: utools
        };
        vm.createContext(context); //return;
        code = `for (let j = 0; j < 256; j++) {
            for (let i = 0; i < 256; i++) {
                var ip = ipSeg.join('.') + '.' + j + '.' + i;
                (function (ip) {
                    http.get('http://'+ip+':8891/detect', {
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
        }`;
        try {
            vm.runInContext(code, context);
            console.log('vm:', context);
        } catch (e) {
            console.log(e);
        }
        return ips;
    },

    getPlatform: function () {
        if (utools.isMacOs()) {
            console.log('mac');
            return runTime.platform = 'mac';
        }
        if (utools.isWindows()) {
            console.log('win');
            return runTime.platform = 'win';
        }
        if (utools.isLinux()) {
            console.log('linux');
            return runTime.platform = 'linux';
        }
    },
    md5(str) {
        return md5(str);
    }

}