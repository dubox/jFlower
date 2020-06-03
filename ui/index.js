
app.ui = new Vue({
    el: '#ui',
    data: {
        runTime: {
            fileSend: app.clientRunTime.fileSend,
            fileReceive: app.serverRunTime.fileReceive,
            serverState: app.serverState,
            localIp: app.localIp
        },
        settings: app.settings,
        drawer: false
    },
    computed: {
        speedSend: function () {
            let speed = Math.round((this.runTime.fileSend.sent / 1000 / 1000) / (((new Date()).getTime() - this.runTime.fileSend.startTime) / 1000) * 100) / 100;
            //console.log('speed',speed);
            return speed;
        },
        speedReceive: function () {
            let speed = Math.round((this.runTime.fileReceive.receive / 1000 / 1000) / (((new Date()).getTime() - this.runTime.fileReceive.startTime) / 1000) * 100) / 100;
            //console.log('speed',speed);
            return speed;
        },
        circleSize: function () {
            if (this.runTime.fileSend.size && this.runTime.fileReceive.size)
                return 300;
            if (this.runTime.fileSend.size || this.runTime.fileReceive.size)
                return 500;
        },
        serverState1: function () {
            return app.serverState;
        }
    },
    methods: {
        showFile: function (path) {
            app.showFile(path);
        },

    },
    watch: {
        settings: {
            handler(newVal) {
                app.updSettings();
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
