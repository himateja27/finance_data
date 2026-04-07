import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import Header from "../components/Header";
import { useAuth } from "../context/AuthContext";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [search, setSearch] = useState("");

  const { hasPermission } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    role: "",
    is_active: true,
  });

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;

      const response = await api.get("/users/", { params });
      setUsers(
        response.data.data || response.data.results || response.data || [],
      );
    } catch (err) {
      setError("Failed to load users");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  const fetchRoles = useCallback(async () => {
    try {
      const response = await api.get("/users/roles/");
      setRoles(response.data.data || response.data || []);
    } catch (err) {
      console.error("Failed to load roles", err);
    }
  }, []);

  useEffect(() => {
    if (hasPermission("manage_users")) {
      fetchUsers();
      fetchRoles();
    }
  }, [hasPermission, fetchUsers, fetchRoles]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    try {
      if (editingUser) {
        await api.patch(`/users/${editingUser.id}/`, {
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role,
          is_active: formData.is_active,
        });
        setSuccessMessage("User updated successfully.");
      } else {
        await api.post("/users/", formData);
        setSuccessMessage("User created successfully.");
      }

      setShowForm(false);
      setEditingUser(null);
      resetForm();
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save user");
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      password: "",
      role: user.role || user.role_display || "",
      is_active: user.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to deactivate this user?")) {
      try {
        await api.delete(`/users/${id}/`);
        setUsers((current) => current.filter((user) => user.id !== id));
        setSuccessMessage("User deactivated successfully.");
        setError("");
      } catch (err) {
        setError("Failed to deactivate user");
      }
    }
  };

  const resetForm = () => {
    setFormData({
      email: "",
      first_name: "",
      last_name: "",
      password: "",
      role: "",
      is_active: true,
    });
  };

  if (!hasPermission("manage_users")) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 flex items-center justify-center">
          <div className="rounded-2xl border border-red-400/30 bg-red-500/10 p-8 text-red-100 max-w-md">
            <div className="text-center">
              <i className="fas fa-shield-alt text-4xl mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">Access Denied</h3>
              <p>You don't have permission to access this page.</p>
            </div>
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
                    User Management
                  </p>
                  <h1 className="mt-3 text-4xl font-semibold text-white">
                    Manage Users
                  </h1>
                  <p className="mt-3 max-w-2xl text-purple-100/80 text-sm sm:text-base">
                    Add, edit, and manage user accounts and permissions.
                  </p>
                </div>

                <button
                  className="inline-flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-white/20 transition hover:-translate-y-0.5 hover:bg-white/20"
                  onClick={() => {
                    setShowForm(true);
                    setEditingUser(null);
                    resetForm();
                  }}
                >
                  <i className="fas fa-user-plus mr-2" />
                  Add User
                </button>
              </div>
            </div>

            <div className="px-6 py-8 sm:px-10 sm:py-10 space-y-8">
              {error && (
                <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-4 text-red-100">
                  {error}
                </div>
              )}

              {successMessage && (
                <div className="rounded-3xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-emerald-100">
                  {successMessage}
                </div>
              )}

              {/* Search */}
              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 backdrop-blur-sm p-6 shadow-xl shadow-slate-950/20">
                <form onSubmit={handleSearchSubmit} className="flex gap-4">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <i className="fas fa-search text-slate-400"></i>
                    </div>
                    <input
                      type="text"
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                      placeholder="Search by name or email..."
                      value={search}
                      onChange={handleSearchChange}
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-2xl transition-all duration-200 transform hover:scale-105 hover:shadow-xl shadow-lg"
                  >
                    <i className="fas fa-search mr-2"></i>
                    Search
                  </button>
                </form>
              </div>

              {/* Add/Edit Form */}
              {showForm && (
                <div className="rounded-[1.75rem] border border-white/10 bg-white/5 backdrop-blur-sm p-6 shadow-xl shadow-slate-950/20">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl px-6 py-4 mb-6">
                    <h5 className="text-white font-semibold flex items-center gap-2">
                      <i className="fas fa-user-edit" />
                      {editingUser ? "Edit User" : "Add New User"}
                    </h5>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-200 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleFormChange}
                          placeholder="Enter first name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-200 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleFormChange}
                          placeholder="Enter last name"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-200 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                        name="email"
                        value={formData.email}
                        onChange={handleFormChange}
                        placeholder="Enter email address"
                        required
                        disabled={!!editingUser}
                      />
                    </div>

                    {!editingUser && (
                      <div>
                        <label className="block text-sm font-semibold text-slate-200 mb-2">
                          Password
                        </label>
                        <input
                          type="password"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                          name="password"
                          value={formData.password}
                          onChange={handleFormChange}
                          placeholder="Create a password"
                          required={!editingUser}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-200 mb-2">
                          Role
                        </label>
                        <select
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition appearance-none"
                          name="role"
                          value={formData.role}
                          onChange={handleFormChange}
                          required
                        >
                          <option value="" className="bg-slate-800 text-white">
                            Select Role
                          </option>
                          {roles.map((role) => (
                            <option
                              key={role.id}
                              value={role.name}
                              className="bg-slate-800 text-white"
                            >
                              {role.name} - {role.description}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-200 mb-2">
                          Status
                        </label>
                        <div className="flex items-center mt-3">
                          <input
                            type="checkbox"
                            className="w-5 h-5 text-purple-600 bg-white/5 border-white/10 rounded focus:ring-purple-500 focus:ring-2"
                            name="is_active"
                            checked={formData.is_active}
                            onChange={handleFormChange}
                          />
                          <span className="ml-3 text-sm text-slate-200">
                            Active
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button
                        type="submit"
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-2xl transition-all duration-200 transform hover:scale-105 hover:shadow-xl shadow-lg"
                      >
                        <i className="fas fa-save mr-2"></i>
                        {editingUser ? "Update" : "Save"}
                      </button>
                      <button
                        type="button"
                        className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-2xl hover:bg-white/20 transition-all duration-200 transform hover:scale-105"
                        onClick={() => {
                          setShowForm(false);
                          setEditingUser(null);
                        }}
                      >
                        <i className="fas fa-times mr-2"></i>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Users Table */}
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
                          <th className="px-6 py-4">Name</th>
                          <th className="px-6 py-4">Email</th>
                          <th className="px-6 py-4">Role</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Created</th>
                          <th className="px-6 py-4">Last Login</th>
                          <th className="px-6 py-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700">
                        {users.map((user) => (
                          <tr
                            key={user.id}
                            className="hover:bg-white/5 transition"
                          >
                            <td className="px-6 py-4 font-medium text-white">
                              {user.full_name}
                            </td>
                            <td className="px-6 py-4 text-slate-200">
                              {user.email}
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-200">
                                {user.role_display || user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                  user.is_active
                                    ? "bg-emerald-500/20 text-emerald-200"
                                    : "bg-slate-500/20 text-slate-300"
                                }`}
                              >
                                {user.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-300">
                              {new Date(user.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-slate-300">
                              {user.last_login
                                ? new Date(user.last_login).toLocaleDateString()
                                : "Never"}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex gap-2">
                                <button
                                  className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded-lg text-xs font-medium transition"
                                  onClick={() => handleEdit(user)}
                                >
                                  <i className="fas fa-edit mr-1"></i>
                                  Edit
                                </button>
                                <button
                                  className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg text-xs font-medium transition"
                                  onClick={() => handleDelete(user.id)}
                                >
                                  <i className="fas fa-user-times mr-1"></i>
                                  Deactivate
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {users.length === 0 && (
                    <div className="text-center py-12">
                      <i className="fas fa-users text-4xl text-slate-500 mb-4"></i>
                      <p className="text-slate-400">No users found</p>
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

export default Users;
