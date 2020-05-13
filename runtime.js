var Utils = require('./utils');

module.exports = {
    client:{
        fileSend:{
            name:'',
            size:0,
            sent:0,
            to:'',
            startTime:0
        }
    },
    server :{
        fileReceive:{
            name:'',
            size:0,
            receive:0,
            from:'',
            position:'',
            startTime:0
        }
    },
    
    localIp : Utils.getLocalIp(),
    localId : utools.getLocalId(),
    

    clear:function(key){
        var keys = key.split('.');
        var target = null;
        for(let i in keys){

        }
    }
}