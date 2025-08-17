import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../../config/api";
import citymus from "../../assets/citymus.jpg";
import logo from "../../assets/logo.png";

const AdditionalVisitorForm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [visitorInfo, setVisitorInfo] = useState({
    firstName: "",
    lastName: "",
    gender: "", // Remove default - force user to choose
    address: "",
    nationality: "", // Remove default - force user to choose
    institution: "",
    purpose: "educational"
  });

  useEffect(() => {
    const fetchTokenInfo = async () => {
      if (!token) {
        setError("No token provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(`/api/additional-visitors/${token}`);
        
        if (response.data.success) {
          const tokenData = response.data.tokenInfo;
          
          // Check if link is expired
          if (tokenData.linkExpired) {
            setError("This link has expired. Please contact the museum for assistance.");
            setLoading(false);
            return;
          }
          
          setTokenInfo(tokenData);
          // Pre-fill email from token info
          setVisitorInfo(prev => ({
            ...prev,
            email: tokenData.email
          }));
        } else {
          setError("Invalid or expired token");
        }
      } catch (err) {
        console.error("Error fetching token info:", err);
        setError("Failed to load token information");
      } finally {
        setLoading(false);
      }
    };

    fetchTokenInfo();
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setVisitorInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await api.put(`/api/additional-visitors/${token}`, {
        firstName: visitorInfo.firstName,
        lastName: visitorInfo.lastName,
        gender: visitorInfo.gender,
        address: visitorInfo.address,
        nationality: visitorInfo.nationality
        // institution and purpose are automatically set from primary visitor
      });

      if (response.data.success) {
        setSuccess(true);
        // Redirect after 3 seconds
        setTimeout(() => {
          navigate("/");
        }, 3000);
      } else {
        setError(response.data.error || "Failed to update information");
      }
    } catch (err) {
      console.error("Error updating visitor info:", err);
      setError("Failed to update information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !success) {
    return (
      <div className="min-h-screen bg-cover bg-center" style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${citymus})`
      }}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-cover bg-center" style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${citymus})`
      }}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-white rounded-lg p-8 text-center max-w-md mx-4">
            <div className="text-green-500 text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Information Completed!</h2>
            <p className="text-gray-600 mb-4">
              Your details have been successfully saved. Please keep your QR code safe for check-in on your visit day.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to homepage in 3 seconds...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !tokenInfo) {
    const isExpired = error.includes('expired') || error.includes('already been completed');
    return (
      <div className="min-h-screen bg-cover bg-center" style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${citymus})`
      }}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-white rounded-lg p-8 text-center max-w-md mx-4">
            <div className={`text-6xl mb-4 ${isExpired ? 'text-orange-500' : 'text-red-500'}`}>
              {isExpired ? '⏰' : '❌'}
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {isExpired ? 'Link Expired' : 'Invalid Link'}
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
            {isExpired && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <p className="text-orange-700 text-sm">
                  <strong>Note:</strong> Your QR code will still work for check-in on your visit day, even though this form link has expired.
                </p>
              </div>
            )}
            <button
              onClick={() => navigate("/")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cover bg-center" style={{
      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${citymus})`
    }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <img src={logo} alt="MuseoSmart Logo" className="h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Complete Your Information</h1>
          <p className="text-white/80">Please fill out your details to complete your museum visit</p>
          {tokenInfo && (
            <div className="mt-4 p-3 bg-white/10 rounded-lg">
              <p className="text-white text-sm">
                <strong>Visit Date:</strong> {tokenInfo.visitDate} | <strong>Time:</strong> {tokenInfo.visitTime}
              </p>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={visitorInfo.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={visitorInfo.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                                 {/* Gender */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Gender *
                   </label>
                   <select
                     name="gender"
                     value={visitorInfo.gender}
                     onChange={handleInputChange}
                     required
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   >
                     <option value="">Pick your gender</option>
                     <option value="male">Male</option>
                     <option value="female">Female</option>
                     <option value="lgbt">LGBT</option>
                     <option value="prefer_not_to_say">Prefer not to say</option>
                   </select>
                 </div>

                 {/* Nationality */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     Nationality *
                   </label>
                   <select
                     name="nationality"
                     value={visitorInfo.nationality}
                     onChange={handleInputChange}
                     required
                     className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   >
                     <option value="">Choose your nationality</option>
                     <option value="local">Local</option>
                     <option value="foreign">Foreign</option>
                   </select>
                 </div>

                {/* Email (read-only) */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={visitorInfo.email}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address *
                  </label>
                  <textarea
                    name="address"
                    value={visitorInfo.address}
                    onChange={handleInputChange}
                    required
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                                          {/* Institution (read-only, same as primary visitor) */}
         <div className="md:col-span-2">
           <label className="block text-sm font-medium text-gray-700 mb-2">
             Institution/Organization
           </label>
           <input
             type="text"
             value={tokenInfo?.primaryInstitution || tokenInfo?.primaryPurpose || 'Educational'}
             disabled
             className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
           />
           <p className="text-xs text-gray-500 mt-1">Same as primary visitor's institution</p>
         </div>

                                          {/* Purpose (read-only, same as primary visitor) */}
         <div className="md:col-span-2">
           <label className="block text-sm font-medium text-gray-700 mb-2">
             Purpose of Visit
           </label>
           <input
             type="text"
             value={tokenInfo?.primaryPurpose || 'Educational'}
             disabled
             className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
           />
           <p className="text-xs text-gray-500 mt-1">Same as primary visitor's purpose</p>
         </div>
              </div>

              {/* Submit Button */}
              <div className="text-center">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200"
                >
                  {loading ? "Saving..." : "Complete Registration"}
                </button>
              </div>
            </form>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">What happens next?</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Your information will be saved in our system</li>
                <li>• Keep your QR code safe for check-in on your visit day</li>
                <li>• Present your QR code at the museum entrance</li>
                <li>• Enjoy your museum visit!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdditionalVisitorForm;
