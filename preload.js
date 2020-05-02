const http = require('http');
var os = require('os');
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

window.detectDevice = function(){


    var ipSeg = getLocalIp().split('.');
    ipSeg.pop();
    var ips = [];
    for(let i=1;i<256;i++){
        var ip = ipSeg.join('.') + '.' +i;
        http.get(`http://${ip}:8891`, (res) => {
            ips.push(ip);
          }).on('error', (err) => {});
    }
    
};

// Server has a 5 seconds keep-alive timeout by default
window.http = function(){
    
}
utools.showNotification(`本机ip：${getLocalIp()}`, clickFeatureCode = '123', silent = true);
   


http.get('http://127.0.0.1:8891', (res) => {
      // ...
    }).on('error', (err) => {
      // Check if retry is needed
      console.log(err);
      http.createServer((req, res) => {
        res.write('hello\n');
        //utools.showNotification('body', clickFeatureCode = '123', silent = true);
        res.end();
    }).listen(8891); //ipv6 ,'::'
});