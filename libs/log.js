const fs = require('fs');

let options = {
    flags: 'a', // 
    encoding: 'utf8', // utf8编码
}

let stderr = fs.createWriteStream(utools.getPath('documents') + '/jflower.log', options);

// 创建logger
//module.exports = new console.Console(stderr);
module.exports = new require('console').Console(stderr);