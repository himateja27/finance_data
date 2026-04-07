import React, { useState, useEffect } from "react";
import api from "../services/api";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";

const Budgets = () => {
  const { hasPermission } = useAuth();
  const { triggerRefresh } = useData();

  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [formData, setFormData] = useState({
    category: "",
    limit_amount: "",
    month: "",
    is_active: true,
  });

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

  useEffect(() => {
    fetchBudgets();
  }, []);

  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  };

  const buildPayload = (data) => {
    const payload = {
      ...data,
      month: data.month ? `${data.month}-01` : "",
    };
    return payload;
  };

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await api.get("/finance/budgets/");
      setBudgets(response.data.data || response.data || []);
    } catch (err) {
      setError("Failed to load budgets.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      category: "",
      limit_amount: "",
      month: getCurrentMonth(),
      is_active: true,
    });
    setError("");
    setSuccessMessage("");
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleEditBudget = (budget) => {
    setEditingBudget(budget);
    setShowForm(true);
    setError("");
    setSuccessMessage("");
    setFormData({
      category: budget.category,
      limit_amount: budget.limit_amount,
      month: budget.month ? budget.month.slice(0, 7) : getCurrentMonth(),
      is_active: budget.is_active,
    });
  };

  const handleDeleteBudget = async (id) => {
    if (!window.confirm("Are you sure you want to delete this budget?")) {
      return;
    }

    try {
      await api.delete(`/finance/budgets/${id}/`);
      setSuccessMessage("Budget deleted successfully.");
      fetchBudgets();
      triggerRefresh();
    } catch (err) {
      setError("Failed to delete budget.");
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    try {
      if (editingBudget) {
        await api.patch(
          `/finance/budgets/${editingBudget.id}/`,
          buildPayload(formData),
        );
        setSuccessMessage("Budget updated successfully.");
      } else {
        await api.post("/finance/budgets/", buildPayload(formData));
        setSuccessMessage("Budget saved successfully.");
      }

      setShowForm(false);
      setEditingBudget(null);
      resetForm();
      fetchBudgets();
      triggerRefresh();
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        "Failed to save budget.";
      setError(message);
      console.error(err);
    }
  };

  const formatMonthLabel = (month) => {
    if (!month) return "";
    const normalized = month.length === 7 ? `${month}-01` : month;
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return month;
    return date.toLocaleString("default", {
      month: "short",
      year: "numeric",
    });
  };

  const getStatusLabel = (budget) => {
    if (!budget?.is_active) {
      return {
        label: "Inactive",
        className: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
      };
    }

    const remaining = Number(budget?.remaining_amount ?? 0);
    if (remaining < 0) {
      return {
        label: "Over Budget",
        className: "bg-red-500/20 text-red-400 border border-red-500/30",
      };
    }
    if (remaining === 0) {
      return {
        label: "At Limit",
        className:
          "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
      };
    }
    return {
      label: "On Track",
      className: "bg-green-500/20 text-green-400 border border-green-500/30",
    };
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-700 px-6 py-8 sm:px-10 sm:py-10">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-purple-100/90">
                    Budget management
                  </p>
                  <h1 className="mt-3 text-4xl font-semibold text-white">
                    Plan budgets with confidence
                  </h1>
                  <p className="mt-3 max-w-2xl text-purple-100/80 text-sm sm:text-base">
                    Add, view and monitor budget targets across categories. Each
                    budget updates the dashboard and keeps your month on track.
                  </p>
                </div>

                {hasPermission("manage_records") && (
                  <button
                    className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-purple-900/40 transition hover:-translate-y-0.5 hover:from-purple-700 hover:to-pink-700 hover:shadow-purple-500/50"
                    onClick={() => {
                      setShowForm(true);
                      setEditingBudget(null);
                      resetForm();
                    }}
                  >
                    Add new budget
                  </button>
                )}
              </div>
            </div>

            <div className="px-6 py-8 sm:px-10 sm:py-10 space-y-8">
              {error && (
                <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-4 text-red-100 backdrop-blur-sm">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="rounded-3xl border border-green-400/30 bg-green-500/10 p-4 text-green-100 backdrop-blur-sm">
                  {successMessage}
                </div>
              )}

              {showForm && (
                <div className="rounded-3xl border border-white/20 bg-white/10 backdrop-blur-md p-6 shadow-xl shadow-purple-900/20">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold text-white">
                        Add New Budget
                      </h2>
                      <p className="mt-1 text-sm text-purple-200">
                        Enter the category, limit, and month for the budget.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="text-sm font-semibold text-purple-200 transition hover:text-white"
                      onClick={() => setShowForm(false)}
                    >
                      Close
                    </button>
                  </div>

                  <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
                    <div className="grid gap-6 md:grid-cols-3">
                      <label className="block">
                        <span className="text-sm font-medium text-purple-200">
                          Category
                        </span>
                        <select
                          name="category"
                          value={formData.category}
                          onChange={handleFormChange}
                          required
                          className="mt-2 w-full rounded-3xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder-purple-300 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
                          style={{
                            backgroundColor: "rgba(255, 255, 255, 0.1)",
                          }}
                        >
                          <option
                            value=""
                            style={{
                              backgroundColor: "#1f2937",
                              color: "#ffffff",
                            }}
                          >
                            Select a category
                          </option>
                          {categories.map((cat) => (
                            <option
                              key={cat.value}
                              value={cat.value}
                              style={{
                                backgroundColor: "#1f2937",
                                color: "#ffffff",
                              }}
                            >
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block">
                        <span className="text-sm font-medium text-purple-200">
                          Limit Amount
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          name="limit_amount"
                          value={formData.limit_amount}
                          onChange={handleFormChange}
                          required
                          className="mt-2 w-full rounded-3xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm text-white placeholder-purple-300 outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
                        />
                      </label>

                      <label className="block">
                        <span className="text-sm font-medium text-purple-200">
                          Month
                        </span>
                        <input
                          type="month"
                          name="month"
                          value={formData.month}
                          onChange={handleFormChange}
                          required
                          className="mt-2 w-full rounded-3xl border border-white/20 bg-white/10 backdrop-blur-sm px-4 py-3 text-sm text-white outline-none transition focus:border-purple-400 focus:ring-2 focus:ring-purple-500/20"
                        />
                      </label>
                    </div>

                    <label className="flex items-center gap-3 text-sm text-purple-200">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleFormChange}
                        className="h-5 w-5 rounded border-white/20 bg-white/10 text-purple-500 focus:ring-purple-500 backdrop-blur-sm"
                      />
                      Active budget
                    </label>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 text-sm font-semibold text-white transition hover:from-purple-700 hover:to-pink-700 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
                      >
                        {editingBudget ? "Update Budget" : "Save Budget"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-6 py-3 text-sm font-semibold text-purple-200 transition hover:border-purple-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center rounded-3xl border border-white/20 bg-white/10 backdrop-blur-md p-10">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-400 border-t-transparent"></div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-3xl border border-white/20 bg-white/10 backdrop-blur-md shadow-inner shadow-purple-900/20">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-white/10 text-sm text-purple-200">
                      <thead className="bg-gradient-to-r from-purple-800/50 to-pink-800/50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-purple-200 uppercase tracking-wider">
                            Category
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-purple-200 uppercase tracking-wider">
                            Month
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-purple-200 uppercase tracking-wider">
                            Limit
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-purple-200 uppercase tracking-wider">
                            Spent
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-purple-200 uppercase tracking-wider">
                            Remaining
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-purple-200 uppercase tracking-wider">
                            Status
                          </th>
                          {hasPermission("manage_records") && (
                            <th className="px-6 py-4 text-left text-xs font-semibold text-purple-200 uppercase tracking-wider">
                              Actions
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/10 bg-white/5">
                        {budgets.length > 0 ? (
                          budgets.map((budget) => {
                            const remaining = Number(
                              budget.remaining_amount ?? 0,
                            );
                            const spent = Number(budget.spent_amount ?? 0);
                            const status = getStatusLabel(budget);

                            return (
                              <tr
                                key={budget.id}
                                className="hover:bg-purple-600/20 transition-colors duration-200 cursor-pointer"
                              >
                                <td className="px-6 py-4">
                                  <div className="text-sm font-medium text-white capitalize">
                                    {budget.category}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm text-purple-200">
                                    {formatMonthLabel(budget.month)}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm text-white">
                                    $
                                    {Number(budget.limit_amount || 0).toFixed(
                                      2,
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm text-white">
                                    ${Number(spent || 0).toFixed(2)}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div
                                    className={`text-sm font-medium ${
                                      remaining < 0
                                        ? "text-red-400"
                                        : "text-green-400"
                                    }`}
                                  >
                                    ${Number(remaining || 0).toFixed(2)}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span
                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                                  >
                                    {status.label}
                                  </span>
                                </td>
                                {hasPermission("manage_records") && (
                                  <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded-lg text-xs font-medium transition"
                                        onClick={() => handleEditBudget(budget)}
                                      >
                                        Edit
                                      </button>
                                      <button
                                        className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg text-xs font-medium transition"
                                        onClick={() =>
                                          handleDeleteBudget(budget.id)
                                        }
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td
                              colSpan={hasPermission("manage_records") ? 7 : 6}
                              className="px-6 py-12 text-center"
                            >
                              <div className="text-purple-200">
                                <p className="text-lg font-medium">
                                  No budgets found
                                </p>
                                <p className="text-sm mt-1">
                                  Create your first budget to get started
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Budgets;
