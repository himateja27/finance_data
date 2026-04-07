import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

const Income = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [filters, setFilters] = useState({
    category: "",
    search: "",
  });

  const { hasPermission } = useAuth();
  const { triggerRefresh } = useData();

  const [formData, setFormData] = useState({
    amount: "",
    category: "",
    transaction_date: "",
    description: "",
  });

  const generateReferenceNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `TXN-${timestamp}-${random}`;
  };

  const categories = [
    { value: "salary", label: "Salary" },
    { value: "bonus", label: "Bonus" },
    { value: "investment", label: "Investment" },
    { value: "other", label: "Other" },
  ];

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const params = { record_type: "income" };
      if (filters.category) params.category = filters.category;
      if (filters.search) params.search = filters.search;

      const response = await api.get("/finance/records/", { params });
      setRecords(response.data.data || response.data || []);
    } catch (err) {
      setError("Failed to load income records");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setFormData({
      amount: "",
      category: "",
      transaction_date: "",
      description: "",
    });
    setError("");
    setSuccessMessage("");
  };

  const handleEditRecord = (record) => {
    setEditingRecord(record);
    setShowForm(true);
    setError("");
    setSuccessMessage("");
    setFormData({
      amount: record.amount,
      category: record.category,
      transaction_date: record.transaction_date,
      description: record.description || "",
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this income record?")) {
      try {
        await api.delete(`/finance/records/${id}/`);
        setSuccessMessage("Income record deleted successfully.");
        fetchRecords();
        triggerRefresh(); // Trigger dashboard refresh
      } catch (err) {
        setError("Failed to delete income record");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    // Validate required fields
    if (!formData.amount || !formData.category || !formData.transaction_date) {
      setError(
        "Please fill in all required fields: Amount, Category, and Date.",
      );
      return;
    }

    try {
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount),
        record_type: "income",
      };

      // Generate reference number for new records only
      if (!editingRecord) {
        submitData.reference_number = generateReferenceNumber();
      }

      if (editingRecord) {
        await api.patch(`/finance/records/${editingRecord.id}/`, submitData);
        setSuccessMessage("Income record updated successfully.");
      } else {
        await api.post("/finance/records/", submitData);
        setSuccessMessage("Income record added successfully.");
      }

      setShowForm(false);
      setEditingRecord(null);
      resetForm();
      fetchRecords();
      triggerRefresh(); // Trigger dashboard refresh
    } catch (err) {
      console.error("Save error:", err);
      const errorMsg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Failed to save income record.";
      setError(errorMsg);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl shadow-purple-900/20 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 px-6 py-8 sm:px-10 sm:py-10">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-green-100/90">
                    Income Management
                  </p>
                  <h1 className="mt-3 text-4xl font-semibold text-white">
                    Income Records
                  </h1>
                  <p className="mt-3 max-w-2xl text-green-100/80 text-sm sm:text-base">
                    Track and manage all your income transactions with detailed
                    records and analytics.
                  </p>
                </div>

                {hasPermission("manage_records") && (
                  <button
                    onClick={() => {
                      setShowForm(true);
                      setEditingRecord(null);
                      resetForm();
                    }}
                    className="inline-flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-white/20 transition hover:-translate-y-0.5 hover:bg-white/20"
                  >
                    <i className="fas fa-plus mr-2" />
                    Add Income
                  </button>
                )}
              </div>
            </div>

            <div className="px-6 py-8 sm:px-10 sm:py-10 space-y-8">
              {error && (
                <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-4 text-red-100">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="rounded-3xl border border-green-400/30 bg-green-500/10 p-4 text-green-100">
                  {successMessage}
                </div>
              )}

              {/* Filters */}
              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 backdrop-blur-sm p-6 shadow-xl shadow-slate-950/20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Category
                    </label>
                    <select
                      name="category"
                      value={filters.category}
                      onChange={handleFilterChange}
                      className="w-full rounded-xl border border-slate-600 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                    >
                      <option value="">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Search
                    </label>
                    <input
                      type="text"
                      name="search"
                      value={filters.search}
                      onChange={handleFilterChange}
                      placeholder="Search description..."
                      className="w-full rounded-xl border border-slate-600 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={() => setFilters({ category: "", search: "" })}
                      className="w-full rounded-xl bg-slate-700/50 px-4 py-3 text-white hover:bg-slate-600/50 transition"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>

              {/* Records Table */}
              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 backdrop-blur-sm shadow-xl shadow-slate-950/20 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-slate-200">
                    <thead className="bg-slate-800/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                          Date
                        </th>
                        <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                          Reference
                        </th>
                        <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                          Category
                        </th>
                        <th className="px-6 py-4 text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                          Description
                        </th>
                        <th className="px-6 py-4 text-right text-xs uppercase tracking-[0.2em] text-slate-400">
                          Amount
                        </th>
                        {hasPermission("manage_records") && (
                          <th className="px-6 py-4 text-center text-xs uppercase tracking-[0.2em] text-slate-400">
                            Actions
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                      {records.length > 0 ? (
                        records.map((record) => (
                          <tr
                            key={record.id}
                            className="hover:bg-white/5 transition"
                          >
                            <td className="px-6 py-4 text-white">
                              {formatDate(record.transaction_date)}
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-slate-300">
                              {record.reference_number || "N/A"}
                            </td>
                            <td className="px-6 py-4 text-white capitalize">
                              {record.category_display || record.category}
                            </td>
                            <td className="px-6 py-4 text-slate-300">
                              {record.description || "-"}
                            </td>
                            <td className="px-6 py-4 text-right text-green-400 font-semibold">
                              {formatCurrency(record.amount)}
                            </td>
                            {hasPermission("manage_records") && (
                              <td className="px-6 py-4 text-center">
                                <div className="flex justify-center gap-2">
                                  <button
                                    onClick={() => handleEditRecord(record)}
                                    className="rounded-lg bg-blue-600/20 px-3 py-1 text-blue-300 hover:bg-blue-600/30 transition"
                                  >
                                    <i className="fas fa-edit" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(record.id)}
                                    className="rounded-lg bg-red-600/20 px-3 py-1 text-red-300 hover:bg-red-600/30 transition"
                                  >
                                    <i className="fas fa-trash" />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={hasPermission("manage_records") ? 5 : 4}
                            className="px-6 py-8 text-center text-slate-400"
                          >
                            No income records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-3xl border border-slate-700 p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">
                {editingRecord ? "Edit Income Record" : "Add Income Record"}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingRecord(null);
                  resetForm();
                }}
                className="text-slate-400 hover:text-white transition"
              >
                <i className="fas fa-times text-xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Amount *
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleFormChange}
                  step="0.01"
                  min="0"
                  required
                  className="w-full rounded-xl border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Category *
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  required
                  className="w-full rounded-xl border border-slate-600 bg-slate-700/50 px-4 py-3 text-white focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  name="transaction_date"
                  value={formData.transaction_date}
                  onChange={handleFormChange}
                  required
                  className="w-full rounded-xl border border-slate-600 bg-slate-700/50 px-4 py-3 text-white focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  className="w-full rounded-xl border border-slate-600 bg-slate-700/50 px-4 py-3 text-white placeholder-slate-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  placeholder="Optional description"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-green-600 px-4 py-3 text-white font-semibold hover:bg-green-700 transition"
                >
                  {editingRecord ? "Update" : "Add"} Income
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingRecord(null);
                    resetForm();
                  }}
                  className="flex-1 rounded-xl bg-slate-600 px-4 py-3 text-white font-semibold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Income;
