'use strict'

const downloader = require("image-downloader");


const fs = require('fs');
const request = require('request-promise');

/**
 * Parses the JSON data and downloads the images from the given URL(s).  
 * Saves the images in the directory `./Book` with the page number for each file.
 * @param {*} data the JSON data containing the detailed information about the comic book pages
 */
async function download(data) {
    console.log(data);
    // The concurrency property here represents the number of promises that will be allowed to run at the same time
    // await Promise.map(data, downloadFile, {concurrency: 10});
    
    // // map() instead of forEach() to get a promise per request
    // const reqs = data.map(element => {
    //     // return the inner promise chain to be collected
    //     return downloader.image(element)
    //     .then( ({filename}) => {
    //         console.log("Saved to ",filename); 
    //         return filename;
    //     });
    // });

    var reqs = [];
    data.map(element => {
        var img = element.dest;
        var url = element.url;
        let req = request(url);
        req.pipe(fs.createWriteStream(img));
        reqs.push(req);
    });

    // return a promise that waits for all of them to be finished
    return Promise.all( reqs );

}

/**
 * 
 * @param {*} data One single JSON element.
 */
function downloadFile(data){
    console.log(data);
    downloader.image(data)
    .then( ( {filename, image }) => {
        console.log("Saved to "+filename);
    })
    .catch( (err) => {
        console.error("[ERROR] Error in downloading page "+ data["filename"] + " from URL "+data["uri"]);
        console.error(err);
    });
 
}
exports.download = download;