import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Header from "../components/Header";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [categories, setCategories] = useState([]);
  const [trends, setTrends] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { refreshTrigger } = useData();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, [refreshTrigger]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [summaryRes, categoriesRes, trendsRes, activityRes] =
        await Promise.all([
          api.get("/dashboard/summary/", { params: { period: "month" } }),
          api.get("/dashboard/category-summary/", {
            params: { record_type: "expense", period: "month" },
          }),
          api.get("/dashboard/monthly-trends/", { params: { months: 12 } }),
          api.get("/dashboard/recent-activity/", { params: { limit: 10 } }),
        ]);

      setSummary(summaryRes.data.data);
      setCategories(categoriesRes.data.data.categories);
      setTrends(trendsRes.data.data.trends);
      setRecentActivity(activityRes.data.data.activity);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
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

  if (error) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg max-w-md">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
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
            <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 px-6 py-8 sm:px-10 sm:py-10">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-pink-100/90">
                    Financial Overview
                  </p>
                  <h1 className="mt-3 text-4xl font-semibold text-white">
                    Welcome back, {user?.first_name || "User"}
                  </h1>
                  <p className="mt-3 max-w-2xl text-purple-100/80 text-sm sm:text-base">
                    Track your financial health with real-time insights and
                    comprehensive analytics.
                  </p>
                </div>

                <button
                  className="inline-flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-white/20 transition hover:-translate-y-0.5 hover:bg-white/20"
                  onClick={fetchDashboardData}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-sync-alt mr-2" />
                      Refresh Data
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="px-6 py-8 sm:px-10 sm:py-10 space-y-8">
              {error && (
                <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-4 text-red-100">
                  {error}
                </div>
              )}

              {summary && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div
                    className="group rounded-[1.75rem] border border-green-400/20 bg-gradient-to-br from-green-500/10 to-emerald-500/5 p-6 shadow-xl shadow-green-900/20 transition hover:scale-105 hover:shadow-green-500/30 cursor-pointer"
                    onClick={() => navigate("/income")}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm font-medium">
                          Total Income
                        </p>
                        <p className="text-3xl font-bold text-white mt-2">
                          ${Number(summary.total_income || 0).toFixed(2)}
                        </p>
                        <p className="text-green-200 text-xs mt-1">
                          This period
                        </p>
                      </div>
                      <div className="bg-green-400/20 p-4 rounded-2xl">
                        <i className="fas fa-arrow-up text-3xl text-green-300" />
                      </div>
                    </div>
                  </div>

                  <div
                    className="group rounded-[1.75rem] border border-red-400/20 bg-gradient-to-br from-red-500/10 to-rose-500/5 p-6 shadow-xl shadow-red-900/20 transition hover:scale-105 hover:shadow-red-500/30 cursor-pointer"
                    onClick={() => navigate("/expense")}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-red-100 text-sm font-medium">
                          Total Expense
                        </p>
                        <p className="text-3xl font-bold text-white mt-2">
                          ${Number(summary.total_expense || 0).toFixed(2)}
                        </p>
                        <p className="text-red-200 text-xs mt-1">This period</p>
                      </div>
                      <div className="bg-red-400/20 p-4 rounded-2xl">
                        <i className="fas fa-arrow-down text-3xl text-red-300" />
                      </div>
                    </div>
                  </div>

                  <div
                    className={`group rounded-[1.75rem] border p-6 shadow-xl transition hover:scale-105 cursor-pointer ${
                      summary.net_balance >= 0
                        ? "border-blue-400/20 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 shadow-blue-900/20 hover:shadow-blue-500/30"
                        : "border-orange-400/20 bg-gradient-to-br from-orange-500/10 to-amber-500/5 shadow-orange-900/20 hover:shadow-orange-500/30"
                    }`}
                    onClick={() => navigate("/transactions")}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p
                          className={
                            summary.net_balance >= 0
                              ? "text-blue-100 text-sm font-medium"
                              : "text-orange-100 text-sm font-medium"
                          }
                        >
                          Net Balance
                        </p>
                        <p className="text-3xl font-bold text-white mt-2">
                          ${Number(summary.net_balance || 0).toFixed(2)}
                        </p>
                        <p
                          className={
                            summary.net_balance >= 0
                              ? "text-blue-200 text-xs mt-1"
                              : "text-orange-200 text-xs mt-1"
                          }
                        >
                          Income - Expense
                        </p>
                      </div>
                      <div
                        className={`p-4 rounded-2xl ${summary.net_balance >= 0 ? "bg-blue-400/20" : "bg-orange-400/20"}`}
                      >
                        <i
                          className={
                            summary.net_balance >= 0
                              ? "fas fa-balance-scale text-3xl text-blue-300"
                              : "fas fa-exclamation-triangle text-3xl text-orange-300"
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    className="group rounded-[1.75rem] border border-purple-400/20 bg-gradient-to-br from-purple-500/10 to-violet-500/5 p-6 shadow-xl shadow-purple-900/20 transition hover:scale-105 hover:shadow-purple-500/30 cursor-pointer"
                    onClick={() => navigate("/transactions")}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm font-medium">
                          Total Transactions
                        </p>
                        <p className="text-3xl font-bold text-white mt-2">
                          {summary.total_transactions || 0}
                        </p>
                        <p className="text-purple-200 text-xs mt-1">All time</p>
                      </div>
                      <div className="bg-purple-400/20 p-4 rounded-2xl">
                        <i className="fas fa-receipt text-3xl text-purple-300" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="rounded-[1.75rem] border border-white/10 bg-white/5 backdrop-blur-sm p-6 shadow-xl shadow-slate-950/20">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl px-6 py-4 mb-6">
                    <h5 className="text-white font-semibold flex items-center gap-2">
                      <i className="fas fa-chart-pie" />
                      Category Breakdown
                    </h5>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-slate-200">
                      <thead className="text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                        <tr>
                          <th className="px-4 py-3">Category</th>
                          <th className="px-4 py-3 text-right">Total Amount</th>
                          <th className="px-4 py-3 text-center">
                            Transactions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {categories.length > 0 ? (
                          categories.map((cat, index) => (
                            <tr
                              key={index}
                              className="hover:bg-white/5 transition"
                            >
                              <td className="px-4 py-4 font-medium text-white capitalize">
                                {cat.category_display}
                              </td>
                              <td className="px-4 py-4 text-right text-slate-200">
                                ${Number(cat.total || 0).toFixed(2)}
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className="inline-flex rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-200">
                                  {cat.count}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan="3"
                              className="px-4 py-8 text-center text-slate-400"
                            >
                              No category data available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-white/10 bg-white/5 backdrop-blur-sm p-6 shadow-xl shadow-slate-950/20">
                  <div className="bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl px-6 py-4 mb-6">
                    <h5 className="text-white font-semibold flex items-center gap-2">
                      <i className="fas fa-clock" />
                      Recent Activity
                    </h5>
                  </div>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {recentActivity.length > 0 ? (
                      recentActivity.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex items-center p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition"
                        >
                          <div
                            className={`mr-4 ${activity.record_type === "income" ? "text-green-400" : "text-red-400"}`}
                          >
                            <div
                              className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                activity.record_type === "income"
                                  ? "bg-green-500/20"
                                  : "bg-red-500/20"
                              }`}
                            >
                              <i
                                className={`fas ${activity.record_type === "income" ? "fa-arrow-up" : "fa-arrow-down"} text-xl`}
                              />
                            </div>
                          </div>
                          <div className="flex-grow">
                            <div className="flex justify-between items-start">
                              <h6 className="text-sm font-semibold text-white mb-1">
                                {activity.description}
                              </h6>
                              <span className="text-xs text-slate-400">
                                {activity.transaction_date}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-slate-300 flex items-center gap-1">
                                <i className="fas fa-tag" />
                                {activity.category}
                              </span>
                              <div className="text-right">
                                <div className="text-xs text-slate-400 font-mono">
                                  {activity.reference_number || "N/A"}
                                </div>
                                <span
                                  className={`text-sm font-bold ${
                                    activity.record_type === "income"
                                      ? "text-green-400"
                                      : "text-red-400"
                                  }`}
                                >
                                  ${Number(activity.amount || 0).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <i className="fas fa-clock text-4xl text-slate-500 mb-4" />
                        <p className="text-slate-400">No recent activity</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {trends.length > 0 && (
                <div className="rounded-[1.75rem] border border-white/10 bg-white/5 backdrop-blur-sm p-6 shadow-xl shadow-slate-950/20">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl px-6 py-4 mb-6">
                    <h5 className="text-white font-semibold flex items-center gap-2">
                      <i className="fas fa-chart-line" />
                      Monthly Trends
                    </h5>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-slate-200">
                      <thead className="text-left text-xs uppercase tracking-[0.2em] text-slate-400">
                        <tr>
                          <th className="px-4 py-3">Month</th>
                          <th className="px-4 py-3 text-right">Income</th>
                          <th className="px-4 py-3 text-right">Expense</th>
                          <th className="px-4 py-3 text-right">Net Balance</th>
                          <th className="px-4 py-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {trends.map((trend, index) => {
                          const isProfit = trend.net >= 0;
                          const statusClass = isProfit
                            ? "inline-flex rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-200"
                            : "inline-flex rounded-full bg-rose-500/20 px-3 py-1 text-xs font-semibold text-rose-200";
                          const statusText = isProfit ? "Profit" : "Loss";

                          return (
                            <tr
                              key={index}
                              className="hover:bg-white/5 transition"
                            >
                              <td className="px-4 py-4">
                                <div className="flex items-center">
                                  <i className="fas fa-calendar text-slate-400 mr-3" />
                                  <span className="text-sm font-medium text-white">
                                    {trend.month}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-4 text-right text-green-400">
                                ${Number(trend.income || 0).toFixed(2)}
                              </td>
                              <td className="px-4 py-4 text-right text-red-400">
                                ${Number(trend.expense || 0).toFixed(2)}
                              </td>
                              <td
                                className={`px-4 py-4 text-right text-sm font-bold ${isProfit ? "text-green-400" : "text-red-400"}`}
                              >
                                ${Number(trend.net || 0).toFixed(2)}
                              </td>
                              <td className="px-4 py-4 text-center">
                                <span className={statusClass}>
                                  {statusText}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
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

export default Dashboard;
