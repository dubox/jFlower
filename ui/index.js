
var UI = new Vue({
    el: '#ui',
    data: {
        runTime : {
            file:app.clientRunTime.file,
            fileReceive:app.serverRunTime.file,
        }
    },
    computed: {
        speedSend:function(){
            let speed = Math.round((this.runTime.file.sent/1000/1000)/(((new Date()).getTime()-this.runTime.file.startTime)/1000)*100)/100;
            //console.log('speed',speed);
            return speed;
        },
        speedReceive:function(){
            let speed = Math.round((this.runTime.fileReceive.sent/1000/1000)/(((new Date()).getTime()-this.runTime.fileReceive.startTime)/1000)*100)/100;
            //console.log('speed',speed);
            return speed;
        }
    },
    methods: {
        showFile : function(path){
            app.showFile(path);
        }
    },
});