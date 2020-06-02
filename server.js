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

    check: function (cb) {
        var _this = this;
        http.get('http://127.0.0.1:' + this.port + '/check', (res) => {
            res.resume();
            //cb();console.log('ok');
            http.get('http://127.0.0.1:' + this.port + '/check', (res) => {
                res.resume();
                cb(); console.log('ok');

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
            if (req.headers.host !== '127.0.0.1:' + _this.port && req.headers.host !== runTime.localIp + ':' + _this.port) {
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
            req.setEncoding('utf8');
            console.log(req);
            res.on('end', () => { console.log('res end'); });
            //var url = req.url.split('?');
            var cmd = `on_${req.headers.cmd}`;

            if (this[cmd])
                this[cmd](req, res);
            else if (req.url.indexOf('/share') === 0)
                this['on_share'](req, res);
            else { res.write('hello\n'); res.end(); }


        }).listen(8891, cb); //ipv6 ,'::'
        this.instance.on('clientError', (err, socket) => {
            socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
            console.log(err);
        });
        //this.instance.setTimeout(2000);
        //this.instance.keepAliveTimeout(1000);


    },
    on_share: function (req, res) {

        var root = runTime.settings.sharePath || utools.getPath('downloads'); console.log(root);
        var pathname = decodeURI(url.parse(req.url.replace('/share', '/')).pathname);
        var realPath = path.join(root, pathname); console.log(realPath);
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

                    if (stats.isFile()) {	//文件
                        // fs.readFile(realPath, "binary", function (err, file) {
                        //     if (err) {
                        //         res.writeHead(500, {
                        //             'Content-Type': 'text/plain' + ';charset=utf-8'
                        //         });
                        //         res.end(err);
                        //     } else {
                        //         let ext = path.extname(realPath);
                        //         ext = ext ? ext.slice(1) : 'unknown';
                        //         var contentType = mine[ext] || "application/octet-stream";
                        //         if (/(audio|video)/.test(contentType)) {
                        //             res.setHeader('Accept-Ranges', 'bytes');
                        //             res.setHeader('Content-Length', fs.statSync(realPath).size);
                        //         }

                        //         res.writeHead(200, {
                        //             'Content-Type': contentType
                        //         });
                        //         res.write(file, "binary");
                        //         res.end();
                        //     }
                        // });
                        console.log(mp4(realPath));

                        let ext = path.extname(realPath);
                        ext = ext ? ext.slice(1) : 'unknown';
                        var contentType = mine[ext] || "application/octet-stream"; console.log(contentType);
                        if (/(audio|video)/.test(contentType)) {
                            //断点续传，获取分段的位置
                            var range = req.headers.range;
                            if (!range) {
                                //206状态码表示客户端通过发送范围请求头Range抓取到了资源的部分数据
                                //416状态码表示所请求的范围无法满足
                                // res.writeHead(416);
                                // res.end();
                                // return;
                                range = 'bytes=0-1';
                            }
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

                        } else {
                            res.writeHead(200, {
                                'Content-Type': contentType
                            });
                        }
                        var rs = fs.createReadStream(realPath, { start: start, end: end });

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

        res.setHeader('id', utools.getLocalId());
        res.end();
        Utils.toast('欢迎' + req.headers.ip);
        if (req.headers.ip == runTime.localIp) return;
        Utils.addFeature(req.headers.ip, req.headers.id);

    },
    on_close: function (req, res) {
        res.end();
        _this.instance.close();
    },
    on_text: function (req, res) {

        req.setEncoding('utf8');
        let rawData = '';
        req.on('data', (chunk) => { rawData += chunk; });
        req.on('end', () => {
            if (/^https{0,1}:\/\/.+/.test(rawData)) {
                utools.shellOpenExternal(rawData);
            } else {
                utools.copyText(rawData);
                Utils.toast(`"${rawData}"已复制到剪贴板`);
            }
            res.end();
        });
        // let userChoose = utools.showMessageBox({
        //     type: 'question',
        //     buttons: ['忽略', '复制到剪贴板'],
        //     title: '来自***的消息',
        //     message: text,
        //     defaultId: 1
        //   });
        //   if(userChoose){
        //     utools.copyText(text);
        //     utools.hideMainWindow();
        //   }
    },
    on_file: function (req, res) {
        var _this = this;
        _this.runTime.fileReceive.name = decodeURI(req.headers.file_name);
        _this.runTime.fileReceive.from = req.headers.ip;
        var target_file = _this.runTime.fileReceive.position = utools.getPath('downloads') + path.sep + _this.runTime.fileReceive.name;
        var size = _this.runTime.fileReceive.size = parseInt(req.headers['content-length']);

        if (fs.existsSync(target_file) && fs.statSync(target_file).isDirectory()) {
            Utils.toast(`[err]"${_this.runTime.fileReceive.name}"是一个目录`);
            res.end();
        } else {
            var ws = fs.createWriteStream(target_file);
            _this.runTime.fileReceive.receive = 0;
            req.on('data', (chunk) => {
                _this.runTime.fileReceive.receive += chunk.length;
                //console.log('write:', (read_length+=chunk.length)/size * 100,'%');
                //ws.write(chunk);
            });
            req.on('end', () => {
                console.log('end:', (new Date()).getTime());
                ws.end();
                res.end();
            });
            ws.on('finish', () => {
                console.log('finish:', (new Date()).getTime());
                utools.outPlugin();
                utools.shellShowItemInFolder(target_file);

            });
            req.pipe(ws);
            _this.runTime.fileReceive.startTime = (new Date()).getTime();
            utools.showMainWindow();
            Utils.toast(`收到文件[${_this.runTime.fileReceive.name}]`);
        }


    },
    on_img: function (req, res) {
        console.log('img');
        req.setEncoding('utf8');
        let rawData = '';
        req.on('data', (chunk) => { rawData += chunk; console.log(chunk); });
        req.on('end', () => {
            console.log('end');
            utools.copyImage(rawData);
            res.end();
            Utils.toast(`收到[图片]已复制到剪贴板`);
        });

    }
};

module.exports = server;
