function calculateESGScore(data){

 const totalEmission =
  data.reduce(
   (sum,r)=>sum+r.emission,
   0
  );


 let score = 100;


 if(totalEmission>10000)
  score -= 20;

 if(totalEmission>20000)
  score -= 30;


 return {

  score,

  rating:

   score>80 ? "A" :
   score>60 ? "B" :
   "C"

 };

}


module.exports = {

 calculateESGScore

};