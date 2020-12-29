'use strict'

const fs = require('fs')  
const Path = require('path')  
const axios = require('axios')

async function download(data) {
    var req = data.map(element => {
        const path = Path.resolve(element["filename"]);
        
        const writer = fs.createWriteStream(path);
        var url = element["uri"];

        axios({
            method:'get',
            url:url,
            responseType:'stream'
        })
        .then(function (response){
            response.data.pipe(writer);
            return path.slice(path.lastIndexOf('\\')+1,path.length);
        })
        .then(function (path) {
            console.log("Wrote file " + path);
            return path;
        })
        .catch( error => {
            console.error(error);
        });        

        return new Promise((resolve, reject) => {
            writer.on('finish', () => {
                resolve(element["filename"]);
            });
            writer.on('error', reject);
        });
    });

    return Promise.all(req);
}

module.exports = download;