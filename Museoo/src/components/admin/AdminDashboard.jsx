import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";

import Dashboard from "./Dashboard";
import Schedule from "./Schedule";
import Visitors from "./Visitors";
import Exhibit from "./Exhibit";
import Event from "./Event";
import Archive from "./Archive";
import Donation from "./Donation";
import Settings from "./settings";
import AddUser from "./AddUser";

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const navigate = useNavigate();

  // ✅ Auth check
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/user", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) throw new Error("Not authenticated");

        const data = await res.json();
        if (data.success) {
          setUser(data.user);
        } else {
          navigate("/login");
        }
      } catch (err) {
        console.error("🔐 Auth error:", err);
        navigate("/login");
      }
    };

    fetchUser();
  }, [navigate]);

  // ✅ Logout handler
  const handleLogout = () => {
    fetch("http://localhost:3000/api/logout", {
      method: "GET",
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          navigate("/login");
        }
      });
  };

  // ✅ Tabs
  const tabs = [
    { name: "Dashboard", icon: "fa-house" },
    { name: "Schedule", icon: "fa-calendar" },
    { name: "Visitors", icon: "fa-person-walking" },
    { name: "Exhibit", icon: "fa-eye" },
    { name: "Event", icon: "fa-calendar-week" },
    { name: "Archive", icon: "fa-box-archive" },
    { name: "Donation", icon: "fa-hand-holding-dollar" },
    { name: "Settings", icon: "fa-gear" },
  ];

  if (user?.role === 1) {
    tabs.push({ name: "AddUser", icon: "fa-user-plus" });
  }

  // ✅ Show loading while user is being checked
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600 text-lg">
        Checking authentication...
      </div>
    );
  }

  const SidebarContent = (
    <div
      className={`bg-[#2c3e50] text-white flex flex-col h-full transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="flex items-center justify-between bg-[#1a252f] p-4">
        <div className="flex items-center gap-2">
          <img
            src={logo}
            alt="Logo"
            className={`${isCollapsed ? "w-10" : "w-14"} transition-all`}
          />
          {!isCollapsed && (
            <span className="text-lg font-bold">MuseoSmart</span>
          )}
        </div>
        <button
          className="text-white ml-auto hidden md:block"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <i className="fa-solid fa-bars text-lg"></i>
        </button>
        <button
          className="text-white md:hidden"
          onClick={() => setShowMobileSidebar(false)}
        >
          <i className="fa-solid fa-xmark text-xl"></i>
        </button>
      </div>

      <ul className="flex-1 p-2 space-y-1 overflow-y-auto">
        {tabs.map(({ name, icon }) => (
          <li
            key={name}
            title={isCollapsed ? name : ""}
            onClick={() => {
              setActiveTab(name);
              setShowMobileSidebar(false);
            }}
            className={`flex items-center gap-3 p-3 rounded hover:bg-[#34495e] cursor-pointer transition ${
              activeTab === name
                ? "bg-gradient-to-r from-[#3498db] to-[#2980b9]"
                : ""
            }`}
          >
            <i className={`fa-solid ${icon} text-base`}></i>
            {!isCollapsed && <span>{name}</span>}
          </li>
        ))}

        <li
          title={isCollapsed ? "Logout" : ""}
          onClick={handleLogout}
          className="flex items-center gap-3 p-3 rounded hover:bg-red-600 cursor-pointer"
        >
          <i className="fa-solid fa-right-from-bracket"></i>
          {!isCollapsed && <span>Logout</span>}
        </li>
      </ul>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Mobile sidebar drawer */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black opacity-40"
            onClick={() => setShowMobileSidebar(false)}
          ></div>
          <div className="relative z-50 w-64">{SidebarContent}</div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex">{SidebarContent}</aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <nav className="bg-white p-4 shadow flex justify-between items-center">
          {/* Mobile toggle */}
          <button
            className="md:hidden text-gray-700"
            onClick={() => setShowMobileSidebar(true)}
          >
            <i className="fa-solid fa-bars text-xl"></i>
          </button>
          <div className="font-semibold text-lg text-gray-700">{activeTab}</div>
          <div className="flex items-center gap-3">
            <i className="fa-solid fa-user bg-gray-200 p-2 rounded-full"></i>
            <span className="text-gray-700 font-medium">
              {user ? `${user.firstname} ${user.lastname}` : "Loading..."}
            </span>
          </div>
        </nav>

        <main className="p-4">
          {activeTab === "Dashboard" && <Dashboard />}
          {activeTab === "Schedule" && <Schedule />}
          {activeTab === "Visitors" && <Visitors />}
          {activeTab === "Exhibit" && <Exhibit />}
          {activeTab === "Event" && <Event />}
          {activeTab === "Archive" && <Archive />}
          {activeTab === "Donation" && <Donation />}
          {activeTab === "Settings" && <Settings />}
          {activeTab === "AddUser" && <AddUser />}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
