const http = require('http');
const Utils = require('./utils');
const parent = require('worker_threads').parentPort;


Utils.clearFeatures();
var localIp = Utils.getLocalIp();
var ipSeg = localIp.split('.');
ipSeg.pop();
ipSeg.pop();
var ips = [];

for (let j = 0; j < 256; j++) {
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
}

parent.postMessage(ips);