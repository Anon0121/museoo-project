import React, { useState } from 'react';
import api from '../../config/api';

const EventRegistration = ({ exhibit, onClose, onRegistrationSuccess }) => {
  const [form, setForm] = useState({
    firstname: '',
    lastname: '',
    gender: '',
    email: '',
    visitor_type: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      console.log('🔄 Submitting registration for event:', exhibit.id);
      console.log('📝 Form data:', form);
      
      const response = await api.post('/api/event-registrations/register', {
        event_id: exhibit.id,
        ...form
      });

      console.log('📡 Registration response:', response.data);

      if (response.data.success) {
        console.log('✅ Registration successful, showing success popup');
        setShowSuccessPopup(true);
        if (onRegistrationSuccess) {
          onRegistrationSuccess(response.data.registration);
        }
      } else {
        console.log('❌ Registration failed:', response.data.error);
        setError(response.data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      console.error('❌ Error response:', error.response?.data);
      
      // Check if it's an already registered case (which now returns success)
      if (error.response?.data?.success && error.response?.data?.alreadyRegistered) {
        console.log('✅ Already registered case, showing success popup');
        setShowSuccessPopup(true);
        if (onRegistrationSuccess) {
          onRegistrationSuccess(error.response.data.registration);
        }
      } else {
        console.log('❌ Setting error message:', error.response?.data?.error);
        setError(error.response?.data?.error || 'Failed to register for event');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessPopup(false);
    onClose(); // Close the registration form as well
  };

  // Success Popup Component
  const SuccessPopup = () => {
    if (!showSuccessPopup) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="fa-solid fa-check-circle text-white text-3xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Thank You! 🎉</h2>
            
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <i className="fa-solid fa-envelope text-green-500 text-xl mt-1 mr-3"></i>
                <div className="text-left">
                  <h3 className="font-bold text-green-800 mb-2 text-lg">Registration Confirmed</h3>
                  <p className="text-sm text-green-700 mb-3">
                    Thank you for your interest in our event! Please wait for the invitation email with your QR code.
                  </p>
                  <div className="bg-white rounded-lg p-3 border border-green-100">
                    <p className="text-xs text-green-600 font-medium">
                      <i className="fa-solid fa-info-circle mr-1"></i>
                      You will receive an email within 24-48 hours
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <i className="fa-solid fa-bell text-blue-500 text-xl mt-1 mr-3"></i>
                <div className="text-left">
                  <h3 className="font-bold text-blue-800 mb-2 text-lg">What's Next?</h3>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Check your email for the invitation</li>
                    <li>• Save the QR code attachment</li>
                    <li>• Bring the QR code to the event</li>
                    <li>• Arrive 10 minutes early</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <i className="fa-solid fa-exclamation-triangle text-yellow-500 text-xl mt-1 mr-3"></i>
                <div className="text-left">
                  <h3 className="font-bold text-yellow-800 mb-2 text-lg">Important Reminders</h3>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Check your spam folder if no email</li>
                    <li>• Contact us if you don't receive the email</li>
                    <li>• Keep your QR code safe</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={handleCloseSuccess}
              className="w-full bg-gradient-to-r from-[#8B6B21] to-[#D4AF37] hover:from-[#D4AF37] hover:to-[#8B6B21] text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300"
            >
              <i className="fa-solid fa-check mr-2"></i>
              Got it!
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Success Popup */}
      <SuccessPopup />
      
      {/* Registration Form Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-[#2e2b41] to-[#AB8841] p-6 rounded-t-2xl">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Register for Event</h2>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            <p className="text-white/80 mt-2">{exhibit.title}</p>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                <i className="fa-solid fa-exclamation-triangle mr-2"></i>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#2e2b41] font-semibold mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstname"
                    value={form.firstname}
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
                    value={form.lastname}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                    placeholder="Enter last name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#2e2b41] font-semibold mb-2">
                    Gender *
                  </label>
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                    required
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="lgbtq">LGBTQ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#2e2b41] font-semibold mb-2">
                    Visitor Type *
                  </label>
                  <select
                    name="visitor_type"
                    value={form.visitor_type}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                    required
                  >
                    <option value="">Select type</option>
                    <option value="local">Local</option>
                    <option value="foreign">Foreign</option>
                  </select>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-[#2e2b41] mb-2">Event Details</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Date:</strong> {new Date(exhibit.start_date).toLocaleDateString()}</p>
                  <p><strong>Time:</strong> {exhibit.time ? new Date(`2000-01-01T${exhibit.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : 'TBD'}</p>
                  <p><strong>Location:</strong> {exhibit.location}</p>
                  <p><strong>Available Slots:</strong> {(exhibit.max_capacity || 0) - (exhibit.current_registrations || 0)}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-[#8B6B21] to-[#D4AF37] hover:from-[#D4AF37] hover:to-[#8B6B21] text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                      Registering...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-user-plus mr-2"></i>
                      Register Now
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default EventRegistration;
