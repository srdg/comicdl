// Import required modules
const Nightmare = require("nightmare");
const cheerio = require("cheerio");
const zeropad = require("zeropad");
const download = require("image-downloader");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const request = require("request");

const nightmare = Nightmare({ 
    // Uncomment the following line to see the browser instance
   // show : true 
});
// Parent url from where the data will be parsed
const url = "https://www.omgbeaupeep.com/comics/Avatar_The_Last_Airbender/005/";

nightmare 
    .goto(url) // go to the url
    .wait('body') // wait for the whole body to load
    .evaluate( ()=>document.querySelector('body').innerHTML) // validate the HTML content is present
    .end() // kill the browser instance
    .then(response => { // take the response
        /**
         * Pass this response to get the JSON data.
         * The JSON contains a page number of the comic and an url.
         * Take the JSON, and pass it to processJSONData for further processing.
         */
        data = getJSONData(response);
        processJSONData(data);
    })
    .catch(err => { // catch the errors
        console.log(err);  // and log on the console
    });

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
                url: urlc,
                dest: "./Book/" + i + ext
            }
        );
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

    // Use promises instead of forEach to synchronize download and creation of PDF
    var promises = data.map(function(element){ // map this function to each JSON object
        const maxTimeToWait = 40000;
        return Promise.race([download.image(element) // return the return value of inner callbacks, trigger download
        .then( ({filename}) => { // and then take the filename
            console.log("Saved to ",filename); // log message
            return filename; // and return the path to where the file was saved
        }), timeout(maxTimeToWait, element)]);
    });

    // Synchronized version of creating PDF
    Promise.all(promises).
    then(function (data){ // once all promises are resolved, take the filenames
        // get the comic name
        var mangaName = url.slice(url.indexOf("comics")+7, url.length-1).replace("/","_")+".pdf";
        var pdfdoc = new PDFDocument;
        pdfdoc.pipe(fs.createWriteStream(mangaName));
        console.log(data.toString().split(","));
        // can use forEach here since all image dowloads should be resolved
        data.toString().split(",").forEach(page => {
            // console.log(page.toString());
            pdfdoc.addPage();
            pdfdoc.image(page, {scale:0.45, align:'center', valign:'center'}); 
        });
        pdfdoc.end();
        return mangaName;
    }).then( (mangaName) => {
        console.log("Created PDF file: "+mangaName);
    })
    .catch ((error) => { // if any error occurs
        console.error(error); // handle by logging on stdout
    });
}

/**
 * Resolve the promise with the `element` after `t` seconds pass
 * @param {*} t the timeout duration
 * @param {*} element each element of the JSON object
 */
function timeout(t, element) {
    return new Promise(resolve => {
        // resolve this promise with whatever image content is available till now
        setTimeout(resolve, t, element["dest"]);
    });
}