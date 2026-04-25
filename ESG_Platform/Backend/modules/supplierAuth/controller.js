const jwt = require("jsonwebtoken");

const suppliers = [

 {
  id:1,
  email:"supplier@test.com",
  password:"123"
 }

];


function login(req,res){

 const user =
  suppliers.find(
   s=>s.email===req.body.email
  );


 const token =
  jwt.sign(
   {supplier_id:user.id},
   "secret"
  );


 res.json({token});

}

module.exports = { login };