const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const Utils = require('./utils');
const mine = require('./mine').types;
const mp4 = require('./libs/mp4');
const { Transform ,pipeline} = require('stream');
const Clients = require('./clients');
const utils = require('./utils');

//var runTime = require('./runtime');

class MyIncome extends http.IncomingMessage{

}

var server = {

    instance: null,
    port: null,
    runTime: runTime.server,
    getClientIp: function (req) {
        return req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;
    },
    init: function () {
        this.port = runTime.settings.localPort;
    },
    check: function (cb) {
        this.init();
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
        this.instance = http.createServer({
            IncomingMessage: MyIncome//http.IncomingMessage
        },(req, res) => {
            console.log(req.headers);
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

            //检查暗号
            if (runTime.settings.findingCode.isOnly && req.headers.findingcode != runTime.settings.findingCode.code) {
                res.writeHead(404, {
                    'Content-Type': 'text/plain' + ';charset=utf-8'
                });
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
            else if (req.url.indexOf('/wap') === 0)
                this['on_wap'](req, res);
            else {
                res.writeHead(200, {
                    'Content-Type': 'text/plain' + ';charset=utf-8'
                });
                res.write('jFlower (局发) is running ...\n');
                res.end();
            }


        }).listen(this.port, cb); //ipv6 ,'::'
        this.instance.on('clientError', (err, socket) => {
            socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
            console.log(err);
        });
        //this.instance.setTimeout(2000);
        //this.instance.keepAliveTimeout(1000);


    },
    on_share: function (req, res) {
        //检查分享开关
        if (!runTime.settings.sharing) {
            res.writeHead(404, {
                'Content-Type': 'text/plain' + ';charset=utf-8'
            });
            res.end();
            return;
        }
        var root = runTime.settings.sharePath;
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
                //判断文件 或 目录
                fs.stat(realPath, function (err, stats) {

                    if(err){
                        res.writeHead(404, {
                            'Content-Type': 'text/plain' + ';charset=utf-8'
                        });
        
                        res.write("This request URL " + pathname + " was not found on this server.[jFlower]");
                        res.end();
                        return;
                    }

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
                        var rs = fs.createReadStream(realPath, start?{
                            start: start,
                            end: end,
                            //highWaterMark: 2560 * 1024
                        }:{
                           // highWaterMark: 1280 * 1024
                        });
                        // rs.on('data', function (chunk) {
                        //     res.write(chunk);
                        //     });

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
            
    },
    on_getFile:function(req, res){
        let h = runTime.getHistory(req.headers.key);console.log(h);
        let runData = h.content;
        let realPath = runData.path;
        fs.stat(realPath, function (err, stats) {
            if(err){
                res.writeHead(404, {
                    'Content-Type': 'text/plain' + ';charset=utf-8'
                });
                res.end();
                return;
            }
            //替换、切分，请求范围格式为：Content-Range: bytes 0-2000/4932
            var positions = req.headers.range.replace(/bytes=/, "").split("-");
            //获取客户端请求文件的开始位置
            var start = parseInt(positions[0]);
            //获得文件大小
            var total = stats.size;
            //获取客户端请求文件的结束位置
            var end = positions[1] ? parseInt(positions[1], 10) : total - 1;
            //获取需要读取的文件大小
            var chunksize = (end - start) + 1;console.log(total,end,chunksize)
            res.writeHead(206, {
                "Content-Range": "bytes " + start + "-" + end + "/" + total,
                "Accept-Ranges": "bytes",
                "Content-Length": chunksize,
                "Content-Type": "application/octet-stream"
            });

            var rs = fs.createReadStream(realPath, {
                start: start,
                end: end,
                //highWaterMark: 2560 * 1024
            });

            runData.status = 'sending';
            runData.startTime = new Date().getTime();
            transferred = 0;
            elapsed = 0;
            rs.on('data', function (chunk) {//console.log('server.data')
                transferred += chunk.length;
                elapsed = (new Date().getTime()) - runData.startTime;
                if(elapsed - runData.elapsed > 200){
                    Object.assign(runData ,{
                        transferred: transferred,
                        elapsed: elapsed
                      });
                    if(runData.status == 'paused'){console.log(runData.status);
                        res.destroy();
                        rs.destroy();
                      }
                }
                
                });
            rs.on('ready', function () {
                rs.pipe(res);
            });
            rs.on('end', function () {
                Object.assign(runData ,{
                    transferred: transferred,
                    elapsed: elapsed,
                    status:'completed'
                  });
                  res.end();
            });
            rs.on('error', function (err) {
                Object.assign(runData ,{
                    transferred: transferred,
                    elapsed:  elapsed,
                    status: 'paused'
                  });
                res.writeHead(500, {
                    'Content-Type': 'text/plain' + ';charset=utf-8'
                });
                res.end(err);
            });
            res.on('error', function (err) {
                Object.assign(runData ,{
                    transferred: transferred,
                    elapsed:  elapsed,
                    status: 'paused'
                  });
                rs.destroy();
            });
            req.on('error', function (err) {
                Object.assign(runData ,{
                    transferred: transferred,
                    elapsed:  elapsed,
                    status: 'paused'
                  });
                rs.destroy();
            });
            req.on('end', function (err) {
                Object.assign(runData ,{
                    transferred: transferred,
                    elapsed:  elapsed,
                    status: 'paused'
                  });
                rs.destroy();
            });

        });
    },
    on_wap: function(req, res){

        var pathname = 'aaa';
var realPath = './ui/wap.html';
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

                res.writeHead(403, {
                    'Content-Type': 'text/plain' + ';charset=utf-8'
                });
                res.end();
            }

        });


    }
});
    },
    on_detect: function (req, res) {
        if (!runTime.settings.canBeFound) {
            res.end();
            return;
        }
        
        
        if (req.headers.ip == runTime.localIp) {res.end();return;}

        console.log('req.headers:', req.headers);
        
        if (runTime.settings.findingCode.isOnly && req.headers.findingcode != runTime.settings.findingCode.code) { 
            //如果暗号不一样 则不要被动添加对方
                res.end();return;
        }
        res.setHeader('id', runTime.localId);
        res.setHeader('name', encodeURIComponent(runTime.settings.name));
        res.end();

        Utils.addFeature(req.headers.ip, decodeURIComponent(req.headers.name));
        //Utils.toast(`${req.headers.name}(${req.headers.ip})发现了你`);

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
                ip: req.headers.ip,
                hostName:runTime.hosts[req.headers.ip].hostName,
                id: '',
                type: 1, //1 from,2 to
                content: rawData,
                contentType: 'text', //text file
                time: new Date().getTime()
            });
        });

    },
    on_fileAsk: function (req, res) {
        var runData = {};
        runData.path = runTime.settings.downloadPath + path.sep;
        runData.name = utils.checkFileExists(runData.path,decodeURI(req.headers.file_name));
        runData.path += runData.name;
        
        runData.total = parseInt(req.headers['content-length']);
        runData.transferred = 0;
            runData.elapsed = 0;
            runData.startTime = (new Date()).getTime();
            runData.status = 'paused';
            runData.key = req.headers.key;
        
        var key = runTime.addHistory({
            ip: req.headers.ip,
            hostName:runTime.hosts[req.headers.ip].hostName,
            id: '',
            type: 1, 
            content: runData,
            contentType: 'file', //text file
            time: new Date().getTime()
        });
        req.on('end',()=>{
            
            res.end();
        })
        req.resume();

        setTimeout(()=>{
            Clients.acceptFile(key);
        });
       
    },
    RSpool:{},//sendFile 的 rs对象池
    on_file: function (req, res) {
        var _this = this;
        var runData = {};
        runData.name = decodeURI(req.headers.file_name);
        var target_file = runData.path = runTime.settings.downloadPath + path.sep + runData.name;
        var size = runData.total = parseInt(req.headers['content-length']);

        if (fs.existsSync(target_file) && fs.statSync(target_file).isDirectory()) {
            Utils.toast(`[err]"${runData.name}"是一个目录`);
            res.end();
        } else {
            var ws = fs.createWriteStream(target_file, {
                flags: 'w',
                //highWaterMark: 5120*1024
            });
            runData.transferred = 0;
            runData.elapsed = 0;
            runData.startTime = (new Date()).getTime();
            runData.status = 'sending';
            req.onDataListener = (chunk) => {
                runData.transferred += chunk.length;
                runData.elapsed = (new Date().getTime()) - runData.startTime;
                //
                ws.write(chunk);
            };
            
            req.on('end', () => {
                // console.log('finish:', (new Date()).getTime());
                //     runData.status = 'completed';
                //     runTime.updHistory();
                //     //utools.outPlugin();
                //     utools.shellShowItemInFolder(target_file);
                    //res.end();
            });
            req.on('error', () => {
                runData.status = 'error';
                runTime.updHistory();
                ws.end();
            });
            ws.on('error', function (err) {
                console.log('err:', err);
                runData.status = 'error';
                runTime.updHistory();
                req.destroy(err);
              });
            ws.on('finish', () => {
                console.log('finish:', (new Date()).getTime());
                runData.status = 'completed';
                runTime.updHistory();
                //utools.outPlugin();
                utools.shellShowItemInFolder(target_file);
                res.end();
            });
            let transform = new Transform({
                transform(chunk, encoding, callback) {
                    runData.transferred += chunk.length;
                    runData.elapsed = (new Date()).getTime() - runData.startTime;
                    callback(null,chunk);
                }
              });
            
            //   pipeline(
            //     req,
            //     transform,
            //     ws,
            //     (err) => {
            //       if (err) {
            //         console.log('err:', err);
            //         runData.status = 'error';
            //         runTime.updHistory();
            //         req.destroy(err);
            //       } else {
            //         console.log('finish:', (new Date()).getTime());
            //         runData.status = 'completed';
            //         runTime.updHistory();
            //         //utools.outPlugin();
            //         utools.shellShowItemInFolder(target_file);
            //         res.end();
            //       }
            //     }
            //   );
           
            //req.pipe(transform).pipe(ws);//
            req.on('data', req.onDataListener);
            

            utools.showMainWindow();
            Utils.toast(`收到文件[${runData.name}]`);

            let key = runTime.addHistory({
                ip: req.headers.ip, //req.ip,
                hostName:runTime.hosts[req.headers.ip]?runTime.hosts[req.headers.ip].hostName:'',
                id: '',
                type: 1, //1 from,2 to
                content: runData,
                contentType: 'file', //text file
                time: new Date().getTime()
            });
            _this.RSpool[key] = [req,transform];
        }

    },
    pauseFileSend:function(key){
        let h = runTime.getHistory(key);console.log(h);
    let runData = h.content;
    runData.status = 'paused';
    },
    resumeFileSend:function(key){
        utils.toast('续传只能由接收方发起');
    },
    cancelFileSend:function(key){

    },

    // cancelFileSend:function(key){
    //     if(typeof this.RSpool[key][0] == "object"){
    //       this.RSpool[key][0].unpipe();
    //       this.RSpool[key][0].destroy(new Error('User canceled'));
    //     }
    //   },
    //   pauseFileSend:function(key){console.log(key);console.log(this.RSpool[key])
    //     if(typeof this.RSpool[key][0] == "object"){
    //         this.RSpool[key][0].socket.pause();
    //         //this.RSpool[key][1].pause();
    //         this.RSpool[key][0].pause();
    //         //this.RSpool[key][0].unpipe();
    //         //this.RSpool[key].removeListener('data',this.RSpool[key].onDataListener);
    //       let h = runTime.getHistory(key);
    //       if(h)
    //         h.content.status = 'paused';
    //     }
    //   },
    //   resumeFileSend:function(key){
    //     if(typeof this.RSpool[key][0] == "object"){
    //       //this.RSpool[key][0].pipe(this.RSpool[key][1]);
    //       //this.RSpool[key].on('data', this.RSpool[key].onDataListener);
    //       //this.RSpool[key][1].resume();
    //       this.RSpool[key][0].resume();
    //       this.RSpool[key][0].socket.resume();
    //       let h = runTime.getHistory(key);
    //       if(h)
    //         h.content.status = 'sending';
    //     }
    //   },
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
                ip: req.headers.ip,
                hostName:runTime.hosts[req.headers.ip].hostName,
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