const http = require('http');
const fs = require('fs');
var Utils = require('./utils');
//var runTime = require('./runtime');

module.exports = {
  runTime: runTime.client,
  sendText: function (ip, text, cb) {
    var req = this.sender('text', ip, new Buffer(text).length, cb)
    req.write(text, 'utf8', () => {
      req.end();
    }); //
    this.runTime.type = 'text';
    this.runTime.content = text;
  },
  sendFile: function (ip, files, cb) {
    var _this = this;
    this.runTime.type = 'file';
    var file = files[0];
    let size = _this.runTime.fileSend.size = fs.statSync(file.path).size;
    console.log('size:', size);
    _this.runTime.fileSend.to = ip;
    _this.runTime.fileSend.path = file.path;

    //文件名使用url转码，否则中文在header中会有问题
    var req = this.sender('file', ip, size, cb, {
      file_name: encodeURI(_this.runTime.fileSend.name = file.name)
    });
    var rs = fs.createReadStream(file.path);
    _this.runTime.fileSend.sent = 0;
    rs.on('data', function (chunk) {
      _this.runTime.fileSend.sent += chunk.length;
      //console.log('read:', (read_length+=chunk.length)/size * 100,'%');
      //req.write(chunk);
    });
    rs.on('end', function () {
      console.log('end2:', (new Date()).getTime());
      req.end();
      //_this.runTime.fileSend = {startTime:0};
    });
    rs.on('error', function (err) {
      console.log('err:', err);
      req.destroy(err);
    });
    req.on('finish', () => {
      console.log('finish2:', (new Date()).getTime());
    });
    rs.pipe(req);
    _this.runTime.fileSend.startTime = (new Date()).getTime();
  },
  sendImg: function (ip, img, cb) {

    var req = this.sender('img', ip, img.length, cb)
    req.write(img, 'utf8', () => {
      req.end();
    }); //
    this.runTime.type = 'img';
    this.runTime.content = img;
  },
  sender: function (type, ip, data_size, cb, headers) {

    const options = {
      hostname: ip,
      port: 8891,
      path: '/' + type,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': data_size,
        //'Transfer-Encoding' : 'chunked',
        'cmd': type,
        'ip': Utils.getLocalIp(),
        'id': runTime.localId
      },
      timeout: 2000
    };
    if (headers) {
      for (let i in headers) {
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
    });

    req.on('error', (e) => {
      console.error(`请求遇到问题: ${e.message}`);
      cb(e.message);
    });
    req.on('end', (e) => {
      console.log(`req end`);
    });

    this.runTime.targetIp = ip;

    return req;
  },
  sentCallback: function (err) {
    console.log('cb');
    if (err) {
      Utils.toast('error');
    } else {
      var content = runTime.client.content;
      if (runTime.client.type == 'file') {
        content = {
          name: runTime.client.fileSend.name,
          path: runTime.client.fileSend.path,
          transferred: runTime.client.fileSend.sent, //已传输的大小
          total: runTime.client.fileSend.size,
          elapsed: new Date().getTime() - runTime.client.fileSend.startTime
        };
      }
      runTime.addHistory({
        ip: runTime.client.targetIp,
        id: runTime.client.targetId,
        type: 2, //1 from,2 to
        content: content,
        contentType: runTime.client.type, //text file
        time: new Date().getTime()
      });

      Utils.toast('发送成功');
      utools.outPlugin();
      utools.hideMainWindow();
    }
  }
};