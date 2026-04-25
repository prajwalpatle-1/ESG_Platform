import React, { useEffect, useState } from "react";
import { getSuppliers, addSupplier, socket } from "../services/api";

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "Electronics", // Default category
    location: "",
    emissions: "",
    change: ""
  });

  const fetchSuppliers = () => {
    getSuppliers()
      .then(res => setSuppliers(res.data))
      .catch(err => console.error('Error fetching suppliers:', err));
  };

  useEffect(() => {
    fetchSuppliers();

    socket.on('supplierAdded', () => {
      fetchSuppliers();
    });

    return () => {
      socket.off('supplierAdded');
    };
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await addSupplier({
        ...formData,
        emissions: Number(formData.emissions),
        change: Number(formData.change)
      });
      
      // Success! Close modal and reset form
      setIsModalOpen(false);
      setFormData({ name: "", category: "Electronics", location: "", emissions: "", change: "" });
      alert("Supplier added successfully!");
    } catch (error) {
      console.error(error);
      const serverMessage = error.response?.data?.message || error.message;
      alert(`Failed to add supplier: ${serverMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalEmissions = suppliers.reduce((sum, item) => sum + Number(item.emissions || 0), 0);
  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-700">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-green-600 dark:text-green-400">Supplier Insights</p>
            <h1 className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">Supplier emissions portfolio</h1>
            <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-2xl">
              Review supplier emissions and identify high-risk partners for targeted engagement.
            </p>
          </div>
          <div className="flex flex-col items-end gap-4">
            <div className="rounded-3xl bg-gray-50 p-4 text-right dark:bg-gray-950 w-full md:w-auto">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total supplier emissions</p>
              <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{totalEmissions} tCO₂e</p>
            </div>
            
            {/* ADD SUPPLIER BUTTON */}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 transition shadow-md shadow-green-500/20"
            >
              + Add Supplier
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-xl ring-1 ring-gray-200 dark:bg-gray-900 dark:ring-gray-700 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-950">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Supplier</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Category</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Location</th>
              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Emissions</th>
              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-950">
            {suppliers.map((supplier) => (
              <tr key={supplier.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/60">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{supplier.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{supplier.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{supplier.location || 'Unknown'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">{supplier.emissions} tCO₂e</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    supplier.change > 0 
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                  }`}>
                    {supplier.change > 0 ? '+' : ''}{supplier.change || 0}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL OVERLAY */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add New Supplier</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name</label>
                <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-green-500 outline-none dark:text-white" placeholder="e.g., GreenTech Corp" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select name="category" value={formData.category} onChange={handleInputChange} className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-green-500 outline-none dark:text-white">
                    <option>Electronics</option>
                    <option>Logistics</option>
                    <option>Energy</option>
                    <option>Materials</option>
                    <option>Manufacturing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                  <input required type="text" name="location" value={formData.location} onChange={handleInputChange} className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-green-500 outline-none dark:text-white" placeholder="e.g., Nagpur, India" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Emissions (tCO₂e)</label>
                  <input required type="number" name="emissions" value={formData.emissions} onChange={handleInputChange} className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-green-500 outline-none dark:text-white" placeholder="e.g., 450" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Trend (%)</label>
                  <input required type="number" step="0.1" name="change" value={formData.change} onChange={handleInputChange} className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-green-500 outline-none dark:text-white" placeholder="e.g., -5.2" />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700 transition shadow-md shadow-green-500/20 disabled:opacity-50">
                  {isSubmitting ? "Saving..." : "Save Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}