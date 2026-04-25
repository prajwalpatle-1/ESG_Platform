const PDFDocument =
 require("pdfkit");

const fs =
 require("fs");


function createPDF(data){

 const doc =
  new PDFDocument();


 doc.pipe(
  fs.createWriteStream(
   "report.pdf"
  )
 );


 doc.fontSize(20)
  .text(
   "ESG REPORT"
  );


 data.forEach(r=>{

  doc.text(

   `${r.activity_type}
   ${r.emission}`

  );

 });


 doc.end();

}


module.exports = createPDF;