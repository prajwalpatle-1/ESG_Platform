const {
 emissionFactors
} = require("../../data");


function simulateRenewable(percent){

 const electricityUsage =
  12000;

 const gridFactor =
  emissionFactors.electricity.factor;

 const renewableFactor =
  0.1;


 const baseEmission =
  electricityUsage *
  gridFactor;


 const improved =
  electricityUsage *
  (percent/100) *
  renewableFactor;


 return {

  reduction:

   baseEmission -
   improved

 };

}

module.exports = {

 simulateRenewable

};