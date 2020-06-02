const fs = require('fs');

module.exports = function (path) {
    var fd = fs.openSync(path, 'r') // 返回的是一个内存地址


    //  Buffer.alloc 内存开辟的一个缓冲区
    var buf = Buffer.alloc(8);
    var len = fs.readSync(fd, buf, 0, 8, 0); //console.log(len, buf); return;

    var box = buf.toString('utf8', 4, 8);
    if (box != 'ftyp') {    //第一个box不是ftyp则可能不是MP4文件
        fs.closeSync(fd);
        return false;
    }
    var box_size = 0;
    var pos = 0;

    while (box != 'moov' && len === 8 && (box_size = buf.readUIntBE(0, 4))) {

        if (box_size === 1) {
            len = fs.readSync(fd, buf, 0, 8, pos + 8); console.log(buf, parseInt(buf.readBigUInt64BE()), len);
            box_size = parseInt(buf.readBigUInt64BE());
        }
        console.log(box, box_size, pos);
        len = fs.readSync(fd, buf, 0, 8, pos += box_size);
        box = buf.toString('utf8', 4, 8);
    }
    fs.closeSync(fd);

    if (box == 'moov') return pos;
    return false;

};