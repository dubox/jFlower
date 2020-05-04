const os = require('os');
const http = require('http');

module.exports = {
    toast :function (msg,code){
        utools.showNotification(msg);
    },
    //获取内网ip
    getLocalIp :function (){
        var map = [];  
        var nif = os.networkInterfaces();
        //console.log(nif);
        for (let i in nif){
            if(nif[i].length > 1)
                if(nif[i][1].address.indexOf('192.168') === 0)
                    return nif[i][1].address;
        }
        return '';
    },

    clearFeatures : function(){
        //移除动态加载的功能
        var f = utools.getFeatures();
        for(let i in f){
            if(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(f[i].code)){
                utools.removeFeature(f[i].code);
            }
        }
    },
    addFeature :function (ip,id){
        utools.setFeature({
            "code": ""+ip,
            "explain": "发送到："+ip,
            // "icon": "res/xxx.png",
            // "icon": "data:image/png;base64,xxx...",
            // "platform": ["win32", "darwin", "linux"]
            "cmds": [
               
                {
                    "type": "over",
                    "label": "无匹配时",
                    // 排除的正则 (可选)
                    //"exclude":"/xxx/i",
                    // 长度限制（主输入框中的字符不少于） (可选)
                    "minLength": 1,
                    // 长度限制（不多于） (可选)
                    //"maxLength": 1
                },
                {
                    "type": "files",
                    "label": "文件匹配",
                    // 支持file或directory (可选)
                    "fileType": "file",
                    // 文件名称正则匹配  (可选)
                    //"match": "/xxx/",
                    // 数量限制（不少于） (可选)
                    "minNum": 1,
                    // 数量限制（不多于） (可选)
                    "maxNum": 1
                  }
            ]
          })
    },
    detectDevice : function(){

        var _this = this;
        this.clearFeatures();
        var ipSeg = _this.getLocalIp().split('.');
        ipSeg.pop();
        var ips = [];
        for(let i=1;i<256;i++){
            var ip = ipSeg.join('.') + '.' +i;
            (function(ip){
                http.get(`http://${ip}:8891`, (res) => {console.log(ip);console.log(res);
                ips.push(ip);
                _this.addFeature(ip);
                res.resume();
              }).on('error', (err) => {});
            })(ip);
            
        }
        return ips;
    }

}

