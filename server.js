const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const Utils = require('./utils');
const mine = require('./mine').types;
const mp4 = require('./libs/mp4');

//var runTime = require('./runtime');

var server = {

    instance: null,
    port: 8891,
    runTime: runTime.server,
    getClientIp: function (req) {
        return req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;
    },
    check: function (cb) {
        var _this = this;
        http.get('http://127.0.0.1:' + this.port + '/check', (res) => {
            res.resume();
            //cb();console.log('ok');
            http.get('http://127.0.0.1:' + this.port + '/check', (res) => {
                res.resume();
                cb();
                console.log('ok');

            }).on('error', (err) => {

                console.log('err');
                _this.create(cb);
            });
        }).on('error', (err) => {

            console.log('err:', err);
            _this.create(cb);
        });
    },

    create: function (cb) {

        var _this = this;
        this.instance = http.createServer((req, res) => {

            //限制客户端请求host为127.0.0.1或本机ip，预防dns rebind攻击
            //if (req.headers.host !== '127.0.0.1:' + _this.port && req.headers.host !== runTime.localIp + ':' + _this.port) {
            if (/[^0-9\.:]/.test(req.headers.host)) { //只允许ip访问
                res.writeHead(403, {
                    'Content-Type': 'text/plain' + ';charset=utf-8'
                });
                res.end();
                return;
            }

            if (req.url == "/favicon.ico") {
                res.end();
                return;
            }
            //req.setEncoding('utf8');
            //console.log('req:', req);
            res.on('end', () => {
                console.log('res end');
            });
            //var url = req.url.split('?');
            var cmd = `on_${req.headers.cmd}`;
            //req.ip = _this.getClientIp(req).replace('::ffff:', '');
            if (this[cmd])
                this[cmd](req, res);
            else if (req.url.indexOf('/share') === 0)
                this['on_share'](req, res);
            else {
                res.writeHead(200, {
                    'Content-Type': 'text/plain' + ';charset=utf-8'
                });
                res.write('jFlower (局发) is running ...\n');
                res.end();
            }


        }).listen(8891, cb); //ipv6 ,'::'
        this.instance.on('clientError', (err, socket) => {
            socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
            console.log(err);
        });
        //this.instance.setTimeout(2000);
        //this.instance.keepAliveTimeout(1000);


    },
    on_share: function (req, res) {
        //限制目录请求范围
        if (!runTime.settings.sharing) {
            res.writeHead(404, {
                'Content-Type': 'text/plain' + ';charset=utf-8'
            });
            res.end();
            return;
        }
        var root = runTime.settings.sharePath || utools.getPath('downloads');
        console.log(root);
        var pathname = decodeURI(url.parse(req.url.replace('/share', '/')).pathname);
        var realPath = path.join(root, pathname);
        console.log(realPath);

        //限制目录请求范围
        if (realPath.indexOf(root) !== 0) {
            res.writeHead(404, {
                'Content-Type': 'text/plain' + ';charset=utf-8'
            });
            res.end();
            return;
        }
        fs.exists(realPath, function (exists) {
            if (!exists) {
                res.writeHead(404, {
                    'Content-Type': 'text/plain' + ';charset=utf-8'
                });

                res.write("This request URL " + pathname + " was not found on this server.[jFlower]");
                res.end();
            } else {

                //判断文件 或 目录
                fs.stat(realPath, function (err, stats) {

                    if (stats.isFile()) { //文件


                        let ext = path.extname(realPath);
                        ext = ext ? ext.slice(1) : 'unknown';
                        var contentType = mine[ext] || "application/octet-stream";
                        console.log(contentType);
                        if (/(audio|video)/.test(contentType)) {
                            //断点续传，获取分段的位置
                            var range = req.headers.range;
                            if (range) {
                                //替换、切分，请求范围格式为：Content-Range: bytes 0-2000/4932
                                var positions = range.replace(/bytes=/, "").split("-");
                                //获取客户端请求文件的开始位置
                                var start = parseInt(positions[0]);
                                //获得文件大小
                                var total = stats.size;
                                //获取客户端请求文件的结束位置
                                var end = positions[1] ? parseInt(positions[1], 10) : total - 1;
                                //获取需要读取的文件大小
                                var chunksize = (end - start) + 1;
                                res.writeHead(206, {
                                    "Content-Range": "bytes " + start + "-" + end + "/" + total,
                                    "Accept-Ranges": "bytes",
                                    "Content-Length": chunksize,
                                    "Content-Type": contentType
                                });
                            } else
                                res.writeHead(200, {
                                    "Accept-Ranges": "bytes",
                                    "Content-Length": stats.size,
                                    "Content-Type": contentType
                                });

                        } else {
                            res.writeHead(200, {
                                'Content-Type': contentType
                            });
                        }
                        var rs = fs.createReadStream(realPath, {
                            start: start,
                            end: end
                        });

                        rs.on('ready', function () {
                            rs.pipe(res);
                        });
                        rs.on('end', function () {
                            res.end();
                        });
                        rs.on('error', function (err) {
                            res.writeHead(500, {
                                'Content-Type': 'text/plain' + ';charset=utf-8'
                            });
                            res.end(err);
                        });




                    } else if (stats.isDirectory()) {

                        fs.readdir(realPath, function (err, files) {
                            if (err) {
                                res.writeHead(500, {
                                    'Content-Type': 'text/plain' + ';charset=utf-8'
                                });
                                res.end(err);
                            } else {
                                var contentType = mine['html'] || "text/plain";
                                res.writeHead(200, {
                                    'Content-Type': contentType + ';charset=utf-8'
                                });

                                for (var i in files) {
                                    var u = url.format(url.parse(path.join('/share', pathname, files[i])));
                                    res.write('<a href="' + u + '">' + files[i] + '</a><br>');
                                }
                                res.end();
                            }
                        });
                    }

                });


            }
        });
    },
    on_detect: function (req, res) {
        res.setHeader('id', runTime.localId);
        res.setHeader('name', runTime.settings.name);
        res.end();
        if (req.headers.ip == runTime.localIp) return;

        console.log('req.headers:', req.headers);
        Utils.addFeature(req.headers.ip, req.headers.name);
        Utils.toast(`发现${req.headers.name}(${req.headers.ip})`);

    },
    on_close: function (req, res) {
        res.end();
        _this.instance.close();
    },
    on_text: function (req, res) {
        var _this = this;
        req.setEncoding('utf8');
        let rawData = '';
        req.on('data', (chunk) => {
            rawData += chunk;
        });
        req.on('end', () => {
            if (/^https{0,1}:\/\/\S+$/.test(rawData)) {
                utools.shellOpenExternal(rawData);
            } else {
                utools.copyText(rawData);
                Utils.toast(`"${rawData}"已复制到剪贴板`);
            }
            res.end();
            //let ip = _this.getClientIp(req);
            //console.log('ip', req.ip)
            runTime.addHistory({
                ip: req.ip,
                id: '',
                type: 1, //1 from,2 to
                content: rawData,
                contentType: 'text', //text file
                time: new Date().getTime()
            });
        });

    },
    on_fileAsk: function (req, res) {

        req.resume();


    },
    on_file: function (req, res) {
        var _this = this;
        var runData = {};
        runData.name = decodeURI(req.headers.file_name);
        var target_file = runData.path = utools.getPath('downloads') + path.sep + runData.name;
        var size = runData.total = parseInt(req.headers['content-length']);

        if (fs.existsSync(target_file) && fs.statSync(target_file).isDirectory()) {
            Utils.toast(`[err]"${runData.name}"是一个目录`);
            res.end();
        } else {
            var ws = fs.createWriteStream(target_file, {
                flags: 'w'
            });
            runData.transferred = 0;
            runData.elapsed = 0;
            runData.startTime = (new Date()).getTime();
            req.on('data', (chunk) => {
                runData.transferred += chunk.length;
                runData.elapsed = new Date().getTime() - runData.startTime;
                //
                //ws.write(chunk);
            });
            req.on('end', () => {
                console.log('end:', (new Date()).getTime());
                //ws.end();
                console.log('write:', runData.transferred);
            });
            ws.on('finish', () => {
                console.log('finish:', (new Date()).getTime());
                runTime.updHistory();
                //utools.outPlugin();
                utools.shellShowItemInFolder(target_file);
                res.end();
            });
            req.pipe(ws);
            utools.showMainWindow();
            Utils.toast(`收到文件[${runData.name}]`);

            runTime.addHistory({
                ip: 'req.ip', //req.ip,
                id: '',
                type: 1, //1 from,2 to
                content: runData,
                contentType: 'file', //text file
                time: new Date().getTime()
            });
        }


    },
    on_img: function (req, res) {
        console.log('img');
        req.setEncoding('utf8');
        let rawData = '';
        req.on('data', (chunk) => {
            rawData += chunk;
            console.log(chunk);
        });
        req.on('end', () => {
            console.log('end');
            utools.copyImage(rawData);
            res.end();
            Utils.toast(`收到[图片]已复制到剪贴板`);
            runTime.addHistory({
                ip: req.ip,
                id: '',
                type: 1, //1 from,2 to
                content: rawData,
                contentType: 'img', //text file
                time: new Date().getTime()
            });
        });

    }
};

module.exports = server;