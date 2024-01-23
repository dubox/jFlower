const os = require('os');
const fs = require('fs');
const http = require('http');
const md5 = require('./libs/md5');
const vm = require('vm');
const {
    Worker,
    isMainThread,
    parentPort,
    workerData
} = require('worker_threads');
const logger = require('./libs/log');
// const {
//     runTime
// } = require('./server');

module.exports = {
    //runTime:runTime.common,
    toast: function (msg, code) {
        utools.showNotification(msg, code || 'main'); //
    },
    //获取内网ip
    getLocalIp: function () {
        var map = [];
        var nif = os.networkInterfaces();
        this.log('nif:', nif);
        runTime.localIp = '';
        var level = 0;
        for (let i in nif) {
            for (let ii in nif[i]) {
                if (nif[i][ii].family.toLowerCase() != 'ipv4' || nif[i][ii].internal) continue;

                var l = 0;
                if (!runTime.localIp) l = 1;
                if (!/^(utun|v)/i.test(i)) l = 2;
                if (/^192\.168/.test(nif[i][ii].address)) l = 3;
                if (/^(以太网|en|eth|wlan)/i.test(i)) l = 4;
                if (nif[i][ii].address == runTime.settings.localIp) l = 5;

                if (l > level) {
                    level = l; this.log(level);
                    runTime.localIp = nif[i][ii].address;
                    if (l == 5) return runTime.localIp;
                }
            }
        }
        if (runTime.settings.localIp)
            this.toast('未找到指定IP:' + runTime.settings.localIp);
        return runTime.localIp;
    },

    clearFeatures: function () {
        //移除动态加载的功能
        var f = utools.getFeatures();
        for (let i in f) {
            if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(f[i].code)) {
                utools.removeFeature(f[i].code);
            }
        }
        runTime.hosts.ips = {} ;runTime.hosts.ids = {};
    },
    addFeature: function (ip, name, id) {
        utools.setFeature({
            "code": "" + ip,
            "explain": `发送给：主机名(IP)`,

            // "icon": "res/xxx.png",
            // "icon": "data:image/png;base64,xxx...",
            // "platform": ["win32", "darwin", "linux"]
            "cmds": [

                {
                    "type": "over",
                    "label": `发送给：${name}(${ip})`,
                    // 排除的正则 (可选)
                    //"exclude":"/xxx/i",
                    // 长度限制（主输入框中的字符不少于） (可选)
                    "minLength": 1,
                    // 长度限制（不多于） (可选)
                    //"maxLength": 1
                },
                {
                    "type": "files",
                    "label": `发送给：${name}(${ip})`,
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
                    "label": `发送给：${name}(${ip})`,
                },


            ]
        });
        runTime.hosts.ips[ip] = {
            ip: ip,
            hostName: name,
            id: id,
        };
        runTime.hosts.ids[id] = {
            ip: ip,
            hostName: name,
            id: id,
        };
    },
    removeFeature:function(ip){
        utools.removeFeature(ip);
        let id = runTime.hosts.ips[ip].id;
        delete runTime.hosts.ips[ip] ,runTime.hosts.ids[id];
    },
    

    detectDevice: function (_ipSeg, onFind, onFinish) {console.log('detectDevice');
        var _this = this;
        if (!_ipSeg)
            this.clearFeatures();
        var localId = utools.getLocalId();
        var localIp = _this.getLocalIp();
        var ipSeg = '';
        if (/^\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(_ipSeg)) {
            ipSeg = _ipSeg;
        } else {
            ipSeg = localIp.split('.');
            ipSeg = ipSeg[0] + '.' + ipSeg[1] + '.' + ipSeg[2];
        }
        _this.log(ipSeg);
        let isFind = false;
        let fetchCount = 0;
        let fetchFinish = (ip) => {
            if (++fetchCount >= 255) {
                onFinish && onFinish(isFind);
                // _this.toast(ipSeg + '.0~255 扫描完毕！');
            }
            // console.log(fetchCount,ip);
        };

        for (let i = 0; i < 256; i++) {
            var ip = ipSeg + '.' + i;
            (function (ip) {
                //console.log(ip, '-', new Date().getTime());
                if (ip == localIp) return;

                const req = http.get(`http://${ip}:${runTime.settings.targetPort}/detect`, {
                    headers: {
                        'cmd': 'detect',
                        'ip': localIp,
                        'id': localId,
                        'name': encodeURIComponent(runTime.settings.name),
                        'findingCode': runTime.settings.findingCode.code
                    },
                    timeout: 2000,
                }, (res) => {
                    console.log(ip);
                    console.log('res.headers:', res.headers);
                    _this.log('detectDevice:' + ip);
                    _this.log('res.headers:', res.headers);

                    if (res.headers.id) {
                        _this.addFeature(ip, decodeURIComponent(res.headers.name), res.headers.id);

                        if (onFind && onFind(ip, res.headers))
                            isFind = true;
                    }
                    
                    res.resume();
                    fetchFinish(i);
                }).on('timeout', () => {
                    // 必须监听 timeout 事件 并中止请求 否则请求参数中的 timeout 没有效果
                    req.destroy();
                    // fetchFinish();
                }).on('error', (err) => {

                    utools.removeFeature(ip);

                    fetchFinish(i);
                });
            })(ip);
        }
        if (typeof _ipSeg == 'undefined' && runTime.settings.otherIpSeg != '')
            this.detectDevice(runTime.settings.otherIpSeg);
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
    },

    log(...logs) {
        console.log(runTime.settings.log, ...logs);
        if (!runTime.settings.log) return;
        logger.log(`[${new Date().toLocaleString()}]`, ...logs);
    },


    log1(str, obj) {
        let path = utools.getPath('documents') + '/jflower.log';
        fs.open(path, 'a', (err, fd) => {
            if (err) {
                console.log(err);
                return false;
            }
            if (typeof obj == 'undefined') obj = '';
            str = `[${new Date().toLocaleString()}]${str.toString()}${obj.toString()}\n`;
            fs.write(fd, str, (err) => {
                console.log(err);
            });
        });
    },

    checkFileExists(path, name) {
        if (fs.existsSync(path + name)) {
            //如果文件存在则重命名文件
            return this.checkFileExists(path, '1_' + name);
        }
        return name;
    }

}