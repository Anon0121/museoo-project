import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import citymus from "../../assets/citymus.jpg";
import logo from "../../assets/logo.png";
import axios from "axios";

const LoginForm = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    const { username, password } = formData;
    if (!username || !password) {
      setErrorMessage("Please enter username and password.");
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:3000/api/login",
        { username, password },
        { withCredentials: true }
      );

      if (res.data.success) {
        setErrorMessage("Login successful! Redirecting...");
        setTimeout(() => {
          navigate("/admin");
        }, 1000);
      } else {
        setErrorMessage(res.data.message || "Login failed.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setErrorMessage("Connection error. Please try again.");
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center px-4"
      style={{
        backgroundImage: `linear-gradient(rgba(4,9,30,0.7), rgba(4,9,30,0.7)), url(${citymus})`,
      }}
    >
      <div className="bg-[#91936e] p-8 rounded-2xl shadow-lg w-full max-w-md text-white text-center">
        <Link to="/">
          <img src={logo} alt="Logo" className="w-24 mx-auto mb-4" />
        </Link>
        <h1 className="text-3xl font-bold text-[#2e2b41] mb-2">Log-In</h1>
        {errorMessage && (
          <p className="text-sm text-red-300 whitespace-pre-wrap mb-4">
            {errorMessage}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
          <div>
            <label className="text-[#2e2b41] font-semibold mb-1 block">
              <span className="icon flex items-center gap-2 text-lg">
                <i className="fa-solid fa-user"></i> USERNAME
              </span>
            </label>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              className="w-full p-3 rounded-md border-2 bg-[#f3f0ff] text-black focus:outline-none focus:border-[#AB8841]"
              required
            />
          </div>

          <div>
            <label className="text-[#2e2b41] font-semibold mb-1 block">
              <span className="icon flex items-center gap-2 text-lg">
                <i className="fa-solid fa-lock"></i> PASSWORD
              </span>
            </label>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-3 rounded-md border-2 bg-[#f3f0ff] text-black focus:outline-none focus:border-[#AB8841]"
              required
            />
          </div>

          <button
            type="submit"
            className="bg-[#AB8841] hover:bg-[#2e2b41] transition-colors text-white py-3 rounded-md font-semibold"
          >
            Log-In
          </button>
        </form>

        <p className="mt-4 text-sm">
          <Link
            to="/signup"
            className="text-[#f3f0ff] hover:text-[#AB8841] font-bold"
          >
            New Account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
