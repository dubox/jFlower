var app = window.app;


app.ui = new Vue({
    el: '#ui',
    data: {
        runTime: {
            fileSend: app.clientRunTime.fileSend,
            fileReceive: app.serverRunTime.fileReceive,
            serverState: app.serverState,
            localIp: app.localIp,
            history: app.history
        },
        settings: app.settings,
        drawer: false,
        modal:{
            show :false,
            cb :null,
            msg :'',
        }
    },
    computed: {
        // speedSend: function () {
        //     let speed = Math.round((this.runTime.fileSend.sent / 1000 / 1000) / (((new Date()).getTime() - this.runTime.fileSend.startTime) / 1000) * 100) / 100;
        //     //console.log('speed',speed);
        //     return speed;
        // },
        // speedReceive: function () {
        //     let speed = Math.round((this.runTime.fileReceive.receive / 1000 / 1000) / (((new Date()).getTime() - this.runTime.fileReceive.startTime) / 1000) * 100) / 100;
        //     //console.log('speed',speed);
        //     return speed;
        // },
        // circleSize: function () {
        //     if (this.runTime.fileSend.size && this.runTime.fileReceive.size)
        //         return 300;
        //     if (this.runTime.fileSend.size || this.runTime.fileReceive.size)
        //         return 500;
        // },
        // serverState1: function () {
        //     return app.serverState;
        // },


        _history: function () {
            var hsy = JSON.parse(JSON.stringify(this.runTime.history));
            for (let i in hsy) {
                if (hsy[i].contentType == 'text') {
                    hsy[i].content = hsy[i].content.replace(/(https{0,1}:\/\/\S+)/g, (match, item) => {
                        return `<a onclick="app.openUrl('${match}')">${match}</a>`;
                    });
                }
            }

            return hsy;
        },
        ipPrefix: function () {
            var seg = this.runTime.localIp.split('.');
            return seg[0] + '.' + seg[1] + '.' + seg[2];
        }
    },
    methods: {
        toast: function (msg, type) {
            if (type)
                this.$Message[type](msg);
            else
                this.$Message.info(msg);
        },
        showFile: function (path) {
            app.showFile(path);
        },
        copy: function (content, type) {
            if (app.copy(content, type))
                this.toast('已复制到剪贴板！', 'success');
            else
                this.toast('复制失败！', 'error');
        },
        del: function (index) {
            this.fileCancel(app.delHistory(index));
        },
        fileCancel(history){
            if(history.contentType != 'file')return;
            
            app.fileSend.cancel(history);
            if(history.type == 1){
                this.alert('同时删除文件？',()=>{
                    app.unlink(history.content.path)
                },'删除','不删除');
            }
        },
        filePause(history){
            app.fileSend.pause(history);
            
            },
        fileResume(history){
            app.fileSend.resume(history);
            },
        modalOK(){
            if(cb)
                this.modal.cb();
        },
        alert(msg ,cb,okText,cancelText){
            this.$Modal.confirm({
                //title: '',
                content: msg,
                okText: okText?okText:'确定',
                cancelText: cancelText?cancelText:'取消',
                onOk:cb
            });
            return;

            this.modal.show=true;
            this.modal.msg=msg;
            this.modal.cb=cb;
        }
    },
    mounted() {


    },
    watch: {
        settings: {
            handler(newVal, oldVal) {
                // console.log('newVal:', newVal);
                // console.log('oldVal:', oldVal);
                // console.log(newVal.findingCode.isOnly, oldVal.findingCode.isOnly)
                // if (newVal.findingCode.isOnly != oldVal.findingCode.isOnly) {
                //     if (newVal.otherIpSeg)
                //         app.detect(newVal.otherIpSeg);
                //     app.detect();
                // }

                app.updSettings();

            },
            deep: true
        },
        'runTime.history':{
            handler(newVal, oldVal) {
                app.updHistory();
            },
            deep: true
        }
    }
});

// setTimeout(() => {
//     app.checkServer(() => {
//         app.detectDevice();
//         app.ui.runTime.serverState = true;
//     });
// }, 0);