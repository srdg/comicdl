// Import required modules
const Nightmare = require("nightmare");
const cheerio = require("cheerio");
const zeropad = require("zeropad");
const download = require("./utils/download");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const Bottleneck = require("bottleneck/es5");


const nightmare = Nightmare({ 
    // Uncomment the following line to see the browser instance
   // show : true 
});

const limiter = new Bottleneck({
    maxConcurrent: 1,
    minTime: 333
  });

// location to where the pages will be stored
const dest = "./Book";

/**
 * Parses the url for the comic, downloads the pages and adds all of them to a PDF file.
 * @param {*} url The url from where the comic should be parsed. 
 */
function getManga(url){
    nightmare 
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
        return getJSONData(response);
    })
    .then((data) => {
        return limiter.schedule(() => processJSONData(data));
    })
    .then((pages) => {
        console.log(" Inside createFile then block ");
        console.log(pages.toString().split(","));
        var mangaName = createFile(url, pages);
        return mangaName;
    })
    .then((mangaName) => {
        console.log("Promise resolved! Manganme is ./"+mangaName);
        return "./"+mangaName;
    })
    .catch(err => { // catch the errors
        console.log(err);  // and log on the console
    });
}

/**
 * Reads the HTML content and scours the DOM to get the URL(s) for each page of the comic.
 * @param {*} html the HTML content retrieved from parsing the parent constant `url`.
 */
function getJSONData(html) {
    // data to be returned
    data = [];
    // load the HTML content
    const $ = cheerio.load(html);
    // and now it's time to hack, slice and dice the content to get what we need
    // src will contain the path to the comic page on server
    var src = "https://www.omgbeaupeep.com/comics/" + $('[class=picture]')[0].attribs['src'];
    var len = $('[name=page]')[0].children.length; // gives you number of pages for the comic
    var hyphenIdx = src.lastIndexOf('-'); // this will come in handy later
    var dotIndex = src.lastIndexOf('.'); //==============ditto=============
    var num = src.slice(hyphenIdx + 1, dotIndex); // this gives the first page as is in url (e.g. 0001)
    var pad = num.length; // this is the length of num as is in url, (e.g. 0001 will give a pad 4)
    var baseurl = src.slice(0, hyphenIdx + 1); // this gives the complete base url
    var ext = src.slice(dotIndex, src.length); // this gives you the file extension (e.g. .jpg, .png)
    var beg = parseInt(num); // this is the first page number as an integer


    // start from `beg` since we don't know what the first page number is
    // and continue till `beg+len`
    for (var i = beg; i < beg + len; i++) { 
        // form the URL. Zeropad is used to pad the integer before it gets appeneded to the string
        var urlc = baseurl + zeropad(i, pad) + ext;
        // put it in the data
        data.push(
            {
                uri: urlc,
                filename: './Book/' + i + ext
            }
        );
        if(i - beg +1 == 1) break;
    }
    // and return the whole thing
    return data;
}

/**
 * Parses the JSON data and downloads the images from the given URL(s).  
 * Saves the images in the directory `./Book` with the page number for each file.
 * @param {*} data the JSON data containing the detailed information about the comic book pages
 */
function processJSONData(data){
    console.log("Processing JSON data. Content follows."); 
    console.log(data); // Log the JSON contents just to flex

    // map() instead of forEach() to get a promise per request
    const reqs = download(data)
    .then( (info) => {
            console.log(" Download complete! \n",info); 
            return info;
    });
    // wait for all of them to be finished
    return reqs;
}

/**
 * Create the PDF file from the pages
 * @param {*} data the list of pages to be added to the comic
 */
function createFile(url, data){
    // Synchronized version of creating PDF
    var pdfdoc = new PDFDocument;
    // get the comic name
    var mangaName = url.slice(url.indexOf("comics")+7, url.length-1).replace("/","_")+".pdf";
    pdfdoc.pipe(fs.createWriteStream(mangaName));
    var pagelist = data.toString().split(",");
    // Add a new page and create the PDF by adding each image per page
    const pages = pagelist.map(page => {
        // console.log(page.toString());
        pdfdoc.addPage();
        pdfdoc.image(page, {scale:0.45, align:'center', valign:'center'}); 
        
    });
    // Once all pages are finished, mark the end of document, log and return the filename
    Promise.all(pages).then(() => {
        pdfdoc.end();
    }).then( () => {
        console.log("PDF file created : "+mangaName);
        return mangaName;
    })
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

app.get('/manga', function(request, response){
    console.log(request._parsedOriginalUrl["query"]);
    var query = request._parsedOriginalUrl["query"];
    var uri = query.slice(query.indexOf('=')+1,query.length);
    var url = querystring.unescape(uri.toString());
    console.log("Decoding querystring "+url);
    var mangaRes = getManga(url);

    Promise.resolve(mangaRes)
    .then( (request, response) => {
        var mangaName = url.slice(url.indexOf("comics")+7, url.length-1).replace("/","_")+".pdf";
        var tempFile='./' + mangaName;
        fs.readFile(tempFile, function (err,data){
           response.contentType("application/pdf");
           response.send(data);
        });
    })
});

server.listen(3000, function(){
    console.log("server is listening on port: 3000");
  });