const {
 activityData
} = require("../../data");

const {
 calculateEmission
} =
 require("../emissions/service");


function generateReport(req,res){

 const result =
  activityData.map(
   calculateEmission
  );

 const totals = {

  scope1:0,

  scope2:0,

  scope3:0

 };


 result.forEach(r=>{

  if(r.scope==="Scope 1")
   totals.scope1 += r.emission;

  if(r.scope==="Scope 2")
   totals.scope2 += r.emission;

  if(r.scope==="Scope 3")
   totals.scope3 += r.emission;

 });

 res.json({

  company:"Demo Corp",

  totals,

  result

 });

}

module.exports = {

 generateReport

};