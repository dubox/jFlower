module.exports = {
    client:{
        file:{
            name:'',
            size:0,
            sent:0,
            to:'',
            startTime:0
        }
    },
    server :{
        file:{
            name:'',
            size:0,
            receive:0,
            from:'',
            position:'',
            startTime:0
        }
    },

    clear:function(key){
        var keys = key.split('.');
        var target = null;
        for(let i in keys){

        }
    }
}