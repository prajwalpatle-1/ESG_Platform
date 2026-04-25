let credits = [];

function buyCredits(amount){

 credits.push({

  amount,

  timestamp:Date.now()

 });

}


function totalCredits(){

 return credits.reduce(

  (sum,c)=>sum+c.amount,

  0

 );

}


module.exports = {

 buyCredits,

 totalCredits

};