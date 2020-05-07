var Server = require('./server');
var Utils = require('./utils');
var Clients = require('./clients');


Utils.toast(`本机ip：${Utils.getLocalIp()}`);


Server.check(()=>{
    Utils.detectDevice();
});



utools.onPluginEnter(({code, type, payload, optional}) => {
    console.log('用户进入插件', code, type, payload);

    if(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(code)){

        if(type == 'files'){
            Clients.sendFile(code,payload,Clients.sentCallback);
        }else if(type == 'img'){
            Clients.sendImg(code,payload,Clients.sentCallback);
        }else{
            Clients.sendText(code,payload,Clients.sentCallback);
        }

       
    }
    
});

window.app = {
    localIp : Utils.getLocalIp(),
    checkServer : function(cb){Server.check(cb);},
}
