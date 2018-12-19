'use strict';

const promisify = require('util').promisify;
const fs = require('fs');
const path = require('path');
const express = require('express');
const lockfile = require('proper-lockfile');

const PORT = 8080;
const HOST = '0.0.0.0';
const CACHE_PATH =  process.argv[2] || '/data';
const LAST_FILENAME = '.last';

function matchSync(path){
    if (fs.existsSync(path)) return;
    fs.closeSync(fs.openSync(path, 'w'));
}

((LOG_PATH)=>{
    if(fs.existsSync(LOG_PATH)) return;
    fs.mkdirSync(LOG_PATH);
})(CACHE_PATH)

const app = express();

const LAST_FILE_PATH = path.join(CACHE_PATH,LAST_FILENAME);
const readfile = promisify(fs.readFile);
const writefile = promisify(fs.writeFile);
matchSync(LAST_FILE_PATH);

function readLastFile() { return readfile(LAST_FILE_PATH); }
function writeLastFile(message) { return writefile(LAST_FILE_PATH, message, { flag: 'w' })}

app.get('/:string', (req, res) => {
    const msg = `${Date.now()},${req.params.string}`;
    console.log(msg);

    let last = null;
    let release = null;

    return lockfile.lock(LAST_FILE_PATH).then((_release) => {
        release = _release;
        return readLastFile();
    }).then((lastMessage) => {
        last = lastMessage;
        return writeLastFile(msg);
    }).then(() => {
        release();
        res.send(last + " -> " + msg);
    })
});

app.listen(PORT, HOST);
console.log("working...")