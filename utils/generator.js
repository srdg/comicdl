'use strict'

const PDFDocument = require('pdfkit');
const fs = require('fs');

/**
 * Reads the JSON file, takes the images, adds them and generates a PDF file.
 * @param {*} srcfile The source JSON file with information about the images. Each image location must be under the key "dest".
 * @param {*} destfile The path to the PDF file to be generated.
 * @returns the generated PDF file path
 */
const generate = function(srcfile, destfile) {
    var pdf = new PDFDocument ({autoFirstPage:false});
    pdf.pipe(fs.createWriteStream(destfile));
    
    const rawdata = fs.readFileSync(srcfile);
    const pages = JSON.parse(rawdata);

    pages.forEach(element => {
        var img = pdf.openImage(element['dest']);
        pdf.addPage({size: [img.width, img.height]});
        pdf.image(img, 0, 0);       
    });
    pdf.end(); 
    console.log("PDF file created as "+destfile);
    return destfile;
};

exports.generate = generate;