const multer =
 require("multer");

const xlsx =
 require("xlsx");

const { v4:uuid } =
 require("uuid");

const pool =
 require("../../config/db");


const upload =
 multer({
  dest:"uploads/"
 });


async function uploadExcel(req,res){

 const workbook =
  xlsx.readFile(
   req.file.path
  );

 const sheet =
  workbook.Sheets[
   workbook.SheetNames[0]
  ];


 const rows =
  xlsx.utils.sheet_to_json(
   sheet
  );

  router.post(

 "/supplier/emissions",

 verifySupplierToken,

 async(req,res)=>{

  await saveSupplierEmission(

   req.body

  );

  res.json({success:true});

 }

);


 for(const row of rows){

  await pool.query(

   `
   INSERT INTO emissions

   VALUES
   (
    $1,$2,$3,$4,$5,$6,now()
   )
   `,

   [

    uuid(),

    req.user.company_id,

    row.activity_type,

    row.value,

    row.scope,

    row.value * 0.82

   ]

  );

 }


 res.json({
  message:"uploaded"
 });

}


module.exports = {

 upload,
 uploadExcel

};