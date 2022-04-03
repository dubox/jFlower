const fs = require('fs');

function userData() {
    this.path = utools.getPath('userData') + '/jFlower' + (utools.isDev() ? '/dev' : '');//dev
    console.log(this.path);
    fs.mkdirSync(this.path, {
        recursive: true
    });
    
}

userData.prototype = Object.assign(userData.prototype, {

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
            fs.writeFileSync(this.path + '/' + file_name + '.json', JSON.stringify(data));
            return true;
        } catch (e) {
            console.log(e)
            return false;
        }

    }
});
module.exports = new userData();