const {
 suppliers
} = require("../../data");


function getSuppliers(req,res){

 res.json(suppliers);

}


function addSupplier(req,res){

 suppliers.push(req.body);

 res.json({
  message:"added"
 });

}

module.exports = {

 getSuppliers,

 addSupplier

};