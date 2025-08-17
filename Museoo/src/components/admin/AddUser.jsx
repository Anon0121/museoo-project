import React, { useState, useEffect } from "react";
import axios from "axios";

const AddUser = () => {
  const [formData, setFormData] = useState({
    username: "",
    firstname: "",
    lastname: "",
    email: "",
    role: "",
  });

  const [permissions, setPermissions] = useState({
    dashboard: { allowed: true },
    schedule: { allowed: true },
    visitors: { allowed: true },
    scanner: { allowed: true },
    exhibit: { allowed: true },
    event: { allowed: true },
    cultural_objects: { allowed: true },
    archive: { allowed: true },
    donation: { allowed: true },
    reports: { allowed: true },
    settings: { allowed: true },
  });

  const [message, setMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState("");
  const [logsOffset, setLogsOffset] = useState(0);
  const logsLimit = 10;
  const [userPermissions, setUserPermissions] = useState({
    dashboard: { allowed: true },
    schedule: { allowed: false },
    visitors: { allowed: true },
    scanner: { allowed: true },
    exhibit: { allowed: false },
    event: { allowed: false },
    cultural_objects: { allowed: false },
    archive: { allowed: false },
    donation: { allowed: true },
    reports: { allowed: false },
    settings: { allowed: true },
  });

  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:3000/api/users");
      if (res.data.success && Array.isArray(res.data.users)) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error("❌ Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchLogs();
  }, []);



  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setMessage("");
  };

  const handlePermissionChange = (permission, field, value) => {
    setPermissions(prev => ({
      ...prev,
      [permission]: {
        ...prev[permission],
        [field]: value
      }
    }));
  };

  const handleRoleChange = (e) => {
    const role = e.target.value;
    setFormData(prev => ({ ...prev, role }));
    
    // Reset permissions based on role
    if (role === 'admin') {
      setPermissions({
        dashboard: { allowed: true },
        schedule: { allowed: true },
        visitors: { allowed: true },
        scanner: { allowed: true },
        exhibit: { allowed: true },
        event: { allowed: true },
        cultural_objects: { allowed: true },
        archive: { allowed: true },
        donation: { allowed: true },
        reports: { allowed: true },
        settings: { allowed: true },
      });
    } else if (role === 'staff') {
      setPermissions({
        dashboard: { allowed: true },
        schedule: { allowed: true },
        visitors: { allowed: true },
        scanner: { allowed: true },
        exhibit: { allowed: false },
        event: { allowed: false },
        cultural_objects: { allowed: false },
        archive: { allowed: false },
        donation: { allowed: true },
        reports: { allowed: false },
        settings: { allowed: true },
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, firstname, lastname, email, role } = formData;

    if (!username || !firstname || !lastname || !email || !role) {
      setMessage("Please fill in all fields.");
      return;
    }

    if (!validateEmail(email)) {
      setMessage("Please enter a valid email address.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:3000/api/create-user", {
        username,
        firstname,
        lastname,
        email,
        role: role,
        permissions: permissions,
      });

      if (res.data.success) {
        const emailStatus = res.data.emailSent ? "✅" : "⚠️";
        const emailMessage = res.data.emailSent 
          ? "Credentials have been sent to the user's email."
          : "User created but email sending failed. Please contact the user directly.";
        
        setMessage(`${emailStatus} User created successfully! ${emailMessage}`);
        
        setFormData({
          username: "",
          firstname: "",
          lastname: "",
          email: "",
          role: "",
        });
        setPermissions({
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
        });
        setShowForm(false);
        fetchUsers();
      } else {
        setMessage(res.data.message || "User creation failed.");
      }
    } catch (err) {
      console.error("AddUser error:", err);
      if (err.response && err.response.data) {
        setMessage(err.response.data.message || "Server error. Please try again.");
      } else {
        setMessage("Server error. Please try again.");
      }
    }
  };

  const handleUserAction = async (id, action) => {
    try {
      const res = await axios.post(`http://localhost:3000/api/users/${id}/${action}`);
      if (res.data.success) {
        fetchUsers();
      } else {
        alert("Action failed: " + res.data.message);
      }
    } catch (err) {
      console.error("Action error:", err);
    }
  };

  const handleDeleteUser = async (id) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        const res = await axios.delete(`http://localhost:3000/api/users/${id}`);
        if (res.data.success) {
          fetchUsers();
        } else {
          alert("Delete failed: " + res.data.message);
        }
      } catch (err) {
        console.error("Delete error:", err);
      }
    }
  };

  const fetchLogs = async () => {
    try {
      setLogsLoading(true);
      setLogsError("");
      const res = await axios.get(`http://localhost:3000/api/activity-logs?limit=${logsLimit}&offset=${logsOffset}`, { withCredentials: true });
      if (res.data.success) setLogs(res.data.logs || []);
    } catch (e) {
      setLogsError("Failed to load system logs");
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchLogsFiltered = async (mode) => {
    try {
      setLogsLoading(true);
      setLogsError("");
      const important = mode === 'important' ? '1' : '0';
      const res = await axios.get(`http://localhost:3000/api/activity-logs?limit=${logsLimit}&offset=${logsOffset}&important=${important}`, { withCredentials: true });
      if (res.data.success) setLogs(res.data.logs || []);
    } catch (e) {
      setLogsError("Failed to load system logs");
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchLogsPaged = async (dir) => {
    const nextOffset = Math.max(logsOffset + (dir === 'next' ? logsLimit : -logsLimit), 0);
    setLogsOffset(nextOffset);
    try {
      setLogsLoading(true);
      setLogsError("");
      const res = await axios.get(`http://localhost:3000/api/activity-logs?limit=${logsLimit}&offset=${nextOffset}`, { withCredentials: true });
      if (res.data.success) setLogs(res.data.logs || []);
    } catch (e) {
      setLogsError("Failed to load system logs");
    } finally {
      setLogsLoading(false);
    }
  };

  const handleClearLogs = async () => {
    const older = prompt('Clear logs older than date (YYYY-MM-DD). Leave blank to clear all. Type CONFIRM to proceed.');
    if (older === null) return;
    if (older !== 'CONFIRM' && !/^\d{4}-\d{2}-\d{2}$/.test(older)) {
      alert('Cancelled. To clear all, type CONFIRM. Or provide a date YYYY-MM-DD.');
      return;
    }
    const params = older === 'CONFIRM' ? '' : `?olderThanDate=${older}`;
    if (!confirm('This will permanently delete matching logs. Continue?')) return;
    try {
      await axios.delete(`http://localhost:3000/api/activity-logs${params}`, { withCredentials: true });
      setLogs([]);
      setLogsOffset(0);
      fetchLogs();
    } catch (e) {
      alert('Failed to clear logs');
    }
  };

  const renderLogDescription = (log) => {
    try {
      const d = typeof log.details === 'string' ? JSON.parse(log.details) : (log.details || {});
      switch (log.action) {
        case 'auth.login':
          return 'User logged in';
        case 'auth.logout':
          return 'User logged out';
        case 'activity.create':
          return `Created ${d.type} "${d.title || ''}"`.trim();
        case 'activity.delete':
          return `Deleted activity #${d.activityId}`;
        case 'booking.create':
          return `Created booking #${d.bookingId} (${d.totalVisitors || '?'} visitors)`;
        case 'booking.approve':
          return `Approved booking #${d.bookingId}`;
        case 'booking.cancel':
          return `Cancelled booking #${d.bookingId}`;
        case 'booking.reject':
          return `Rejected booking #${d.bookingId}`;
        case 'cobject.create':
          return `Added Cultural Object #${d.culturalObjectId}`;
        case 'cobject.update':
          return `Updated Cultural Object #${d.culturalObjectId}`;
        case 'cobject.delete':
          return `Deleted Cultural Object #${d.culturalObjectId}`;
        case 'archive.create':
          return `Added Digital Archive "${d.title || ''}"`;
        case 'archive.delete':
          return `Deleted Digital Archive #${d.id}`;
        case 'donation.create':
          return `Added donation from ${d.donor_name || 'donor'}`;
        case 'donation.update':
          return `Updated donation #${d.donationId}`;
        case 'donation.approve':
        case 'donation.approve.email_ok':
          return `Approved donation #${d.donationId}`;
        case 'donation.reject':
          return `Rejected donation #${d.donationId}`;
        case 'visitor.checkin':
          return `Visitor checked in #${d.visitorId}`;
        case 'report.generate':
          return `Generated report (${d.reportType})`;
        case 'report.download.pdf':
          return `Downloaded report #${d.reportId} (PDF)`;
        case 'report.download.csv':
          return `Downloaded report #${d.reportId} (CSV)`;
        default:
          return '';
      }
    } catch {
      return '';
    }
  };

  const handleManagePermissions = async (user) => {
    console.log("🔧 Opening permissions for user:", user);
    
    // Force set permissions first
    const defaultPermissions = {
      dashboard: { allowed: true, access: 'view' },
      schedule: { allowed: false, access: 'none' },
      visitors: { allowed: true, access: 'view' },
      scanner: { allowed: true, access: 'edit' },
      exhibit: { allowed: false, access: 'none' },
      event: { allowed: false, access: 'none' },
      cultural_objects: { allowed: false, access: 'none' },
      archive: { allowed: false, access: 'none' },
      donation: { allowed: true, access: 'view' },
      settings: { allowed: true, access: 'view' },
    };
    
    console.log("📋 Setting permissions:", defaultPermissions);
    setUserPermissions(defaultPermissions);
    
    // Then set user and open modal
    setSelectedUser(user);
    setShowPermissionsModal(true);
    
    console.log("✅ Modal opened with permissions set");
    
    try {
      // Fetch user's current permissions from database
      console.log("📡 Fetching saved permissions for user ID:", user.id);
      const res = await axios.get(`http://localhost:3000/api/users/${user.id}/permissions`, {
        withCredentials: true
      });
      console.log("📋 API response:", res.data);
      
      if (res.data.success && res.data.permissions && Object.keys(res.data.permissions).length > 0) {
        console.log("✅ Loading saved permissions from database:", res.data.permissions);
        setUserPermissions(res.data.permissions);
      } else {
        console.log("⚠️ No saved permissions found, using defaults");
      }
    } catch (err) {
      console.error("❌ Fetch permissions error:", err);
      console.log("⚠️ Using default permissions due to error");
    }
  };

  const handleUserPermissionChange = (permission, field, value) => {
    console.log("🔄 Changing permission:", permission, field, value);
    setUserPermissions(prev => {
      const newPermissions = {
        ...prev,
        [permission]: {
          ...prev[permission],
          [field]: value
        }
      };
      console.log("📋 New permissions state:", newPermissions);
      return newPermissions;
    });
  };

  const handleSavePermissions = async () => {
    try {
      console.log("💾 Saving permissions for user:", selectedUser.id);
      console.log("📋 Permissions to save:", userPermissions);
      console.log("🌐 Making request to:", `http://localhost:3000/api/users/${selectedUser.id}/permissions`);
      
      const res = await axios.put(`http://localhost:3000/api/users/${selectedUser.id}/permissions`, {
        permissions: userPermissions
      }, {
        withCredentials: true
      });
      
      console.log("📡 Save response:", res.data);
      
      if (res.data.success) {
        setMessage("✅ Permissions updated successfully!");
        setShowPermissionsModal(false);
        fetchUsers();
        
        // Show success message for 3 seconds
        setTimeout(() => {
          setMessage("");
        }, 3000);
        
        // Also show what was saved
        console.log("✅ Permissions saved successfully for user:", selectedUser.username);
        console.log("📋 Saved permissions:", userPermissions);
      } else {
        setMessage("❌ Failed to update permissions: " + (res.data.message || "Unknown error"));
      }
    } catch (err) {
      console.error("❌ Update permissions error:", err);
      console.error("❌ Error details:", {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data
      });
      setMessage("❌ Error updating permissions: " + err.message);
    }
  };

  const activeUsers = users.filter((u) => u.status === "active");
  const deactivatedUsers = users.filter((u) => u.status === "deactivated");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-[#2e2b41]">
          <i className="fa-solid fa-spinner fa-spin mr-2"></i>
          Loading users...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#2e2b41] mb-2">
              <i className="fa-solid fa-user-plus mr-3"></i>
              User Management
            </h1>
            <p className="text-gray-600">Create and manage system users</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-[#AB8841] text-white px-6 py-3 rounded-lg hover:bg-[#8B6B21] transition-colors font-semibold shadow-md"
          >
            <i className="fa-solid fa-plus mr-2"></i>
            {showForm ? "Cancel" : "Add New User"}
          </button>
        </div>
      </div>

      {/* Add User Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
          <h3 className="text-2xl font-bold text-[#2e2b41] mb-6">
            <i className="fa-solid fa-user-plus mr-3"></i>
            Add New Staff/Admin User
          </h3>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <i className="fa-solid fa-info-circle text-blue-600 mt-1 mr-3"></i>
              <div>
                <h4 className="font-semibold text-blue-800 mb-2">Auto-Generated Credentials</h4>
                <p className="text-blue-700 text-sm">
                  When you create a new user, the system will automatically generate a secure password 
                  and send the login credentials to the user's email address. The user can then log in 
                  and change their password.
                </p>
              </div>
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-lg mb-6 ${
              message.startsWith("✅") 
                ? "bg-green-100 text-green-800 border border-green-200" 
                : "bg-red-100 text-red-800 border border-red-200"
            }`}>
              <div className="flex items-center">
                <i className={`fa-solid ${
                  message.startsWith("✅") ? "fa-check-circle" : "fa-exclamation-circle"
                } mr-2`}></i>
                <span className="whitespace-pre-wrap">{message}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                  placeholder="Enter username"
                  required
                />
              </div>
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2">
                  Role *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleRoleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                  required
                >
                  <option value="">Select Role</option>
                  <option value="admin">Admin</option>
                  <option value="staff">Staff</option>
                </select>
              </div>
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstname"
                  value={formData.firstname}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                  placeholder="Enter first name"
                  required
                />
              </div>
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                  placeholder="Enter last name"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[#2e2b41] font-semibold mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                  placeholder="Enter email address"
                  required
                />
                <p className="text-sm text-gray-600 mt-1">
                  <i className="fa-solid fa-info-circle mr-1"></i>
                  A secure password will be auto-generated and sent to this email address.
                </p>
              </div>
            </div>

            {/* User Permissions Section */}
            {formData.role === 'staff' && (
              <div className="mt-6">
                <h3 className="text-lg font-bold text-[#2e2b41] mb-4">
                  <i className="fa-solid fa-shield-alt mr-2"></i>
                  User Permissions
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Select which features this user can access in their dashboard:
                </p>
                
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  {Object.entries(permissions).map(([permission, config], index) => (
                    <div key={permission}>
                      <div className="flex items-center justify-between p-4 hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-[#2e2b41] capitalize">
                                {permission.replace('_', ' ')}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {permission === 'dashboard' && "Allows access to the main dashboard and statistics."}
                                {permission === 'schedule' && "Allows management of museum schedules and appointments."}
                                {permission === 'visitors' && "Allows viewing and managing visitor information and records."}
                                {permission === 'scanner' && "Allows scanning QR codes and managing visitor check-ins."}
                                {permission === 'exhibit' && "Allows management of museum exhibits and displays."}
                                {permission === 'event' && "Allows creation and management of museum events."}
                                {permission === 'cultural_objects' && "Allows management of cultural objects and artifacts."}
                                {permission === 'archive' && "Allows access to the digital archive and historical records."}
                                {permission === 'donation' && "Allows viewing and managing donation records."}
                                {permission === 'settings' && "Allows access to account settings and preferences."}
                              </p>
                            </div>
                            
                            {/* Toggle Switch */}
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">View</span>
                                <input
                                  type="radio"
                                  name={`${permission}-access`}
                                  value="view"
                                  checked={config.allowed && config.access === 'view'}
                                  onChange={() => {
                                    handlePermissionChange(permission, 'allowed', true);
                                    handlePermissionChange(permission, 'access', 'view');
                                  }}
                                  className="w-3 h-3 text-[#AB8841] border-gray-300 focus:ring-[#AB8841]"
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">Edit</span>
                                <input
                                  type="radio"
                                  name={`${permission}-access`}
                                  value="edit"
                                  checked={config.allowed && config.access === 'edit'}
                                  onChange={() => {
                                    handlePermissionChange(permission, 'allowed', true);
                                    handlePermissionChange(permission, 'access', 'edit');
                                  }}
                                  className="w-3 h-3 text-[#AB8841] border-gray-300 focus:ring-[#AB8841]"
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">Admin</span>
                                <input
                                  type="radio"
                                  name={`${permission}-access`}
                                  value="admin"
                                  checked={config.allowed && config.access === 'admin'}
                                  onChange={() => {
                                    handlePermissionChange(permission, 'allowed', true);
                                    handlePermissionChange(permission, 'access', 'admin');
                                  }}
                                  className="w-3 h-3 text-[#AB8841] border-gray-300 focus:ring-[#AB8841]"
                                />
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">None</span>
                                <input
                                  type="radio"
                                  name={`${permission}-access`}
                                  value="none"
                                  checked={!config.allowed}
                                  onChange={() => handlePermissionChange(permission, 'allowed', false)}
                                  className="w-3 h-3 text-[#AB8841] border-gray-300 focus:ring-[#AB8841]"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {index < Object.keys(permissions).length - 1 && (
                        <div className="border-t border-gray-200"></div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <i className="fa-solid fa-info-circle mr-1"></i>
                    <strong>Access Levels:</strong> View (read only), Edit (read/write), Admin (full control), None (no access)
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="bg-[#AB8841] hover:bg-[#8B6B21] text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-md"
              >
                <i className="fa-solid fa-user-plus mr-2"></i>
                Create User
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-md"
              >
                <i className="fa-solid fa-times mr-2"></i>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
              <i className="fa-solid fa-users text-green-600 text-xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-green-600">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <i className="fa-solid fa-user-shield text-blue-600 text-xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-blue-600">{activeUsers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
              <i className="fa-solid fa-user-slash text-red-600 text-xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Deactivated</p>
              <p className="text-2xl font-bold text-red-600">{deactivatedUsers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Users Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-500 to-green-600">
          <h3 className="text-xl font-bold text-white">
            <i className="fa-solid fa-users mr-2"></i>
            Active Users ({activeUsers.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activeUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <i className="fa-solid fa-users text-4xl mb-4 text-gray-300"></i>
                      <p className="text-lg">No active users found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                activeUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-semibold text-[#2e2b41]">
                          {user.username}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.firstname} {user.lastname}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        <i className="fa-solid fa-envelope mr-1"></i>
                        {user.email || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' 
                          ? "bg-purple-100 text-purple-800 border border-purple-200"
                          : "bg-blue-100 text-blue-800 border border-blue-200"
                      }`}>
                        <i className={`fa-solid ${
                          user.role === 'admin' ? 'fa-user-shield' : 'fa-user'
                        } mr-1`}></i>
                        {user.role === 'admin' ? "Admin" : "Staff"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                      {user.role === 'staff' && (
                        <button
                          onClick={() => {
                            console.log("🔘 Permissions button clicked for user:", user);
                            handleManagePermissions(user);
                          }}
                          className="text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          <i className="fa-solid fa-shield-alt mr-1"></i>
                          Permissions
                        </button>
                      )}
                      <button
                        onClick={() => handleUserAction(user.id, "deactivate")}
                        className="text-yellow-600 hover:text-yellow-800 font-semibold"
                      >
                        <i className="fa-solid fa-user-slash mr-1"></i>
                        Deactivate
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Activity Logs */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-600 to-gray-700 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">
            <i className="fa-solid fa-clipboard-list mr-2"></i>
            System Activity Logs
          </h3>
          <div className="flex items-center gap-2">
            <label className="text-white/80 text-sm">Filter:</label>
            <select
              onChange={(e) => fetchLogsFiltered(e.target.value)}
              className="text-white bg-white/10 hover:bg-white/20 px-2 py-1 rounded-md text-sm"
            >
              <option value="all">All</option>
              <option value="important">Important only</option>
            </select>
            <button
              onClick={() => fetchLogsPaged('prev')}
              className="text-white bg-white/10 hover:bg-white/20 px-3 py-1 rounded-md text-sm"
              title="Previous"
            >
              <i className="fa-solid fa-chevron-left"></i>
            </button>
            <button
              onClick={() => fetchLogsPaged('next')}
              className="text-white bg-white/10 hover:bg-white/20 px-3 py-1 rounded-md text-sm"
              title="Next"
            >
              <i className="fa-solid fa-chevron-right"></i>
            </button>
            <button onClick={fetchLogs} className="text-white bg-white/10 hover:bg-white/20 px-3 py-1 rounded-md text-sm">
            <i className="fa-solid fa-rotate mr-1"></i>
            Refresh
            </button>
            <button
              onClick={handleClearLogs}
              className="text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded-md text-sm"
              title="Clear logs"
            >
              <i className="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {logsLoading ? (
            <div className="p-6 text-center text-gray-600">
              <i className="fa-solid fa-spinner fa-spin mr-2"></i>
              Loading logs...
            </div>
          ) : logsError ? (
            <div className="p-6 text-center text-red-600">{logsError}</div>
          ) : logs.length === 0 ? (
            <div className="p-6 text-center text-gray-600">No logs found</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">IP</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">
                      {log.username ? (
                        <span className="font-medium">{log.username}</span>
                      ) : (
                        <span className="text-gray-500">System</span>
                      )}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">{log.role || '—'}</td>
                    <td className="px-6 py-3 text-sm text-gray-700">{renderLogDescription(log) || log.action}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-700">{log.ip_address || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Deactivated Users Table */}
      {deactivatedUsers.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-500 to-red-600">
            <h3 className="text-xl font-bold text-white">
              <i className="fa-solid fa-user-slash mr-2"></i>
              Deactivated Users ({deactivatedUsers.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deactivatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-semibold text-[#2e2b41]">
                          {user.username}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.firstname} {user.lastname}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        <i className="fa-solid fa-envelope mr-1"></i>
                        {user.email || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' 
                          ? "bg-purple-100 text-purple-800 border border-purple-200"
                          : "bg-blue-100 text-blue-800 border border-blue-200"
                      }`}>
                        <i className={`fa-solid ${
                          user.role === 'admin' ? 'fa-user-shield' : 'fa-user'
                        } mr-1`}></i>
                        {user.role === 'admin' ? "Admin" : "Staff"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                      <button
                        onClick={() => handleUserAction(user.id, "activate")}
                        className="text-green-600 hover:text-green-800 font-semibold"
                      >
                        <i className="fa-solid fa-user-check mr-1"></i>
                        Activate
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-800 font-semibold"
                      >
                        <i className="fa-solid fa-trash mr-1"></i>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Permissions Management Modal */}
      {console.log("🔍 Modal state:", { showPermissionsModal, selectedUser, userPermissions })}
      {console.log("🔍 Should show modal:", showPermissionsModal && selectedUser)}
      {showPermissionsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden">
            {/* Header */}
            <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-[#AB8841] to-[#8B6B21]">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
                    <i className="fa-solid fa-shield-alt text-white text-xl"></i>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      Manage Permissions
                    </h3>
                    <p className="text-white text-opacity-90 text-sm">
                      {selectedUser.firstname} {selectedUser.lastname} ({selectedUser.username})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPermissionsModal(false)}
                  className="text-white hover:text-gray-200 transition-colors p-2 rounded-full hover:bg-white hover:bg-opacity-20"
                >
                  <i className="fa-solid fa-times text-xl"></i>
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="p-8 overflow-y-auto max-h-[calc(95vh-200px)]">
              {/* Info Banner */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                    <i className="fa-solid fa-info text-white text-sm"></i>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-1">Permission Guide</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        <span className="text-green-700">Have Access - User can access this feature</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
                        <span className="text-gray-600">Hide Access - User cannot access this feature</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Permissions Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {console.log("🔍 Rendering permissions:", userPermissions)}
                {console.log("🔍 Permissions keys:", Object.keys(userPermissions))}
                {console.log("🔍 Permissions length:", Object.keys(userPermissions).length)}
                {console.log("🔍 userPermissions type:", typeof userPermissions)}
                {Object.keys(userPermissions).length === 0 ? (
                  <div className="col-span-2 text-center py-8">
                    <div className="text-gray-500">
                      <i className="fa-solid fa-spinner fa-spin text-4xl mb-4"></i>
                      <p className="text-lg">Loading permissions...</p>
                      <p className="text-sm mt-2">Debug: userPermissions is empty</p>
                    </div>
                  </div>
                ) : (
                  Object.entries(userPermissions).map(([permission, config]) => (
                  <div key={permission} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                            permission === 'dashboard' ? 'bg-blue-100 text-blue-600' :
                            permission === 'visitors' ? 'bg-green-100 text-green-600' :
                            permission === 'scanner' ? 'bg-purple-100 text-purple-600' :
                            permission === 'exhibit' ? 'bg-orange-100 text-orange-600' :
                            permission === 'archive' ? 'bg-indigo-100 text-indigo-600' :
                            permission === 'donation' ? 'bg-pink-100 text-pink-600' :
                            permission === 'reports' ? 'bg-teal-100 text-teal-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            <i className={`fa-solid ${
                              permission === 'dashboard' ? 'fa-chart-line' :
                              permission === 'visitors' ? 'fa-users' :
                              permission === 'scanner' ? 'fa-qrcode' :
                              permission === 'exhibit' ? 'fa-landmark' :
                              permission === 'archive' ? 'fa-archive' :
                              permission === 'donation' ? 'fa-hand-holding-heart' :
                              permission === 'reports' ? 'fa-chart-bar' :
                              permission === 'schedule' ? 'fa-calendar' :
                              permission === 'event' ? 'fa-calendar-day' :
                              permission === 'cultural_objects' ? 'fa-museum' :
                              permission === 'settings' ? 'fa-cog' :
                              'fa-cube'
                            } text-sm`}></i>
                          </div>
                          <h4 className="font-bold text-lg text-[#2e2b41] capitalize">
                            {permission.replace('_', ' ')}
                          </h4>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {permission === 'dashboard' && "Access to main dashboard, statistics, and overview data."}
                          {permission === 'schedule' && "Manage museum schedules, appointments, and time slots."}
                          {permission === 'visitors' && "View and manage visitor information, records, and history."}
                          {permission === 'scanner' && "Scan QR codes and manage visitor check-ins and check-outs."}
                          {permission === 'exhibit' && "Manage museum exhibits, displays, and exhibition content."}
                          {permission === 'event' && "Create, edit, and manage museum events and activities."}
                          {permission === 'cultural_objects' && "Manage cultural objects, artifacts, and collections."}
                          {permission === 'archive' && "Access digital archive, historical records, and documents."}
                          {permission === 'donation' && "View and manage donation records and donor information."}
                          {permission === 'reports' && "Generate and view reports, analytics, and data insights."}
                          {permission === 'settings' && "Access account settings, preferences, and profile management."}
                        </p>
                      </div>
                    </div>
                    
                    {/* Access Level Buttons */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleUserPermissionChange(permission, 'allowed', true)}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            config.allowed
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-green-300 hover:bg-green-50'
                          }`}
                        >
                          <div className="text-center">
                            <div className={`w-4 h-4 rounded-full mx-auto mb-1 ${
                              config.allowed ? 'bg-green-500' : 'bg-gray-300'
                            }`}></div>
                            <span className="text-xs font-medium">Have Access</span>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => handleUserPermissionChange(permission, 'allowed', false)}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            !config.allowed
                              ? 'border-gray-400 bg-gray-100 text-gray-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="text-center">
                            <div className={`w-4 h-4 rounded-full mx-auto mb-1 ${
                              !config.allowed ? 'bg-gray-400' : 'bg-gray-300'
                            }`}></div>
                            <span className="text-xs font-medium">Hide Access</span>
                          </div>
                        </button>
                      </div>
                      
                      {/* Current Status */}
                      <div className="text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          !config.allowed ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'
                        }`}>
                          <i className={`fa-solid mr-1 ${
                            !config.allowed ? 'fa-ban' : 'fa-check'
                          }`}></i>
                          {!config.allowed ? 'Access Hidden' : 'Have Access'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
                )}
              </div>
            </div>
            
            {/* Footer */}
            <div className="px-8 py-6 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
              <div className="text-sm text-gray-600">
                <i className="fa-solid fa-info-circle mr-1"></i>
                Changes will be applied immediately when saved
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowPermissionsModal(false)}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 font-semibold transition-colors"
                >
                  <i className="fa-solid fa-times mr-2"></i>
                  Cancel
                </button>
                <button
                  onClick={handleSavePermissions}
                  className="bg-[#AB8841] hover:bg-[#8B6B21] text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-lg hover:shadow-xl"
                >
                  <i className="fa-solid fa-save mr-2"></i>
                  Save Permissions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddUser;
