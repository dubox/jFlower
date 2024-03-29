const fs = require('fs');

function userData() {
    this.path = utools.getPath('userData') + '/jFlower' + (utools.isDev() ? '/dev' : '');//dev
    console.log(this.path);
    fs.mkdirSync(this.path, {
        recursive: true
    });
    
}

Object.assign(userData.prototype, {

    get(file_name, _default) {
        try {
            var json = fs.readFileSync(this.path + '/' + file_name + '.json', {
                encoding: 'utf8'
            });
            json = JSON.parse(json);
        } catch (e) {
            console.log(e)
            return typeof _default == 'undefined' ? {} : _default;
        }
        return json;
    },
    put(file_name, data) {
        try {
            fs.writeFile(this.path + '/' + file_name + '.json', JSON.stringify(data) ,(err)=>{
                if(err)
                console.log(err)
            });
            return true;
        } catch (e) {
            console.log(e)
            return false;
        }

    }
});
module.exports = new userData();