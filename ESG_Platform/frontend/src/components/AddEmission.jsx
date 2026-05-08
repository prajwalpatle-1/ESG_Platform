import { useState } from "react";
import axios from "axios";

export default function AddEmission(){
  const [scope, setScope] = useState("scope1");
  const [formData, setFormData] = useState({
    fuelType: "Diesel",
    quantityConsumed: "",
    electricityConsumed: "",
    energySource: "Grid",
    eWasteType: "Electronics",
    eWasteQuantity: "",
    date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const submit = async () => {
    if (scope === "scope1" && !formData.quantityConsumed) {
      alert("Please enter a fuel quantity");
      return;
    }
    if (scope === "scope2" && !formData.electricityConsumed) {
      alert("Please enter electricity consumption");
      return;
    }
    if (scope === "scope3" && !formData.eWasteQuantity) {
      alert("Please enter the e-waste quantity");
      return;
    }

    setLoading(true);
    try {
      let activity_type;
      let value;
      let scopeLabel;

      if (scope === "scope1") {
        activity_type = `quick_fuel_${formData.fuelType}`;
        value = parseFloat(formData.quantityConsumed);
        scopeLabel = "Scope 1";
      } else if (scope === "scope2") {
        activity_type = "quick_electricity";
        value = parseFloat(formData.electricityConsumed);
        scopeLabel = "Scope 2";
      } else {
        activity_type = "scope3_eWaste";
        value = parseFloat(formData.eWasteQuantity);
        scopeLabel = "Scope 3";
      }
      
      await axios.post("/api/activities", {
        activity_type,
        value,
        scope: scopeLabel,
        date: formData.date
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      alert("Emission data added successfully!");
      setFormData({ fuelType: "Diesel", quantityConsumed: "", electricityConsumed: "", energySource: "Grid", eWasteType: "Electronics", eWasteQuantity: "", date: new Date().toISOString().split('T')[0] });
    } catch (error) {
      console.error(error);
      alert("Error adding emission data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Emission Entry</h2>
      
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setScope("scope1")}
          className={`flex-1 py-2 px-3 rounded-md font-medium transition ${
            scope === "scope1" 
              ? "bg-red-600 text-white" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          🔴 Scope 1
        </button>
        <button
          onClick={() => setScope("scope2")}
          className={`flex-1 py-2 px-3 rounded-md font-medium transition ${
            scope === "scope2" 
              ? "bg-yellow-600 text-white" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          🟡 Scope 2
        </button>
        <button
          onClick={() => setScope("scope3")}
          className={`flex-1 py-2 px-3 rounded-md font-medium transition ${
            scope === "scope3" 
              ? "bg-blue-600 text-white" 
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          🔵 Scope 3
        </button>
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500"
        />
      </div>

      {scope === "scope1" ? (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type</label>
            <select
              name="fuelType"
              value={formData.fuelType}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500"
            >
              <option>Diesel</option>
              <option>Petrol</option>
              <option>LPG</option>
              <option>Natural Gas</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (Liters)</label>
            <input
              type="number"
              name="quantityConsumed"
              value={formData.quantityConsumed}
              onChange={handleInputChange}
              placeholder="e.g., 100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500"
            />
          </div>
        </div>
      ) : scope === "scope2" ? (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Electricity (kWh)</label>
            <input
              type="number"
              name="electricityConsumed"
              value={formData.electricityConsumed}
              onChange={handleInputChange}
              placeholder="e.g., 500"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Energy Source</label>
            <select
              name="energySource"
              value={formData.energySource}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500"
            >
              <option>Grid</option>
              <option>Solar</option>
              <option>Renewable</option>
            </select>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-Waste Category</label>
            <select
              name="eWasteType"
              value={formData.eWasteType}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
            >
              <option>Electronics</option>
              <option>Batteries</option>
              <option>Plastic Components</option>
              <option>Mixed Waste</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-Waste Weight (tons)</label>
            <input
              type="number"
              name="eWasteQuantity"
              value={formData.eWasteQuantity}
              onChange={handleInputChange}
              placeholder="e.g., 0.5"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
            />
          </div>
        </div>
      )}

      <button 
        onClick={submit}
        disabled={loading}
        className="w-full mt-4 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 font-semibold"
      >
        {loading ? "Adding..." : "Add Emission"}
      </button>
      
      <p className="text-xs text-gray-500 mt-3 text-center">For detailed entry with all fields, use the Emission Form page</p>
    </div>
  );
}