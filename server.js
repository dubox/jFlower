const http = require('http');
const fs = require('fs');
const path = require('path');
var Utils = require('./utils');

var server = {

    instance :null,
    port  : 8891,

    check : function(){
        var _this = this;
        
            http.get('http://127.0.0.1:'+this.port, (res) => {
                res.resume();
            }).on('error', (err) => { 

                if(_this.instance)
                _this.instance.close();
                _this.create();
            });
        
    },

    create : function(){
               
                var _this = this;
                    this.instance = http.createServer((req, res) => {
                        if(req.url=="/favicon.ico"){
                            res.end();
                            return;
                        }
                        console.log(req);
                        res.on('end', () => {console.log('res end'); });
                        //var url = req.url.split('?');
                        var cmd = req.url;
                        if(cmd == '/text'){
                            _this.onText(req,res);
                        }else if(cmd == '/file'){
                            _this.onFile(req,res);
                        }else if(cmd == '/img'){
                            _this.onImg(req,res);
                        }else if(cmd == '/share'){

                        }else{res.write('hello\n');res.end();}
                        
                        
                    }).listen(8891); //ipv6 ,'::'
               
    },
    onText : function(req ,res){
       
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
    onFile : function(req ,res){
        var target_file = utools.getPath('downloads')+path.sep+decodeURI(req.headers.file_name);
        if(fs.existsSync(target_file) && fs.statSync(target_file).isDirectory()){
            Utils.toast(`[err]"${req.headers.file_name}"是一个目录`);
            res.end();
        }else{
            //req.pipe(fs.createWriteStream(target_file));
            var ws = fs.createWriteStream(target_file);
            req.on('data', (chunk) => { ws.write(chunk);});
            req.on('end', () => {
                ws.end();
                res.end();
                //utools.copyImage(rawData);
            });
        }
           
        
    },
    onImg : function(req ,res){console.log('img');
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
