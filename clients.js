const http = require('http');
const fs = require('fs');
var Utils = require('./utils');

module.exports = {
    sendText : function(ip,text,cb){
      var req = this.sender('text',ip , new Buffer(text).length ,cb)
        req.write(text,'utf8',() => {req.end();});//
    },
    sendFile:function(ip , files ,cb ){
        var file = files[0];
       console.log('file');
       let size = fs.statSync(file.path).size;console.log('size:',size);
       
        //文件名使用url转码，否则中文在header中会有问题
        var req = this.sender('file',ip , size ,cb,{file_name:encodeURI(file.name)});
        var rs = fs.createReadStream(file.path);
        var read_length = 0;
        rs.on('data', function(chunk) {
          console.log('read:', (read_length+=chunk.length)/size * 100,'%');
          //req.write(chunk);
        });
        rs.on('end', function() {console.log('end2:',(new Date()).getTime());
            req.end();
        });
        rs.on('error', function(err) {console.log('err:',err);
            req.destroy(err);
        });
        req.on('finish', () => {
          console.log('finish2:',(new Date()).getTime());
      });
      rs.pipe(req);
          //req.end();
    },
    sendImg:function(ip , img ,cb){
      
        var req = this.sender('img',ip , img.length ,cb)
        req.write(img,'utf8',() => {req.end();});//
    },
  sender:function(type,ip,data_size,cb,headers){
    const options = {
      hostname: ip,
      port: 8891,
      path: '/'+type,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': data_size
        //'Transfer-Encoding' : 'chunked'
      }
    };
    if(headers){
      for(let i in headers){
        options.headers[i] = headers[i];
      }
    }
    
    const req = http.request(options, (res) => {
      console.log(`状态码: ${res.statusCode}`);
      console.log(`响应头: ${JSON.stringify(res.headers)}`);
      res.setEncoding('utf8');
      res.on('data', (chunk) => {
        console.log(`响应主体: ${chunk}`);
      });
      res.on('end', () => {
        console.log('res end');
        cb(0);
      });
    });console.log(req);
    
    req.on('error', (e) => {
      console.error(`请求遇到问题: ${e.message}`);
      cb(e.message);
    });
    req.on('end', (e) => {
      console.log(`req end`);
      
    });
    return req;
  },
    sentCallback:function(err){console.log('cb');
      if(err){
          Utils.toast('error');
      }else{
          Utils.toast('发送成功');
          utools.outPlugin();
          utools.hideMainWindow();
      }
    }
};