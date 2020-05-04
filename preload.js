var Server = require('./server');
var Utils = require('./utils');
var Clients = require('./clients');

Server.check();
Utils.toast(`本机ip：${Utils.getLocalIp()}`);

setTimeout(function(){
    Utils.detectDevice();
},0);




   

utools.onPluginEnter(({code, type, payload, optional}) => {
    console.log('用户进入插件', code, type, payload);

    if(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(code)){

        if(type == 'files'){
            Clients.sendFile(code,payload,function(err){
                if(err){
                    Utils.toast('error');
                }else{
                    Utils.toast('发送成功');
                    //utools.outPlugin();
                    utools.hideMainWindow();
                }
            });
        }else{
            Clients.sendText(code,payload,function(err){
                if(err){
                    Utils.toast('error');
                }else{
                    Utils.toast('发送成功');
                    //utools.outPlugin();
                    utools.hideMainWindow();
                }
            });
        }

       
    }
    
})
