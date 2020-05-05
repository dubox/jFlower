const http = require('http');
const fs = require('fs');
var Utils = require('./utils');

module.exports = {
    sendText : function(ip,text,cb){
        let url = `http://${ip}:8891/text?${text}`;
        console.log(url);
        http.get(url, (res) => {
            res.resume();
            cb(0);
          }).on('error', (err) => {
              cb(err);
        });
    },
    sendFile:function(ip , files ,cb){
        var file = files[0];
        fstream = fs.createReadStream(file.path);
          
          const options = {
            hostname: ip,
            port: 8891,
            path: '/file',
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Content-Length': fs.statSync(file.path).size
            }
          };
          
          const req = http.request(options, (res) => {
            console.log(`状态码: ${res.statusCode}`);
            console.log(`响应头: ${JSON.stringify(res.headers)}`);
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
              console.log(`响应主体: ${chunk}`);
            });
            res.on('end', () => {
              console.log('响应中已无数据');
            });
          });
          
          req.on('error', (e) => {
            console.error(`请求遇到问题: ${e.message}`);
            cb(e.message);
          });
          
          // 将数据写入请求主体。
          //req.write(postData);
          fstream.pipe(req);
          //req.end();
          cb(0);
    },
    sendImg:function(ip , img ,cb){
      
        const options = {
          hostname: ip,
          port: 8891,
          path: '/img',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': img.length
          }
        };
        
        const req = http.request(options, (res) => {
          console.log(`状态码: ${res.statusCode}`);
          console.log(`响应头: ${JSON.stringify(res.headers)}`);
          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            console.log(`响应主体: ${chunk}`);
          });
          res.on('end', () => {
            console.log('响应中已无数据');
          });
        });
        
        req.on('error', (e) => {
          console.error(`请求遇到问题: ${e.message}`);
          cb(e.message);
        });
        
        // 将数据写入请求主体。
        req.write(img);
        req.end();
        cb(0);
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