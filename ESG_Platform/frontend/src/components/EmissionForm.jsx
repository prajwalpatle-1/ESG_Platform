import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { useState } from "react";

const scope1Schema = z.object({
  fuelType: z.enum(["Diesel", "Petrol", "LPG", "Natural Gas"]),
  quantityConsumed: z.number().min(0.01, "Quantity must be positive"),
  unit: z.enum(["Liters", "kg", "m³"]),
  sourceType: z.enum(["Vehicle", "Generator", "Boiler"]),
  date: z.string().min(1, "Date is required"),
  location: z.string().optional()
});

const scope2Schema = z.object({
  electricityConsumed: z.number().min(0.01, "Electricity must be positive"),
  energySource: z.enum(["Grid", "Solar", "Renewable"]),
  location: z.string().min(1, "Location is required"),
  billingPeriod: z.string().min(1, "Billing period is required"),
  date: z.string().min(1, "Date is required")
});

const scope3Schema = z.object({
  scope3Type: z.enum(["Transportation", "Purchased Goods", "Spend-Based", "Travel"]),
  distance: z.number().optional(),
  transportMode: z.string().optional(),
  quantityTransported: z.number().optional(),
  materialType: z.string().optional(),
  quantity: z.number().optional(),
  supplierName: z.string().optional(),
  amountSpent: z.number().optional(),
  category: z.string().optional(),
  travelType: z.string().optional(),
  date: z.string().min(1, "Date is required")
});

export default function EmissionForm() {
  const [selectedScope, setSelectedScope] = useState("scope1");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const scope1Form = useForm({ resolver: zodResolver(scope1Schema) });
  const scope2Form = useForm({ resolver: zodResolver(scope2Schema) });
  const scope3Form = useForm({ resolver: zodResolver(scope3Schema) });

  const onSubmitScope1 = async (data) => {
    setIsSubmitting(true);
    try {
      const calculatedEmission = data.quantityConsumed * 2.31;
      await axios.post("/api/activities", {
        activity_type: `scope1_${data.fuelType}`,
        value: calculatedEmission,
        scope: "Scope 1",
        fuelType: data.fuelType,
        sourceType: data.sourceType,
        location: data.location,
        date: data.date
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert("Scope 1 data submitted successfully!");
      scope1Form.reset();
    } catch (error) {
      console.error(error);
      alert("Error submitting data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitScope2 = async (data) => {
    setIsSubmitting(true);
    try {
      const calculatedEmission = data.electricityConsumed * 0.82;
      await axios.post("/api/activities", {
        activity_type: "scope2_electricity",
        value: calculatedEmission,
        scope: "Scope 2",
        energySource: data.energySource,
        location: data.location,
        date: data.date || data.billingPeriod + "-01"
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert("Scope 2 data submitted successfully!");
      scope2Form.reset();
    } catch (error) {
      console.error(error);
      alert("Error submitting data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitScope3 = async (data) => {
    setIsSubmitting(true);
    try {
      let calculatedEmission = 0;
      if (data.scope3Type === "Transportation") {
        calculatedEmission = data.distance * data.quantityTransported * 0.12;
      } else if (data.scope3Type === "Purchased Goods") {
        calculatedEmission = data.quantity * 0.15;
      } else if (data.scope3Type === "Spend-Based") {
        calculatedEmission = data.amountSpent * 0.0001;
      } else if (data.scope3Type === "Travel") {
        calculatedEmission = data.distance * 0.1;
      }
      
      await axios.post("/api/activities", {
        activity_type: `scope3_${data.scope3Type}`,
        value: calculatedEmission,
        scope: "Scope 3",
        ...data
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert("Scope 3 data submitted successfully!");
      scope3Form.reset();
    } catch (error) {
      console.error(error);
      alert("Error submitting data");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Emissions Data Entry</h2>

      {/* Scope Selector */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => setSelectedScope("scope1")}
          className={`p-4 rounded-lg font-semibold transition ${
            selectedScope === "scope1"
              ? "bg-red-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          🔴 Scope 1 - Direct Emissions
        </button>
        <button
          onClick={() => setSelectedScope("scope2")}
          className={`p-4 rounded-lg font-semibold transition ${
            selectedScope === "scope2"
              ? "bg-yellow-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          🟡 Scope 2 - Electricity
        </button>
        <button
          onClick={() => setSelectedScope("scope3")}
          className={`p-4 rounded-lg font-semibold transition ${
            selectedScope === "scope3"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          🔵 Scope 3 - Value Chain
        </button>
      </div>

      {/* Scope 1 Form */}
      {selectedScope === "scope1" && (
        <form onSubmit={scope1Form.handleSubmit(onSubmitScope1)} className="space-y-6">
          <div className="bg-red-50 border-l-4 border-red-600 p-4 mb-6">
            <p className="text-red-800 font-semibold">🔴 Scope 1 - Direct Emissions (Fuel)</p>
            <p className="text-red-700 text-sm">Fuel-based activities from owned sources</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Type *</label>
              <select
                {...scope1Form.register("fuelType")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Select fuel type</option>
                <option value="Diesel">Diesel</option>
                <option value="Petrol">Petrol</option>
                <option value="LPG">LPG</option>
                <option value="Natural Gas">Natural Gas</option>
              </select>
              {scope1Form.formState.errors.fuelType && (
                <p className="mt-1 text-sm text-red-600">{scope1Form.formState.errors.fuelType.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Consumed *</label>
              <input
                type="number"
                step="0.01"
                {...scope1Form.register("quantityConsumed", { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                placeholder="e.g., 100"
              />
              {scope1Form.formState.errors.quantityConsumed && (
                <p className="mt-1 text-sm text-red-600">{scope1Form.formState.errors.quantityConsumed.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
              <select
                {...scope1Form.register("unit")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Select unit</option>
                <option value="Liters">Liters</option>
                <option value="kg">kg</option>
                <option value="m³">m³</option>
              </select>
              {scope1Form.formState.errors.unit && (
                <p className="mt-1 text-sm text-red-600">{scope1Form.formState.errors.unit.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source Type *</label>
              <select
                {...scope1Form.register("sourceType")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Select source</option>
                <option value="Vehicle">Vehicle</option>
                <option value="Generator">Generator</option>
                <option value="Boiler">Boiler</option>
              </select>
              {scope1Form.formState.errors.sourceType && (
                <p className="mt-1 text-sm text-red-600">{scope1Form.formState.errors.sourceType.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date / Period *</label>
              <input
                type="month"
                {...scope1Form.register("date")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
              />
              {scope1Form.formState.errors.date && (
                <p className="mt-1 text-sm text-red-600">{scope1Form.formState.errors.date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location (Optional)</label>
              <input
                type="text"
                {...scope1Form.register("location")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                placeholder="e.g., Bangalore"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={scope1Form.formState.isSubmitting || isSubmitting}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {isSubmitting ? "Submitting..." : "Submit Scope 1 Data"}
          </button>
        </form>
      )}

      {/* Scope 2 Form */}
      {selectedScope === "scope2" && (
        <form onSubmit={scope2Form.handleSubmit(onSubmitScope2)} className="space-y-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-600 p-4 mb-6">
            <p className="text-yellow-800 font-semibold">🟡 Scope 2 - Indirect Energy (Electricity)</p>
            <p className="text-yellow-700 text-sm">Energy usage from purchased electricity</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Electricity Consumed (kWh) *</label>
              <input
                type="number"
                step="0.01"
                {...scope2Form.register("electricityConsumed", { valueAsNumber: true })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                placeholder="e.g., 500"
              />
              {scope2Form.formState.errors.electricityConsumed && (
                <p className="mt-1 text-sm text-red-600">{scope2Form.formState.errors.electricityConsumed.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Energy Source *</label>
              <select
                {...scope2Form.register("energySource")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
              >
                <option value="">Select source</option>
                <option value="Grid">Grid</option>
                <option value="Solar">Solar</option>
                <option value="Renewable">Renewable</option>
              </select>
              {scope2Form.formState.errors.energySource && (
                <p className="mt-1 text-sm text-red-600">{scope2Form.formState.errors.energySource.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
              <input
                type="text"
                {...scope2Form.register("location")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                placeholder="e.g., New Delhi"
              />
              {scope2Form.formState.errors.location && (
                <p className="mt-1 text-sm text-red-600">{scope2Form.formState.errors.location.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Billing Period *</label>
              <input
                type="month"
                {...scope2Form.register("billingPeriod")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
              />
              {scope2Form.formState.errors.billingPeriod && (
                <p className="mt-1 text-sm text-red-600">{scope2Form.formState.errors.billingPeriod.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                {...scope2Form.register("date")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
              />
              {scope2Form.formState.errors.date && (
                <p className="mt-1 text-sm text-red-600">{scope2Form.formState.errors.date.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={scope2Form.formState.isSubmitting || isSubmitting}
            className="w-full bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {isSubmitting ? "Submitting..." : "Submit Scope 2 Data"}
          </button>
        </form>
      )}

      {/* Scope 3 Form */}
      {selectedScope === "scope3" && (
        <form onSubmit={scope3Form.handleSubmit(onSubmitScope3)} className="space-y-6">
          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 mb-6">
            <p className="text-blue-800 font-semibold">🔵 Scope 3 - Value Chain Emissions</p>
            <p className="text-blue-700 text-sm">Supply chain and external activities</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type *</label>
            <select
              {...scope3Form.register("scope3Type")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select activity type</option>
              <option value="Transportation">📦 Transportation</option>
              <option value="Purchased Goods">🏭 Purchased Goods / Materials</option>
              <option value="Spend-Based">💰 Spend-Based</option>
              <option value="Travel">✈️ Travel / Misc</option>
            </select>
            {scope3Form.formState.errors.scope3Type && (
              <p className="mt-1 text-sm text-red-600">{scope3Form.formState.errors.scope3Type.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input
              type="date"
              {...scope3Form.register("date")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {scope3Form.formState.errors.date && (
              <p className="mt-1 text-sm text-red-600">{scope3Form.formState.errors.date.message}</p>
            )}
          </div>

          {/* Transportation */}
          {scope3Form.watch("scope3Type") === "Transportation" && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Distance (km) *</label>
                <input
                  type="number"
                  step="0.01"
                  {...scope3Form.register("distance", { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transport Mode *</label>
                <select
                  {...scope3Form.register("transportMode")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select mode</option>
                  <option value="Truck">Truck</option>
                  <option value="Ship">Ship</option>
                  <option value="Air">Air</option>
                  <option value="Rail">Rail</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Transported (tons) *</label>
                <input
                  type="number"
                  step="0.01"
                  {...scope3Form.register("quantityTransported", { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 2"
                />
              </div>
            </div>
          )}

          {/* Purchased Goods */}
          {scope3Form.watch("scope3Type") === "Purchased Goods" && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Material Type *</label>
                <select
                  {...scope3Form.register("materialType")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select material</option>
                  <option value="Steel">Steel</option>
                  <option value="Plastic">Plastic</option>
                  <option value="Cement">Cement</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (kg/tons) *</label>
                <input
                  type="number"
                  step="0.01"
                  {...scope3Form.register("quantity", { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 100"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
                <input
                  type="text"
                  {...scope3Form.register("supplierName")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., ABC Steel Ltd."
                />
              </div>
            </div>
          )}

          {/* Spend-Based */}
          {scope3Form.watch("scope3Type") === "Spend-Based" && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount Spent (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  {...scope3Form.register("amountSpent", { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 50000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                <select
                  {...scope3Form.register("category")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select category</option>
                  <option value="Logistics">Logistics</option>
                  <option value="Raw Materials">Raw Materials</option>
                  <option value="Packaging">Packaging</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          )}

          {/* Travel */}
          {scope3Form.watch("scope3Type") === "Travel" && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Travel Type *</label>
                <select
                  {...scope3Form.register("travelType")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select type</option>
                  <option value="Flight">Flight</option>
                  <option value="Cab">Cab</option>
                  <option value="Train">Train</option>
                  <option value="Bus">Bus</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Distance (km) *</label>
                <input
                  type="number"
                  step="0.01"
                  {...scope3Form.register("distance", { valueAsNumber: true })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., 500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={scope3Form.formState.isSubmitting || isSubmitting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {isSubmitting ? "Submitting..." : "Submit Scope 3 Data"}
          </button>
        </form>
      )}
    </div>
  );
}