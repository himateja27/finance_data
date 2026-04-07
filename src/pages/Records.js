import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

const Records = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [filters, setFilters] = useState({
    record_type: "",
    category: "",
    search: "",
  });

  const { hasPermission } = useAuth();
  const { triggerRefresh } = useData();

  const [formData, setFormData] = useState({
    amount: "",
    record_type: "income",
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

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.record_type) params.record_type = filters.record_type;
      if (filters.category) params.category = filters.category;
      if (filters.search) params.search = filters.search;

      const response = await api.get("/finance/records/", { params });
      setRecords(response.data.data || response.data || []);
    } catch (err) {
      setError("Failed to load records");
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
      };

      // Generate reference number for new records only
      if (!editingRecord) {
        submitData.reference_number = generateReferenceNumber();
      }

      if (editingRecord) {
        await api.patch(`/finance/records/${editingRecord.id}/`, submitData);
      } else {
        await api.post("/finance/records/", submitData);
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
        err.response?.data?.non_field_errors?.join(", ") ||
        "Failed to save record. Please check your inputs.";
      setError(errorMsg);
    }
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    setFormData({
      amount: record.amount,
      record_type: record.record_type,
      category: record.category,
      transaction_date: record.transaction_date,
      description: record.description,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      try {
        await api.delete(`/finance/records/${id}/`);
        fetchRecords();
        triggerRefresh(); // Trigger dashboard refresh
      } catch (err) {
        setError("Failed to delete record");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      amount: "",
      record_type: "income",
      category: "",
      transaction_date: "",
      description: "",
    });
  };

  const categories = [
    { value: "salary", label: "Salary" },
    { value: "bonus", label: "Bonus" },
    { value: "investment", label: "Investment" },
    { value: "rent", label: "Rent" },
    { value: "utilities", label: "Utilities" },
    { value: "food", label: "Food" },
    { value: "transportation", label: "Transportation" },
    { value: "entertainment", label: "Entertainment" },
    { value: "healthcare", label: "Healthcare" },
    { value: "education", label: "Education" },
    { value: "other", label: "Other" },
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl shadow-purple-900/20 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 px-6 py-8 sm:px-10 sm:py-10">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-pink-100/90">
                    Financial Records
                  </p>
                  <h1 className="mt-3 text-4xl font-semibold text-white">
                    Transaction History
                  </h1>
                  <p className="mt-3 max-w-2xl text-purple-100/80 text-sm sm:text-base">
                    Track your income and expenses with detailed transaction
                    records.
                  </p>
                </div>

                {hasPermission("manage_records") && (
                  <button
                    className="inline-flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-white/20 transition hover:-translate-y-0.5 hover:bg-white/20"
                    onClick={() => {
                      setShowForm(true);
                      setEditingRecord(null);
                      resetForm();
                    }}
                  >
                    <i className="fas fa-plus mr-2" />
                    Add Record
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

              {/* Filters */}
              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 backdrop-blur-sm p-6 shadow-xl shadow-slate-950/20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-2">
                      Record Type
                    </label>
                    <select
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition appearance-none"
                      name="record_type"
                      value={filters.record_type}
                      onChange={handleFilterChange}
                    >
                      <option value="" className="bg-slate-800 text-white">
                        All Types
                      </option>
                      <option
                        value="income"
                        className="bg-slate-800 text-white"
                      >
                        Income
                      </option>
                      <option
                        value="expense"
                        className="bg-slate-800 text-white"
                      >
                        Expense
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-2">
                      Category
                    </label>
                    <select
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition appearance-none"
                      name="category"
                      value={filters.category}
                      onChange={handleFilterChange}
                    >
                      <option value="" className="bg-slate-800 text-white">
                        All Categories
                      </option>
                      {categories.map((cat) => (
                        <option
                          key={cat.value}
                          value={cat.value}
                          className="bg-slate-800 text-white"
                        >
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-200 mb-2">
                      Search
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <i className="fas fa-search text-slate-400"></i>
                      </div>
                      <input
                        type="text"
                        className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                        placeholder="Search description..."
                        name="search"
                        value={filters.search}
                        onChange={handleFilterChange}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Add/Edit Form */}
              {showForm && (
                <div className="rounded-[1.75rem] border border-white/10 bg-white/5 backdrop-blur-sm p-6 shadow-xl shadow-slate-950/20">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl px-6 py-4 mb-6">
                    <h5 className="text-white font-semibold flex items-center gap-2">
                      <i className="fas fa-edit" />
                      {editingRecord ? "Edit Record" : "Add New Record"}
                    </h5>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-200 mb-2">
                          Amount
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                          name="amount"
                          value={formData.amount}
                          onChange={handleFormChange}
                          placeholder="Enter amount"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-200 mb-2">
                          Type
                        </label>
                        <select
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition appearance-none"
                          name="record_type"
                          value={formData.record_type}
                          onChange={handleFormChange}
                          required
                        >
                          <option
                            value="income"
                            className="bg-slate-800 text-white"
                          >
                            Income
                          </option>
                          <option
                            value="expense"
                            className="bg-slate-800 text-white"
                          >
                            Expense
                          </option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-200 mb-2">
                          Category
                        </label>
                        <select
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition appearance-none"
                          name="category"
                          value={formData.category}
                          onChange={handleFormChange}
                          required
                        >
                          <option value="" className="bg-slate-800 text-white">
                            Select Category
                          </option>
                          {categories.map((cat) => (
                            <option
                              key={cat.value}
                              value={cat.value}
                              className="bg-slate-800 text-white"
                            >
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-200 mb-2">
                          Transaction Date
                        </label>
                        <input
                          type="date"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                          name="transaction_date"
                          value={formData.transaction_date}
                          onChange={handleFormChange}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-200 mb-2">
                        Description
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                        name="description"
                        value={formData.description}
                        onChange={handleFormChange}
                        placeholder="Enter description"
                        required
                      />
                    </div>

                    <div className="flex gap-4">
                      <button
                        type="submit"
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-2xl transition-all duration-200 transform hover:scale-105 hover:shadow-xl shadow-lg"
                      >
                        <i className="fas fa-save mr-2"></i>
                        {editingRecord ? "Update" : "Save"}
                      </button>
                      <button
                        type="button"
                        className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-2xl hover:bg-white/20 transition-all duration-200 transform hover:scale-105"
                        onClick={() => {
                          setShowForm(false);
                          setEditingRecord(null);
                        }}
                      >
                        <i className="fas fa-times mr-2"></i>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Records Table */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
                </div>
              ) : (
                <div className="rounded-[1.75rem] border border-white/10 bg-white/5 backdrop-blur-sm shadow-xl shadow-slate-950/20">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-slate-200">
                      <thead className="text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                        <tr>
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4">Reference</th>
                          <th className="px-6 py-4">Description</th>
                          <th className="px-6 py-4">Category</th>
                          <th className="px-6 py-4">Type</th>
                          <th className="px-6 py-4">Amount</th>
                          <th className="px-6 py-4">Status</th>
                          {hasPermission("manage_records") && (
                            <th className="px-6 py-4">Actions</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {records.map((record) => (
                          <tr
                            key={record.id}
                            className="hover:bg-white/5 transition"
                          >
                            <td className="px-6 py-4 font-medium text-white">
                              {record.transaction_date}
                            </td>
                            <td className="px-6 py-4 font-mono text-xs text-slate-300">
                              {record.reference_number || "N/A"}
                            </td>
                            <td className="px-6 py-4 text-slate-200">
                              {record.description}
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-200 capitalize">
                                {record.category}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                  record.record_type === "income"
                                    ? "bg-emerald-500/20 text-emerald-200"
                                    : "bg-rose-500/20 text-rose-200"
                                }`}
                              >
                                {record.record_type}
                              </span>
                            </td>
                            <td
                              className={`px-6 py-4 text-sm font-bold ${
                                record.record_type === "income"
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              ${Number(record.amount || 0).toFixed(2)}
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex rounded-full bg-slate-500/20 px-3 py-1 text-xs font-semibold text-slate-300">
                                {record.status || "Active"}
                              </span>
                            </td>
                            {hasPermission("manage_records") && (
                              <td className="px-6 py-4">
                                <div className="flex gap-2">
                                  <button
                                    className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded-lg text-xs font-medium transition"
                                    onClick={() => handleEdit(record)}
                                  >
                                    <i className="fas fa-edit mr-1"></i>
                                    Edit
                                  </button>
                                  <button
                                    className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg text-xs font-medium transition"
                                    onClick={() => handleDelete(record.id)}
                                  >
                                    <i className="fas fa-trash mr-1"></i>
                                    Delete
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {records.length === 0 && (
                    <div className="text-center py-12">
                      <i className="fas fa-receipt text-4xl text-slate-500 mb-4"></i>
                      <p className="text-slate-400">No records found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Records;
