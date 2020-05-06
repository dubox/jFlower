const http = require('http');
const fs = require('fs');
var Utils = require('./utils');

module.exports = {
    sendText : function(ip,text,cb){
      this.sender('text',ip , text.length ,cb).write(text,'utf8');
    },
    sendFile:function(ip , files ,cb ){
        var file = files[0];
       console.log('file');
       let size = fs.statSync(file.path).size;console.log('size:',size);
        //fs.createReadStream(file.path).pipe(this.sender('file',ip , size ,cb,{file_name:file.name}));console.log('www')
        var req = this.sender('file',ip , size ,cb,{file_name:file.name})
        var readstream = fs.createReadStream(file.path);
        readstream.on('data', function(chunk) {
          console.log('write', chunk.length);
          req.write(chunk);
      });
      readstream.on('end', function() {
          req.end();
      });
          //req.end();
    },
    sendImg:function(ip , img ,cb){
      
        this.sender('img',ip , img.length ,cb).write(img,'utf8');//,() => {req.end();}
    },
  sender:function(type,ip,data_size,cb,headers){
    const options = {
      hostname: ip,
      port: 8891,
      path: '/'+type,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        //'Content-Length': data_size
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
        console.log('响应中已无数据');
        cb(0);
      });
    });
    
    req.on('error', (e) => {
      console.error(`请求遇到问题: ${e.message}`);
      cb(e.message);
    });
    return req;
  },
    sentCallback:function(err){
      if(err){
          Utils.toast('error');
      }else{
          Utils.toast('发送成功');
          //utools.outPlugin();
          utools.hideMainWindow();
      }
    }
};