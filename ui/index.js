var app = window.app;


app.ui = new Vue({
    el: '#ui',
    data: {
        runTime: {
            fileSend: app.clientRunTime.fileSend,
            fileReceive: app.serverRunTime.fileReceive,
            serverState: app.serverState,
            localIp: app.localIp,
            history: app.history,
            imgPreView:-1
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
            // for (let i in hsy) {
            //     if (hsy[i].contentType == 'text') {
            //         hsy[i].content = hsy[i].content.replace(/(https{0,1}:\/\/\S+)/g, (match, item) => {
            //             return `<a onclick="app.openUrl('${match}')">${match}</a>`;
            //         });
            //     }
            // }

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
        parseText: function (text) {
            return text.replace(/(https{0,1}:\/\/\S+)/g, (match, item) => {
                return `<a onclick="app.openUrl('${match}')">${match}</a>`;
            });
        },
        copy: function (content, type) {
            if (app.copy(content, type))
                this.toast('已复制到剪贴板！', 'success');
            else
                this.toast('复制失败！', 'error');
        },
        saveImg(content){
            
            let buf = this.dataURLToBuffer(content);
            file_name = 'jFlower.' + Math.ceil( Math.random()*1000)+'.'+buf.type;
            var file_path = runTime.settings.downloadPath + app.path.sep + file_name;
            
            fs.writeFileSync(file_path,new DataView(buf.buffer));
            //fs.writeFileSync(file_path, this.dataURLToBlob(content) );
            //this.dataURLtoFile(content,file_name);
            utools.shellShowItemInFolder(file_path);
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
        },
        dataURLToBuffer(fileDataURL) {
            let arr = fileDataURL.split(','),
                type = arr[0].match(/:.*\/(.*?);/)[1],
                bstr = atob(arr[1]),
                n = bstr.length,
                u8arr = new Uint8Array(n);//return bstr;
            while(n --) {
              u8arr[n] = bstr.charCodeAt(n)
            }
            return {buffer:u8arr.buffer ,type:type};
            //return new Blob([u8arr], {type: mime})
        },
        dataURLToBlob(fileDataURL) {
            let arr = fileDataURL.split(','),
                mime = arr[0].match(/:(.*?);/)[1],
                bstr = atob(arr[1]),
                n = bstr.length,
                u8arr = new Uint8Array(n);//return bstr;
            while(n --) {
              u8arr[n] = bstr.charCodeAt(n)
            }
            return new Blob([u8arr], {type: mime})
        },
        dataURLtoFile(dataUrl, fileName) {
            var arr = dataUrl.split(','), mime = arr[0].match(/:(.*?);/)[1],
                bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
            while(n--){
                u8arr[n] = bstr.charCodeAt(n);
            }
            return new File([u8arr], fileName, {type:mime});
        }
    },
    mounted() {


    },
    watch: {
        settings: {
            handler(newVal, oldVal) {
                app.updSettings();

            },
            deep: true
        },
        'settings.freeWin':{
            handler(newVal, oldVal) {
                if(newVal)
                app.showFreeWin();
            },
        },
        'runTime.history':{
            handler(newVal, oldVal) {
                //app.updHistory();
            },
            //deep: true
        },
    }
});

// setTimeout(() => {
//     app.checkServer(() => {
//         app.detectDevice();
//         app.ui.runTime.serverState = true;
//     });
// }, 0);