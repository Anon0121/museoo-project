import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import api from "../../config/api";

import Dashboard from "./Dashboard";
import Schedule from "./Schedule";
import Visitors from "./Visitors";
import Exhibit from "./Exhibit";
import Event from "./Event";
import Archive from "./Archive";
import Donation from "./Donation";
import Settings from "./settings";
import AddUser from "./AddUser";
import CulturalObjects from "./CulturalObjects";
import VisitorScanner from "./VisitorScanner";
import Reports from "./Reports";

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
        console.log("🔄 Fetching user data in AdminDashboard...");
        const res = await api.get("/api/user");
        console.log("📋 AdminDashboard user data:", res.data);

        if (res.data.success) {
          setUser(res.data.user);
          console.log("✅ User status in AdminDashboard:", res.data.user.status);
        } else {
          navigate("/login");
        }
      } catch (err) {
        console.error("🔐 Auth error:", err);
        navigate("/login");
      }
    };

    fetchUser();
    
    // Set up periodic refresh of user data to get updated permissions
    const interval = setInterval(fetchUser, 5000); // Refresh every 5 seconds
    
    return () => clearInterval(interval);
  }, [navigate]);

  // ✅ Logout handler
  const handleLogout = async () => {
    try {
      const res = await api.get("/api/logout");
      if (res.data.success) {
        navigate("/login");
      }
    } catch (err) {
      console.error("Logout error:", err);
      navigate("/login");
    }
  };

  // ✅ Refresh user data handler
  const handleRefreshUser = async () => {
    try {
      console.log("🔄 Manually refreshing user data...");
      const res = await api.get("/api/user");
      if (res.data.success) {
        setUser(res.data.user);
        console.log("✅ User data refreshed:", res.data.user);
      }
    } catch (err) {
      console.error("Refresh error:", err);
    }
  };

  // ✅ Get user permissions
  const getUserPermissions = () => {
    if (!user) return {};
    
    console.log("🔍 Getting permissions for user:", user.username);
    console.log("🔍 User permissions data:", user.permissions);
    
    // If user has permissions in session, use them
    if (user.permissions) {
      const perms = typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions;
      console.log("🔍 Parsed permissions:", perms);
      
      // Convert to new format if needed
      const convertedPerms = {};
      Object.entries(perms).forEach(([key, value]) => {
        if (typeof value === 'boolean') {
          convertedPerms[key] = { allowed: value, access: value ? 'edit' : 'none' };
        } else if (typeof value === 'object') {
          convertedPerms[key] = value;
        }
      });
      console.log("🔍 Converted permissions:", convertedPerms);
      return convertedPerms;
    }
    
    console.log("🔍 No permissions found, using defaults for role:", user.role);
    
    // Default permissions based on role
    if (user.role === 'admin') {
      return {
        dashboard: { allowed: true, access: 'edit' },
        schedule: { allowed: true, access: 'edit' },
        visitors: { allowed: true, access: 'edit' },
        scanner: { allowed: true, access: 'edit' },
        exhibit: { allowed: true, access: 'edit' },
        event: { allowed: true, access: 'edit' },
        cultural_objects: { allowed: true, access: 'edit' },
        archive: { allowed: true, access: 'edit' },
        donation: { allowed: true, access: 'edit' },
        reports: { allowed: true, access: 'edit' },
        settings: { allowed: true, access: 'edit' },
      };
    } else {
      return {
        dashboard: { allowed: true, access: 'view' },
        schedule: { allowed: false, access: 'none' },
        visitors: { allowed: true, access: 'view' },
        scanner: { allowed: true, access: 'edit' },
        exhibit: { allowed: false, access: 'none' },
        event: { allowed: false, access: 'none' },
        cultural_objects: { allowed: false, access: 'none' },
        archive: { allowed: false, access: 'none' },
        donation: { allowed: true, access: 'view' },
        reports: { allowed: true, access: 'view' },
        settings: { allowed: true, access: 'view' },
      };
    }
  };

  const userPermissions = getUserPermissions();
  
  console.log("🔍 Final user permissions:", userPermissions);

  // ✅ Tabs with permission filtering
  const allTabs = [
    { name: "Dashboard", icon: "fa-house", permission: "dashboard" },
    { name: "Schedule", icon: "fa-calendar", permission: "schedule" },
    { name: "Visitors", icon: "fa-person-walking", permission: "visitors" },
    { name: "Scanner", icon: "fa-qrcode", permission: "scanner" },
    { name: "Exhibit", icon: "fa-eye", permission: "exhibit" },
    { name: "Event", icon: "fa-calendar-week", permission: "event" },
    { name: "CulturalObjects", icon: "fa-landmark", permission: "cultural_objects" },
    { name: "Archive", icon: "fa-box-archive", permission: "archive" },
    { name: "Donation", icon: "fa-hand-holding-dollar", permission: "donation" },
    { name: "Reports", icon: "fa-chart-bar", permission: "reports" },
    { name: "Settings", icon: "fa-gear", permission: "settings" },
  ];

  // Filter tabs based on permissions
  const tabs = allTabs.filter(tab => {
    const permission = userPermissions[tab.permission];
    console.log(`🔍 Checking tab "${tab.name}" with permission:`, permission);
    
    // If no permission found, show it (fallback)
    if (!permission) {
      console.log(`✅ Tab "${tab.name}" - no permission found, showing`);
      return true;
    }
    
    // If permission is explicitly not allowed (0 or false), hide it
    if (permission.allowed === false || permission.allowed === 0) {
      console.log(`❌ Tab "${tab.name}" - not allowed, hiding`);
      return false;
    }
    
    // If permission is allowed, show it
    console.log(`✅ Tab "${tab.name}" - allowed, showing`);
    return true;
  });

  // Add AddUser tab for admins
  if (user?.role === 'admin') {
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
      className={`bg-[#2e2b41] text-white h-screen flex flex-col transition-all duration-300 ${
        isCollapsed ? "w-16 sm:w-20" : "w-64"
      }`}
    >
      {/* Header with Logo */}
      <div className="p-3 sm:p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#AB8841] rounded-full flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-landmark text-white text-sm sm:text-lg"></i>
            </div>
            {!isCollapsed && (
              <h2 className="text-lg sm:text-xl font-bold text-white truncate">
                MuseoSmart
              </h2>
            )}
          </div>
          <button
            className="text-gray-300 hover:text-white transition-colors hidden md:block p-1 sm:p-2 rounded-lg hover:bg-gray-700"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <i className="fa-solid fa-bars text-sm sm:text-lg"></i>
          </button>
        </div>
        {!isCollapsed && (
          <p className="text-gray-400 text-xs sm:text-sm">Admin Dashboard</p>
        )}
      </div>

      {/* Navigation Menu */}
      <ul className="flex-1 p-2 space-y-1 overflow-y-auto">
        {tabs.map(({ name, icon }) => (
          <li
            key={name}
            title={isCollapsed ? name : ""}
            onClick={() => {
              setActiveTab(name);
              setShowMobileSidebar(false);
            }}
            className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg cursor-pointer transition-all duration-200 text-sm sm:text-base ${
              activeTab === name
                ? "bg-[#AB8841] text-white shadow-lg"
                : "text-gray-300 hover:bg-[#AB8841]/20 hover:text-white"
            }`}
          >
            <i className={`fa-solid ${icon} text-sm sm:text-lg ${activeTab === name ? "text-white" : "text-gray-400"} flex-shrink-0`}></i>
            {!isCollapsed && <span className="font-medium truncate">{name}</span>}
          </li>
        ))}

        {/* Logout Section */}
        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-700">
          <li
            title={isCollapsed ? "Logout" : ""}
            onClick={handleLogout}
            className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg text-red-400 hover:bg-red-500/20 hover:text-red-300 cursor-pointer transition-all duration-200 text-sm sm:text-base"
          >
            <i className="fa-solid fa-right-from-bracket text-sm sm:text-lg flex-shrink-0"></i>
            {!isCollapsed && <span className="font-medium truncate">Logout</span>}
          </li>
        </div>
      </ul>

      {/* Footer */}
      {!isCollapsed && (
        <div className="p-3 sm:p-4 border-t border-gray-700">
          <div className="text-center text-gray-500 text-xs">
            <p>© 2024 MuseoSmart</p>
            <p className="mt-1">Cagayan de Oro City Museum</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black opacity-50"
            onClick={() => setShowMobileSidebar(false)}
          ></div>
          <div className="relative z-50 w-64 h-full">{SidebarContent}</div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex">{SidebarContent}</aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <nav className="bg-white shadow-sm border-b border-gray-200 px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Mobile toggle and title */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <button
                className="md:hidden text-[#2e2b41] p-1 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => setShowMobileSidebar(true)}
              >
                <i className="fa-solid fa-bars text-lg sm:text-xl"></i>
              </button>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[#2e2b41] truncate">
                {activeTab}
              </h1>
            </div>
            
            {/* User info */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Refresh button for staff users */}
              {user?.role === 'staff' && (
                <button
                  onClick={handleRefreshUser}
                  className="p-1 sm:p-2 text-[#AB8841] hover:bg-[#AB8841]/10 rounded-lg transition-colors"
                  title="Refresh permissions"
                >
                  <i className="fa-solid fa-sync-alt text-sm sm:text-base"></i>
                </button>
              )}
              <div className="flex items-center gap-2 text-[#2e2b41]">
                {/* Profile Photo */}
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border-2 border-[#AB8841] bg-gray-100 flex-shrink-0">
                  {user?.profile_photo ? (
                    <img 
                      src={`http://localhost:3000/uploads/profiles/${user.profile_photo}`}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full flex items-center justify-center ${user?.profile_photo ? 'hidden' : ''}`}>
                    <i className="fa-solid fa-user text-xs sm:text-sm text-gray-400"></i>
                  </div>
                </div>
                
                <span className="font-medium text-xs sm:text-sm md:text-base truncate max-w-24 sm:max-w-32 md:max-w-none">
                  {user ? `${user.firstname} ${user.lastname}` : "Admin User"}
                </span>
              </div>
            </div>
          </div>
        </nav>

        {/* Main content area */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 bg-gray-50 overflow-auto">
          <div className="max-w-full">
            {activeTab === "Dashboard" && <Dashboard userPermissions={userPermissions} setActiveTab={setActiveTab} />}
            {activeTab === "Schedule" && <Schedule userPermissions={userPermissions} />}
            {activeTab === "Visitors" && <Visitors userPermissions={userPermissions} />}
            {activeTab === "Scanner" && <VisitorScanner userPermissions={userPermissions} />}
            {activeTab === "Exhibit" && <Exhibit userPermissions={userPermissions} />}
            {activeTab === "Event" && <Event userPermissions={userPermissions} />}
            {activeTab === "CulturalObjects" && <CulturalObjects userPermissions={userPermissions} />}
            {activeTab === "Archive" && <Archive userPermissions={userPermissions} />}
            {activeTab === "Donation" && <Donation userPermissions={userPermissions} />}
            {activeTab === "Reports" && <Reports userPermissions={userPermissions} />}
            {activeTab === "Settings" && <Settings userPermissions={userPermissions} />}
            {activeTab === "AddUser" && <AddUser />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
