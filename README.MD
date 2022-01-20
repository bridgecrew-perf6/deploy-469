# Node.js Deploy Script

###  Packages
```
npm i
```

### Config 
`config.js`
* LOCAL_DIR: `./dist`
* FILE_LIST:
```
[
    {
        cmd: 'file',
        subdir: '/',
        file: 'index.html',
    },
    {
        cmd: 'dir',
        subdir: '/static/',
        file: '',
    },
]
```
* SERVER_LIST
```
[
    {
        host: '127.0.0.1',
        port: 22,
        username: 'root',
        password: 'pass',
        dir: '/wwwroot/public',
    },
]
```
### Deply
```
npm run deploy
```
