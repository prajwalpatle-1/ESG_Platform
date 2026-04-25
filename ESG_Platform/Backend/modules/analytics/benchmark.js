function benchmark(company,industry){

 return {

  performance:

   company.totalEmission <
   industry.average

   ? "above average"

   : "below average"

 };

}

module.exports = {

 benchmark

};