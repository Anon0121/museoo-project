import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import logo from "../../assets/logo.png"; // optional if using logo

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  const links = [
    { to: "/admin/dashboard", label: "Dashboard", icon: "fa-house" },
    { to: "/admin/schedule", label: "Schedule", icon: "fa-calendar" },
    { to: "/admin/visitors", label: "Visitors", icon: "fa-person-walking" },
    { to: "/admin/exhibit", label: "Exhibit", icon: "fa-eye" },
    { to: "/admin/events", label: "Events", icon: "fa-calendar-week" },
    { to: "/admin/archive", label: "Digital Archive", icon: "fa-box-archive" },
    { to: "/admin/donation", label: "Donations", icon: "fa-hand-holding-dollar" },
    { to: "/admin/settings", label: "Settings", icon: "fa-gear" },
    { to: "/admin/add-user", label: "Add User", icon: "fa-user-plus" },
  ];

  return (
    <aside
      className={`bg-[#2c3e50] text-white min-h-screen transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-[#1a252f] p-4">
        <div className="flex items-center gap-2">
          <img
            src={logo}
            alt="Logo"
            className={`${collapsed ? "w-8" : "w-12"} transition-all duration-200`}
          />
          {!collapsed && <span className="text-xl font-bold">MuseoSmart</span>}
        </div>
        <button
          className="text-white ml-auto"
          onClick={() => setCollapsed(!collapsed)}
          title="Toggle sidebar"
        >
          <i className="fa-solid fa-bars text-lg"></i>
        </button>
      </div>

      {/* Navigation Links */}
      <ul className="px-2 mt-4 space-y-1">
        {links.map((item, i) => (
          <li key={i} title={collapsed ? item.label : ""}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded hover:bg-[#34495e] transition ${
                  isActive ? "bg-[#3498db]" : ""
                }`
              }
            >
              <i className={`fa-solid ${item.icon}`}></i>
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default Sidebar;
