'use strict';

const promisify = require('util').promisify;
const fs = require('fs');
const path = require('path');
const express = require('express');
const lockfile = require('proper-lockfile');

const PORT = 8080;
const HOST = '0.0.0.0';
const CACHE_PATH =  process.argv[2] || '/data';
const LAST_CACHE_FILENAME = '.last';

function touchSync(path){
    if (fs.existsSync(path)) return;
    fs.closeSync(fs.openSync(path, 'w'));
}

((logPath)=>{
    if(fs.existsSync(logPath)) return;
    fs.mkdirSync(logPath);
})(CACHE_PATH)

const app = express();

const lastFilePath = path.join(CACHE_PATH,LAST_CACHE_FILENAME);
const rf = promisify(fs.readFile);
const wf = promisify(fs.writeFile);
touchSync(lastFilePath);

function readLastFile() { return rf(lastFilePath); }
function writeLastFile(message) { return wf(lastFilePath, message, { flag: 'w' })}

app.get('/:string', (req, res) => {
    const msg = `${Date.now()},${req.params.string}`;
    console.log(msg);

    let last = null;
    let release = null;

    return lockfile.lock(lastFilePath).then((_release) => {
        release = _release;
        return readLastFile();
    }).then((lastMsg) => {
        last = lastMsg;
        return writeLastFile(msg);
    }).then(() => {
        release();
        res.send(last + " -> " + msg);
    })
});

app.listen(PORT, HOST);
console.log(`Running on http://${HOST}:${PORT}`);