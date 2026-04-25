const axios = require("axios");

async function fetchEnergyUsage(){

 const response =
  await axios.get(

   "https://api.energy.com/usage"

  );


 return response.data;

}

module.exports = {

 fetchEnergyUsage

};