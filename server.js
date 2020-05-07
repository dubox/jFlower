const http = require('http');
const fs = require('fs');
const path = require('path');
var Utils = require('./utils');

var server = {

    instance :null,
    port  : 8891,

    check : function(cb){
        var _this = this;
        http.get('http://127.0.0.1:'+this.port+'/check', (res) => {
                res.resume();
                //cb();console.log('ok');
                http.get('http://127.0.0.1:'+this.port+'/check', (res) => {
                    res.resume();
                    cb();console.log('ok');
                    
                }).on('error', (err) => { 
    
                    console.log('err');
                    _this.create(cb);
                });
            }).on('error', (err) => { 

                console.log('err');
                _this.create(cb);
            });
    },

    create : function(cb){
               
                var _this = this;
                    this.instance = http.createServer((req, res) => {
                        if(req.url=="/favicon.ico"){
                            res.end();
                            return;
                        }
                        console.log(req);
                        res.on('end', () => {console.log('res end'); });
                        //var url = req.url.split('?');
                        var cmd = `on${req.url.replace(/\//g ,'_')}`;

                        if(this[cmd])
                            this[cmd](req,res);
                        else{res.write('hello\n');res.end();}
                        
                        
                    }).listen(8891,cb); //ipv6 ,'::'
                    this.instance.on('clientError', (err, socket) => {
                        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
                      });

               
    },
    on_share:function(req ,res){},
    on_detect:function(req ,res){

        res.setHeader('id', utools.getLocalId());
        res.end();
        Utils.addFeature(req.headers.ip ,req.headers.id);
        Utils.toast('欢迎'+req.headers.ip);
    },
    on_close:function(req ,res){res.end();
        _this.instance.close();},
    on_text : function(req ,res){
       
        req.setEncoding('utf8');
        let rawData = '';
        req.on('data', (chunk) => { rawData += chunk; });
        req.on('end', () => {
            if(/^https{0,1}:\/\/.+/.test(rawData)){
                utools.shellOpenExternal(rawData);
            }else{
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
    on_file : function(req ,res){
        var target_file = utools.getPath('downloads')+path.sep+decodeURI(req.headers.file_name);
        var size = parseInt(req.headers['content-length']);
        if(fs.existsSync(target_file) && fs.statSync(target_file).isDirectory()){
            Utils.toast(`[err]"${req.headers.file_name}"是一个目录`);
            res.end();
        }else{
            var ws = fs.createWriteStream(target_file);
            var read_length = 0;
            req.on('data', (chunk) => { 
                console.log('write:', (read_length+=chunk.length)/size * 100,'%');
                //ws.write(chunk);
            });
            req.on('end', () => {console.log('end:',(new Date()).getTime());
                ws.end();
                res.end();
            });
            ws.on('finish', () => {
                console.log('finish:',(new Date()).getTime());
            });
            req.pipe(ws);
        }
           
        
    },
    on_img : function(req ,res){console.log('img');
        req.setEncoding('utf8');
        let rawData = '';
        req.on('data', (chunk) => { rawData += chunk; console.log(chunk);});
        req.on('end', () => {console.log('end');
            utools.copyImage(rawData);
            res.end();
        });
        
    }
};

module.exports = server;
