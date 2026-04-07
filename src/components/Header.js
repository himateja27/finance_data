import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900 shadow-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            className="flex items-center space-x-2 text-white hover:text-purple-200 transition-colors duration-200"
            to="/dashboard"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <i className="fas fa-wallet text-white text-sm"></i>
            </div>
            <span className="font-bold text-xl">FinanceHub</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link
              to="/dashboard"
              className="flex items-center space-x-1 text-purple-200 hover:text-white transition-colors duration-200 font-medium"
            >
              <i className="fas fa-tachometer-alt"></i>
              <span>Dashboard</span>
            </Link>

            {/* Analyst and Admin can access records */}
            {(user?.role?.name === "analyst" ||
              user?.role?.name === "admin") && (
              <>
                <Link
                  to="/records"
                  className="flex items-center space-x-1 text-purple-200 hover:text-white transition-colors duration-200 font-medium"
                >
                  <i className="fas fa-receipt"></i>
                  <span>Records</span>
                </Link>

                <Link
                  to="/income"
                  className="flex items-center space-x-1 text-purple-200 hover:text-white transition-colors duration-200 font-medium"
                >
                  <i className="fas fa-arrow-up"></i>
                  <span>Income</span>
                </Link>

                <Link
                  to="/expense"
                  className="flex items-center space-x-1 text-purple-200 hover:text-white transition-colors duration-200 font-medium"
                >
                  <i className="fas fa-arrow-down"></i>
                  <span>Expense</span>
                </Link>

                <Link
                  to="/transactions"
                  className="flex items-center space-x-1 text-purple-200 hover:text-white transition-colors duration-200 font-medium"
                >
                  <i className="fas fa-exchange-alt"></i>
                  <span>Transactions</span>
                </Link>
              </>
            )}

            {/* Only Admin can access budgets */}
            {user?.role?.name === "admin" && (
              <Link
                to="/budgets"
                className="flex items-center space-x-1 text-purple-200 hover:text-white transition-colors duration-200 font-medium"
              >
                <i className="fas fa-piggy-bank"></i>
                <span>Budgets</span>
              </Link>
            )}

            {/* Only Admin can manage users */}
            {user?.role?.name === "admin" && (
              <Link
                to="/users"
                className="flex items-center space-x-1 text-purple-200 hover:text-white transition-colors duration-200 font-medium"
              >
                <i className="fas fa-users"></i>
                <span>Users</span>
              </Link>
            )}
          </nav>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center space-x-2 text-white hover:text-purple-200 transition-colors duration-200 focus:outline-none"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <i className="fas fa-user text-sm"></i>
              </div>
              <span className="hidden sm:block font-medium">
                {user?.first_name || user?.email}
              </span>
              <span className="text-xs bg-purple-600/20 text-purple-200 px-2 py-1 rounded-full border border-purple-500/30">
                {user?.role?.name}
              </span>
              <i
                className={`fas fa-chevron-down text-sm transition-transform duration-200 ${isMenuOpen ? "rotate-180" : ""}`}
              ></i>
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-xl z-50">
                <div className="py-2">
                  <div className="px-4 py-2 border-b border-white/10">
                    <p className="text-sm text-white font-medium">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-xs text-purple-200">{user?.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors duration-200 flex items-center space-x-2"
                  >
                    <i className="fas fa-sign-out-alt"></i>
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white hover:text-purple-200 transition-colors duration-200 focus:outline-none"
          >
            <i className="fas fa-bars text-xl"></i>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-white/10">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link
                to="/dashboard"
                className="block px-3 py-2 text-purple-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <i className="fas fa-tachometer-alt"></i>
                <span>Dashboard</span>
              </Link>

              {/* Analyst and Admin can access records */}
              {(user?.role?.name === "analyst" ||
                user?.role?.name === "admin") && (
                <>
                  <Link
                    to="/records"
                    className="block px-3 py-2 text-purple-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <i className="fas fa-receipt"></i>
                    <span>Records</span>
                  </Link>

                  <Link
                    to="/income"
                    className="block px-3 py-2 text-purple-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <i className="fas fa-arrow-up"></i>
                    <span>Income</span>
                  </Link>

                  <Link
                    to="/expense"
                    className="block px-3 py-2 text-purple-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <i className="fas fa-arrow-down"></i>
                    <span>Expense</span>
                  </Link>

                  <Link
                    to="/transactions"
                    className="block px-3 py-2 text-purple-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <i className="fas fa-exchange-alt"></i>
                    <span>Transactions</span>
                  </Link>
                </>
              )}

              {/* Only Admin can access budgets */}
              {user?.role?.name === "admin" && (
                <Link
                  to="/budgets"
                  className="block px-3 py-2 text-purple-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <i className="fas fa-piggy-bank"></i>
                  <span>Budgets</span>
                </Link>
              )}

              {/* Only Admin can manage users */}
              {user?.role?.name === "admin" && (
                <Link
                  to="/users"
                  className="block px-3 py-2 text-purple-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-200 flex items-center space-x-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <i className="fas fa-users"></i>
                  <span>Users</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Overlay for mobile menu */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}
    </header>
  );
};

export default Header;
