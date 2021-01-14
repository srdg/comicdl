'use strict'

const cheerio = require("cheerio");
const zeropad = require("zeropad");
const fs = require("fs");

/**
 * Reads the HTML content and scours the DOM to get the URL(s) for each page of the comic.
 * @param {*} html the HTML content retrieved from parsing the parent constant `url`.
 */
const getJSONData = function (html) {
    // data to be returned
    var data = [];
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
                dest: './Book/' + i + ext
            }
        );
        // if(i - beg +1 == 5) break;
    }
    var JSONcontent = JSON.stringify(data, null, 2);
    fs.writeFileSync("./Pages.json", JSONcontent);
    // and return the whole thing
    return data;
}

exports.getJSONData = getJSONData;