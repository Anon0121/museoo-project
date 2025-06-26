import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import citymus from "../../assets/citymus.jpg";
import logo from "../../assets/logo.png";

const AddUser = () => {
  const [formData, setFormData] = useState({
    username: "",
    firstname: "",
    lastname: "",
    password: "",
    repeatPassword: "",
    role: "",
  });

  const [message, setMessage] = useState("");
  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
  try {
    const res = await fetch("http://localhost:3000/api/users");
    const data = await res.json();
    console.log("🔍 fetched users:", data); // Add this
    if (data.success && Array.isArray(data.users)) {
      setUsers(data.users);
    }
  } catch (err) {
    console.error("❌ Fetch error:", err);
  }
};


  useEffect(() => {
    fetchUsers();
  }, []);

  const validatePasswordStrength = (password, username) => {
    const errors = [];
    if (password.length < 8) errors.push("Be at least 8 characters long");
    if (!/[A-Z]/.test(password)) errors.push("Include at least one uppercase letter");
    if (!/[a-z]/.test(password)) errors.push("Include at least one lowercase letter");
    if (!/[0-9]/.test(password)) errors.push("Include at least one number");
    if (!/[!@#$%^&*]/.test(password)) errors.push("Include at least one special character");
    if (/(.)\1{2,}/.test(password)) errors.push("Avoid 3+ repeated characters");
    const weak = ["123456", "qwerty", "password", "admin"];
    if (weak.some((w) => password.toLowerCase().includes(w)))
      errors.push("Avoid common patterns");
    if (username && password.toLowerCase().includes(username.toLowerCase()) && username.length > 2)
      errors.push("Don't use your username in the password");
    return errors;
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setMessage("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, firstname, lastname, password, repeatPassword, role } = formData;

    if (!username || !firstname || !lastname || !password || !repeatPassword || !role) {
      setMessage("Please fill in all fields.");
      return;
    }

    if (password !== repeatPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    const passwordErrors = validatePasswordStrength(password, username);
    if (passwordErrors.length > 0) {
      setMessage(
        "Password must meet the following:\n" + passwordErrors.map((e) => `- ${e}`).join("\n")
      );
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          firstname,
          lastname,
          password,
          role: parseInt(role),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage("✅ User created successfully!");
        setFormData({
          username: "",
          firstname: "",
          lastname: "",
          password: "",
          repeatPassword: "",
          role: "",
        });
        fetchUsers();
      } else {
        setMessage(data.message || "Sign-up failed.");
      }
    } catch (err) {
      console.error("AddUser error:", err);
      setMessage("Server error. Please try again.");
    }
  };

  const handleUserAction = async (id, action) => {
    const method = action === "delete" ? "DELETE" : "POST";

    try {
      const res = await fetch(`http://localhost:3000/api/users/${id}/${action}`, {
        method,
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (data.success) {
        fetchUsers();
      } else {
        alert("Action failed: " + data.message);
      }
    } catch (err) {
      console.error("Action error:", err);
    }
  };

  const activeUsers = users.filter((u) => u.status === "active");
  const deactivatedUsers = users.filter((u) => u.status === "deactivated");

  return (
    <div
      className="min-h-screen bg-cover bg-center flex flex-col items-center px-4 py-10"
      style={{
        backgroundImage: `linear-gradient(rgba(4,9,30,0.7),rgba(4,9,30,0.7)), url(${citymus})`,
      }}
    >
      <div className="bg-[#91936e] text-center p-8 rounded-2xl shadow-lg w-full max-w-md text-white mb-10">
        <Link to="/">
          <img src={logo} alt="Logo" className="w-24 mx-auto mb-4" />
        </Link>
        <h1 className="text-3xl font-bold text-[#2e2b41] mb-2">Add New User</h1>

        {message && (
          <p
            className={`text-sm whitespace-pre-wrap mb-4 ${
              message.startsWith("✅") ? "text-green-300" : "text-red-300"
            }`}
          >
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
          {["username", "firstname", "lastname"].map((field) => (
            <div key={field}>
              <label className="text-[#2e2b41] font-semibold mb-1 block">
                {field.charAt(0).toUpperCase() + field.slice(1)}
              </label>
              <input
                type="text"
                name={field}
                value={formData[field]}
                onChange={handleChange}
                className="w-full p-3 rounded-md border-2 bg-[#f3f0ff] text-black"
                required
              />
            </div>
          ))}

          {["password", "repeatPassword"].map((field) => (
            <div key={field}>
              <label className="text-[#2e2b41] font-semibold mb-1 block">
                {field === "repeatPassword" ? "Repeat Password" : "Password"}
              </label>
              <input
                type="password"
                name={field}
                value={formData[field]}
                onChange={handleChange}
                className="w-full p-3 rounded-md border-2 bg-[#f3f0ff] text-black"
                required
              />
            </div>
          ))}

          <div>
            <label className="text-[#2e2b41] font-semibold mb-1 block">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full p-3 rounded-md border-2 bg-[#f3f0ff] text-black"
              required
            >
              <option value="">Select Role</option>
              <option value="1">Admin</option>
              <option value="0">Staff</option>
            </select>
          </div>

          <button
            type="submit"
            className="bg-[#AB8841] hover:bg-[#2e2b41] transition-colors text-white py-3 rounded-md font-semibold"
          >
            Create User
          </button>
        </form>
      </div>

      {/* Active Users */}
      <div className="w-full max-w-4xl bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4 text-[#2e2b41]">Active Users</h2>
        {activeUsers.length === 0 ? (
          <p className="text-gray-500">No active users found.</p>
        ) : (
          <table className="w-full text-sm text-left border-separate border-spacing-y-2">
            <thead className="bg-gray-100 text-gray-700 font-medium">
              <tr>
                <th className="p-3">Username</th>
                <th className="p-3">Full Name</th>
                <th className="p-3">Role</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {activeUsers.map((user) => (
                <tr key={user.id} className="bg-white hover:bg-gray-50">
                  <td className="p-3 font-semibold">{user.username}</td>
                  <td className="p-3">{user.firstname} {user.lastname}</td>
                  <td className="p-3">{user.role === 1 ? "Admin" : "Staff"}</td>
                  <td className="p-3">
                    <button
                      onClick={() => handleUserAction(user.id, "deactivate")}
                      className="text-yellow-600 hover:underline"
                    >
                      Deactivate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Deactivated Users */}
      <div className="w-full max-w-4xl bg-white rounded-lg shadow p-6 mt-8">
        <h2 className="text-xl font-bold mb-4 text-[#2e2b41]">Deactivated Accounts</h2>
        {deactivatedUsers.length === 0 ? (
          <p className="text-gray-500">No deactivated users found.</p>
        ) : (
          <table className="w-full text-sm text-left border-separate border-spacing-y-2">
            <thead className="bg-gray-100 text-gray-700 font-medium">
              <tr>
                <th className="p-3">Username</th>
                <th className="p-3">Full Name</th>
                <th className="p-3">Role</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deactivatedUsers.map((user) => (
                <tr key={user.id} className="bg-white hover:bg-gray-50">
                  <td className="p-3 font-semibold">{user.username}</td>
                  <td className="p-3">{user.firstname} {user.lastname}</td>
                  <td className="p-3">{user.role === 1 ? "Admin" : "Staff"}</td>
                  <td className="p-3 space-x-3">
                    <button
                      onClick={() => handleUserAction(user.id, "activate")}
                      className="text-green-600 hover:underline"
                    >
                      Activate
                    </button>
                    <button
                      onClick={() => handleUserAction(user.id, "delete")}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AddUser;
