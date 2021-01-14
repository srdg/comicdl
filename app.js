// Import required modules
const Nightmare = require("nightmare");
const fs = require("fs");
const pagereader = require("./utils/pagereader")
const generator = require("./utils/generator");
const downloader = require("./utils/downloader");

const nightmare = Nightmare({ 
    // Uncomment the following line to see the browser instance
   // show : true 
});

// location to where the pages will be stored
const dest = "./Book";

/**
 * Parses the url for the comic, downloads the pages and adds all of them to a PDF file.
 * @param {*} url The url from where the comic should be parsed. 
 */
function getManga(res, url){
    var destfile = nightmare 
    .goto(url) // go to the url
    .wait('body') // wait for the whole body to load
    .evaluate( ()=>document.querySelector('body').innerHTML) // validate the HTML content is present
    .end() // kill the browser instance
    .then((response) => { // take the response
        /**
         * Pass this response to get the JSON data.
         * The JSON contains a page number of the comic and an url.
         * Take the JSON, and pass it to processJSONData for further processing.
         */
        return pagereader.getJSONData(response);
    })
    .then((data) => {
        return downloader.download(data);
    })
    .then(() => {
        console.log(" Inside createFile then block ");
        var filename = url.slice(url.indexOf("comics")+7, url.length-1).replace("/","_")+".pdf";
        return generator.generate('./Pages.json', filename);
    })
    .then((pdffile) => {
        console.log("Sending file "+pdffile + " to client...")
        filepath = path.resolve(pdffile);
        console.log("File on server is located at "+filepath);
        return filepath;
    })
    .catch(err => { // catch the errors
        console.log(err);  // and log on the console
        return null;
    });

    return destfile;
}


const http = require("http");
const express = require("express");
const path = require("path");
const querystring = require("querystring");


const app = express();
const server = http.createServer(app);
app.use(express.static(path.join(__dirname,'./public')));


app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname, './public/index.html'));
});

app.get('/download-comic', function(request, response){
    console.log(request._parsedOriginalUrl["query"]);
    var query = request._parsedOriginalUrl["query"];
    var uri = query.slice(query.indexOf('=')+1,query.length);
    var url = querystring.unescape(uri.toString());
    console.log("Decoding querystring "+url);
    getManga(response, url).then((destfile) => {
        console.log("File returned : "+destfile);
        var stream = fs.createReadStream(destfile);
        response.setHeader('Content-disposition', 'inline; filename="download.pdf"');
        response.setHeader('Content-type', 'application/pdf');
        stream.pipe(response);
    });
    
});

server.listen(3000, function(){
    console.log("server is listening on port: 3000");
  });
