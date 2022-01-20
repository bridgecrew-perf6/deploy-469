var LOCAL_DIR = "./dist";

var FILE_LIST = [
    {
        cmd: "file",
        subdir: "/",
        file: "index.html",
    },
    {
        cmd: "dir",
        subdir: "/static/",
        file: "",
    },
];
const SERVER_LIST = [
    {
        host: "12.0.0.1",
        port: 22,
        username: "root",
        password: "pass",
        dir: "/wwwroot/public",
    },
];

module.exports = { SERVER_LIST, FILE_LIST, LOCAL_DIR };
