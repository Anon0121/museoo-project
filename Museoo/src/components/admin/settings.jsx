import React, { useState, useEffect } from "react";
import axios from "axios";
import api from "../../config/api";

const Settings = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [profileForm, setProfileForm] = useState({
    firstname: "",
    lastname: "",
    email: "",
  });

  const [message, setMessage] = useState({ type: "", text: "" });

  // Fetch user data
  const fetchUser = async () => {
    try {
      console.log("🔄 Fetching user data...");
      const res = await api.get("/api/user");
      console.log("📋 User data received:", res.data);
      
      if (res.data.success) {
        setUser(res.data.user);
        setProfileForm({
          firstname: res.data.user.firstname,
          lastname: res.data.user.lastname,
          email: res.data.user.email || "",
        });
        if (res.data.user.profile_photo) {
          setPreviewUrl(`http://localhost:3000/uploads/profiles/${res.data.user.profile_photo}`);
        } else {
          setPreviewUrl(""); // Clear any previous preview
        }
        
        console.log("✅ User status:", res.data.user.status);
        console.log("✅ User role:", res.data.user.role);
      }
    } catch (err) {
      console.error("❌ Fetch user error:", err);
      setMessage({ type: "error", text: "Failed to load user data" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setMessage({ type: "", text: "" });
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setMessage({ type: "", text: "" });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: "error", text: "Please select an image file" });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: "error", text: "File size must be less than 5MB" });
        return;
      }

      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = async () => {
    if (!selectedFile) {
      setMessage({ type: "error", text: "Please select a file to upload" });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('profile_photo', selectedFile);

      const res = await api.post("/api/upload-profile-photo", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        setMessage({ type: "success", text: "Profile photo updated successfully!" });
        setSelectedFile(null);
        fetchUser(); // Refresh user data
      } else {
        setMessage({ type: "error", text: res.data.message || "Failed to upload photo" });
      }
    } catch (err) {
      console.error("❌ Upload error:", err);
      setMessage({ type: "error", text: "Failed to upload photo" });
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    if (!profileForm.firstname || !profileForm.lastname) {
      setMessage({ type: "error", text: "Please fill in all required fields" });
      return;
    }

    try {
      const res = await api.put("/api/update-profile", {
        firstname: profileForm.firstname,
        lastname: profileForm.lastname,
        email: profileForm.email,
      });

      if (res.data.success) {
        setMessage({ type: "success", text: "Profile updated successfully!" });
        setIsEditing(false);
        fetchUser(); // Refresh user data
      } else {
        setMessage({ type: "error", text: res.data.message || "Failed to update profile" });
      }
    } catch (err) {
      console.error("❌ Update error:", err);
      setMessage({ type: "error", text: "Failed to update profile" });
    }
  };

  const validatePasswordStrength = (password) => {
    const errors = [];
    if (password.length < 8) errors.push("Be at least 8 characters long");
    if (!/[A-Z]/.test(password)) errors.push("Include at least one uppercase letter");
    if (!/[a-z]/.test(password)) errors.push("Include at least one lowercase letter");
    if (!/[0-9]/.test(password)) errors.push("Include at least one number");
    if (!/[!@#$%^&*]/.test(password)) errors.push("Include at least one special character");
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { oldPassword, newPassword, confirmPassword } = form;

    if (!oldPassword || !newPassword || !confirmPassword) {
      setMessage({ type: "error", text: "All fields are required." });
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match." });
      setLoading(false);
      return;
    }

    const passwordErrors = validatePasswordStrength(newPassword);
    if (passwordErrors.length > 0) {
      setMessage({ 
        type: "error", 
        text: "Password must meet the following:\n" + passwordErrors.map((e) => `• ${e}`).join("\n")
      });
      setLoading(false);
      return;
    }

    try {
      const res = await api.post("/api/change-password", {
        currentPassword: oldPassword,
        newPassword: newPassword,
      });

      if (res.data.success) {
        setMessage({ type: "success", text: "Password updated successfully!" });
        setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setMessage({ type: "error", text: res.data.message || "Failed to update password" });
      }
    } catch (err) {
      console.error("❌ Change password error:", err);
      setMessage({ type: "error", text: "Failed to update password" });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-[#2e2b41]">
          <i className="fa-solid fa-spinner fa-spin mr-2"></i>
          Loading settings...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-[#AB8841] rounded-full flex items-center justify-center mr-4">
            <i className="fa-solid fa-gear text-white text-xl"></i>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#2e2b41] mb-2">
              Account Settings
            </h1>
            <p className="text-gray-600">Manage your account security and preferences</p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div className={`p-4 rounded-lg ${
          message.type === "error" 
            ? "bg-red-100 text-red-800 border border-red-200" 
            : "bg-green-100 text-green-800 border border-green-200"
        }`}>
          <div className="flex items-center">
            <i className={`fa-solid ${
              message.type === "error" ? "fa-exclamation-circle" : "fa-check-circle"
            } mr-2`}></i>
            <span className="whitespace-pre-wrap">{message.text}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Photo Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <h3 className="text-xl font-bold text-[#2e2b41] mb-4">
            <i className="fa-solid fa-camera mr-2"></i>
            Profile Photo
          </h3>
          
          <div className="text-center">
            {/* Current Photo */}
            <div className="mb-4">
              <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-[#AB8841] bg-gray-100">
                {previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.log("Profile photo failed to load, showing default");
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`w-full h-full flex items-center justify-center ${previewUrl ? 'hidden' : ''}`}>
                  <i className="fa-solid fa-user text-4xl text-gray-400"></i>
                </div>
              </div>
            </div>

            {/* File Upload */}
            <div className="mb-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="profile-photo"
              />
              <label
                htmlFor="profile-photo"
                className="bg-[#AB8841] hover:bg-[#8B6B21] text-white px-4 py-2 rounded-lg cursor-pointer transition-colors font-semibold"
              >
                <i className="fa-solid fa-upload mr-2"></i>
                Choose Photo
              </label>
            </div>

            {selectedFile && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Selected: {selectedFile.name}
                </p>
                <button
                  onClick={handlePhotoUpload}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors font-semibold"
                >
                  <i className="fa-solid fa-save mr-2"></i>
                  Upload Photo
                </button>
              </div>
            )}

            <p className="text-xs text-gray-500">
              Supported formats: JPG, PNG, GIF (max 5MB)
            </p>
          </div>
        </div>

        {/* Account Information */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-[#2e2b41]">
                <i className="fa-solid fa-user mr-2"></i>
                Account Information
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchUser()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg transition-colors text-sm font-semibold"
                  title="Refresh user data"
                >
                  <i className="fa-solid fa-refresh mr-1"></i>
                  Refresh
                </button>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="bg-[#AB8841] hover:bg-[#8B6B21] text-white px-3 py-1 rounded-lg transition-colors text-sm font-semibold"
                >
                  <i className={`fa-solid ${isEditing ? 'fa-times' : 'fa-edit'} mr-1`}></i>
                  {isEditing ? 'Cancel' : 'Edit'}
                </button>
              </div>
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-[#2e2b41] font-semibold mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={user?.username || ""}
                    disabled
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[#2e2b41] font-semibold mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstname"
                      value={profileForm.firstname}
                      onChange={handleProfileChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
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
                      value={profileForm.lastname}
                      onChange={handleProfileChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#2e2b41] font-semibold mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                  />
                </div>

                <div>
                  <label className="block text-[#2e2b41] font-semibold mb-2">
                    Role
                  </label>
                  <input
                    type="text"
                    value={user?.role === 'admin' ? 'Administrator' : 'Staff Member'}
                    disabled
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="bg-[#AB8841] hover:bg-[#8B6B21] text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                  >
                    <i className="fa-solid fa-save mr-2"></i>
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                  >
                    <i className="fa-solid fa-times mr-2"></i>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Username</p>
                  <p className="font-semibold text-[#2e2b41]">{user?.username || "N/A"}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">First Name</p>
                  <p className="font-semibold text-[#2e2b41]">{user?.firstname || "N/A"}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Last Name</p>
                  <p className="font-semibold text-[#2e2b41]">{user?.lastname || "N/A"}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="font-semibold text-[#2e2b41]">{user?.email || "Not set"}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Role</p>
                  <p className="font-semibold text-[#2e2b41]">
                    {user?.role === 'admin' ? 'Administrator' : 'Staff Member'}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Account Status</p>
                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                    user?.status === 'active' 
                      ? "bg-green-100 text-green-800 border border-green-200"
                      : "bg-red-100 text-red-800 border border-red-200"
                  }`}>
                    <i className={`fa-solid ${
                      user?.status === 'active' ? 'fa-check' : 'fa-times'
                    } mr-1`}></i>
                    {user?.status === 'active' ? 'Active' : 'Deactivated'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>



      {/* Password Change Section */}
      <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
        <h3 className="text-2xl font-bold text-[#2e2b41] mb-6">
          <i className="fa-solid fa-lock mr-3"></i>
          Change Password
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[#2e2b41] font-semibold mb-2">
              Current Password *
            </label>
            <input
              type="password"
              name="oldPassword"
              value={form.oldPassword}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
              placeholder="Enter current password"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[#2e2b41] font-semibold mb-2">
                New Password *
              </label>
              <input
                type="password"
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                placeholder="Enter new password"
                required
              />
            </div>

            <div>
              <label className="block text-[#2e2b41] font-semibold mb-2">
                Confirm New Password *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                placeholder="Confirm new password"
                required
              />
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#AB8841] hover:bg-[#8B6B21] text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                  Updating...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-save mr-2"></i>
                  Update Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Security Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-[#2e2b41] mb-4">
            <i className="fa-solid fa-shield-alt mr-2"></i>
            Password Requirements
          </h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center">
              <i className="fa-solid fa-check text-green-500 mr-2"></i>
              At least 8 characters
            </li>
            <li className="flex items-center">
              <i className="fa-solid fa-check text-green-500 mr-2"></i>
              One uppercase letter
            </li>
            <li className="flex items-center">
              <i className="fa-solid fa-check text-green-500 mr-2"></i>
              One lowercase letter
            </li>
            <li className="flex items-center">
              <i className="fa-solid fa-check text-green-500 mr-2"></i>
              One number
            </li>
            <li className="flex items-center">
              <i className="fa-solid fa-check text-green-500 mr-2"></i>
              One special character
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-[#2e2b41] mb-4">
            <i className="fa-solid fa-info-circle mr-2"></i>
            Security Tips
          </h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <i className="fa-solid fa-lightbulb text-yellow-500 mr-2 mt-1"></i>
              Use a unique password for each account
            </li>
            <li className="flex items-start">
              <i className="fa-solid fa-lightbulb text-yellow-500 mr-2 mt-1"></i>
              Avoid using personal information
            </li>
            <li className="flex items-start">
              <i className="fa-solid fa-lightbulb text-yellow-500 mr-2 mt-1"></i>
              Consider using a password manager
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Settings;
