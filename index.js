const ora = require("ora");
let Client = require("ssh2-sftp-client");
let PromisePool = require("es6-promise-pool");
const { default: chalk } = require("chalk");
const { SERVER_LIST, FILE_LIST, LOCAL_DIR } = require("./config");

// 1. zip updated files
const path = require("path");
const fs = require("fs");
const archiver = require("archiver");
let date = new Date();
let filetime = date.getMonth() + 1 + "." + date.getDate() + "-" + date.getHours();
let zipfile = "./archivers/dist." + filetime + ".zip";
console.log("[zip]", zipfile);

var output = fs.createWriteStream(zipfile);
var archive = archiver("zip");
archive.pipe(output);
for (const list of FILE_LIST) {
    let dir = LOCAL_DIR + list.subdir + list.file;
    let subdir = list.subdir + list.file;
    if (list.cmd == "dir") {
        archive.directory(dir, subdir, true);
    } else {
        archive.file(dir, { name: list.file });
    }
}
archive.finalize();

output.on("close", function () {
    console.log(archive.pointer() + " total bytes");
    console.log("archiver has been finalized and the output file descriptor has closed.");
});
archive.on("error", function (err) {
    throw err;
});

// 2. upload files to server
const spinner = ora("upload...");
const sendFile = (host, fileInfo) => {
    return new Promise(function (resolve, reject) {
        let sftp = new Client();
        let file = fileInfo.file;
        let subdir = fileInfo.subdir;
        let cmd = fileInfo.cmd;
        let local = LOCAL_DIR + subdir + file;
        let remote = host.dir + subdir + file;
        sftp.on("keyboard-interactive", (name, instructions, instructionsLang, prompts, finish) => {
            finish([host.password]);
        });
        sftp.connect(host)
            .then(() => {
                return sftp.exists(remote);
            })
            .then((exist) => {
                console.log(chalk.red("[delete]"), cmd, exist, host.host, remote);
                if (exist && cmd == "file") {
                    return sftp.delete(remote, true);
                }
                if (exist && cmd == "dir") {
                    return sftp.rmdir(remote, true);
                }
            })
            .then(() => {
                console.log(chalk.blue("[start] "), host.host, local);
                spinner.start();
                if (cmd == "file") {
                    return sftp.fastPut(local, remote);
                }
                if (cmd == "dir") {
                    return sftp.uploadDir(local, remote);
                }
            })
            .then(() => {
                spinner.stop();
                console.log(chalk.green("[finish]"), host.host, remote);
                sftp.end();
                resolve(file);
            })
            .catch((err) => {
                spinner.stop();
                console.log(err, "catch error");
            });
    });
};

var count = 0;
var files = [];
const severs = SERVER_LIST;

severs.forEach((s, i) => {
    for (const list of FILE_LIST) {
        let file = { ...list };
        file.id = i;
        files.push(file);
    }
});

var sendFileProducer = function () {
    if (count < files.length) {
        let fileInfo = files[count];
        let id = fileInfo["id"];
        let host = severs[id];
        console.log({ task: count + 1, host: host.host });
        count++;
        return sendFile(host, fileInfo).then((res) => {});
    } else {
        return null;
    }
};
// threads
var concurrency = 1;
var pool = new PromisePool(sendFileProducer, concurrency);

// RUN
pool.start().then(function () {
    console.log({ message: "OK" });
});
