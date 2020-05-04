const http = require('http');
const fs = require('fs');
const path = require('path');

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
                        var url = req.url.split('?');
                        var cmd = url[0];
                        if(cmd == '/text'){
                            _this.onText(url[1] || '');
                        }else if(cmd == '/file'){
                            _this.onFile(req);
                        }else if(cmd == '/share'){

                        }else{res.write('hello\n');}
                        
                        res.end();
                    }).listen(8891); //ipv6 ,'::'
               
    },
    onText : function(text){
        text =  decodeURI(text);
                            
        utools.copyText(text);
        toast(`"${text}"已复制到剪贴板`);
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
    onFile : function(req){
        var fstream = fs.createWriteStream(utools.getPath('downloads')+path.sep+'a.txt');console.log(fstream);
        req.pipe(fstream);
        
    }
};

module.exports = server;
