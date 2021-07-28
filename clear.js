const path = require('path');
const fs = require('fs');

let dirs = [];
function getFile(pathName) {
    fs.readdirSync(pathName).map((item) => {
        const filePath = path.join(pathName, item);
        const stat = fs.statSync(filePath);
        if (stat.isFile()) {
            dirs.push(filePath);
        } else {
            getFile(filePath);
        }
    })
}

getFile("./chromium-4400");

dirs.forEach(item => {
    if (/\.map$/.test(item)) {
        fs.unlink(item, function (err) {
            if (err) {
                console.error(err);
            }
        });
    }
    if (/\.js$/.test(item)) {
        let code = fs.readFileSync(item, { encoding: 'utf-8' });
        code = code.replace(/\/\/# sourceMappingURL=.+\.js\.map/, '')
        fs.writeFileSync(item, code);
    }
})
