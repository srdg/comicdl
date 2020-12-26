// Import required modules
const Nightmare = require("nightmare");
const cheerio = require("cheerio");
const zeropad = require("zeropad");
const download = require("image-downloader");

const nightmare = Nightmare({ 
    // Uncomment the following line to see the browser instance
   // show : true 
});
// Parent url from where the data will be parsed
const url = "https://www.omgbeaupeep.com/comics/Avatar_The_Last_Airbender/001/";

nightmare // It is!
    .goto(url) // go to the url
    .wait('body') // wait for the whole body to load
    .evaluate( ()=>document.querySelector('body').innerHTML) // validate the HTML content is present
    .end() // kill the browser instance
    .then(response => { // now take the response
        /**
         * Take this response and pass it to get the JSON data.
         * The JSON consists of 2 things, a page number of the comic and an url to it.
         * Take this JSON, and pass it to processJSONData for further processing as a callback.
         */
        processJSONData(response, getJSONData(response)); 
    })
    .catch(err => { // catch the errors
        console.log(err);  // and put 'em all on the console
    });
       

/**
 * Parses the JSON data and downloads the images from the given URL(s).  
 * Saves the images in the directory `./Book` with the page number for each file.
 * @param {*} response the HTTP response object
 * @param {*} data the JSON data containing the detailed information about the comic book pages
 */
function processJSONData(response, data){
    console.log("Processing JSON data. Content follows."); 
    console.log(data); // Log the JSON contents just to flex
    data.forEach(element => {   // for each of the objects,
        download.image(element) // download the image asynchronously 
        .then(({ filename }) => { // and log when the image is downloaded
        process.stdout.write('Saving to', filename); // not using console.log because it adds \n, always
        })
        .then ( () => {
        console.log("done."); // yeah, me too
        })
        .catch((err) => console.error(err)); // if any error comes, you know what to do
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
    var src = "https://www.omgbeaupeep.com/comics/" + $('[class=picture]')[0].attribs['src'];
    var len = $('[name=page]')[0].children.length; // gives you number of pages for the comic
    var hyphenIdx = src.lastIndexOf('-'); // this will come in handy later
    var dotIndex = src.lastIndexOf('.'); //==============ditto=============
    var num = src.slice(hyphenIdx + 1, dotIndex); // this gives the first page as is in url (e.g. 0001)
    var baseurl = src.slice(0, hyphenIdx + 1); // this gives the complete base url
    var ext = src.slice(dotIndex, src.length); // this gives you the file extension (e.g. .jpg, .png)
    var beg = parseInt(num); // this is the first page number as an integer

    // start from `beg` since we don't know what the first page number is
    // and continue till `beg+len`
    for (var i = beg; i < beg + len; i++) { 
        // form the URL. Zeropad is used to pad the integer before it gets appeneded to the string
        var urlc = baseurl + zeropad(i, num.length) + ext;
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