const http = require('http');
var os = require('os');


var app = window.app = {};

//获取内网ip
function getLocalIp(){
    var map = [];  
    var nif = os.networkInterfaces();
    //console.log(nif);
    for (let i in nif){
        if(nif[i].length > 1)
            if(nif[i][1].address.indexOf('192.168') === 0)
                return nif[i][1].address;
    }
    return '';
}
var f = utools.getFeatures();
for(let i in f){
    if(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(f[i].code)){
        utools.removeFeature(f[i].code);
    }
}

function addFeature(ip,id){
    utools.setFeature({
        "code": ""+ip,
        "explain": "发送到："+ip,
        // "icon": "res/xxx.png",
        // "icon": "data:image/png;base64,xxx...",
        // "platform": ["win32", "darwin", "linux"]
        "cmds": [
            {
                "type": "regex",
                "label": "文本正则匹配",
                // 正则表达式字符串
                "match":"/.+/",
                // 长度限制（主输入框中的字符不少于） (可选)
                //"minLength": 1,
                // 长度限制（不多于） (可选)
                //"maxLength": 1
            },
            {
                "type": "over",
                "label": "无匹配时",
                // 排除的正则 (可选)
                //"exclude":"/xxx/i",
                // 长度限制（主输入框中的字符不少于） (可选)
                "minLength": 1,
                // 长度限制（不多于） (可选)
                //"maxLength": 1
            }
        ]
      })
}

window.detectDevice = function(){


    var ipSeg = getLocalIp().split('.');
    ipSeg.pop();
    var ips = [];
    for(let i=1;i<256;i++){
        var ip = ipSeg.join('.') + '.' +i;
        (function(ip){
            http.get(`http://${ip}:8891`, (res) => {console.log(ip);console.log(res);
            ips.push(ip);
            addFeature(ip);
            res.resume();
          }).on('error', (err) => {});
        })(ip);
        
    }
    return ips;
};

// Server has a 5 seconds keep-alive timeout by default
window.http = function(){
    
}

var sendText = function(ip,text){
    let url = `http://${ip}:8891/text?${text}`;
    console.log(url);
    http.get(url, (res) => {
        res.resume();
      }).on('error', (err) => {
    });
};


utools.showNotification(`本机ip：${getLocalIp()}`, clickFeatureCode = '123', silent = true);
   


http.get('http://127.0.0.1:8891', (res) => {
    res.resume();
    }).on('error', (err) => {
      // Check if retry is needed
      //console.log(err);
      http.createServer((req, res) => {
          if(req.url=="/favicon.ico"){
            res.end();
            return;
          }
          console.log(req);
          let text = req.url.split('?');
          text =  decodeURI(text[1]);
        res.write('hello\n');
        utools.copyText(text)
        utools.showNotification(`"${text}"已复制到剪贴板`);
        res.end();
    }).listen(8891); //ipv6 ,'::'
});
// var d = 1;
// setInterval(() => {
//     console.log(d++);
// }, 2000);

utools.onPluginEnter(({code, type, payload, optional}) => {
    console.log('用户进入插件', code, type, payload);
    sendText(code,payload);
})
