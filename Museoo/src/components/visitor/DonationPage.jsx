import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import logo from '../../assets/logo.png';
import citymus from '../../assets/citymus.jpg';

const DonationPage = () => {
  const [formData, setFormData] = useState({
    donor_name: '',
    donor_email: '',
    donor_contact: '',
    type: 'monetary',
    date_received: new Date().toISOString().split('T')[0],
    notes: '',
    amount: '',
    method: '',
    item_description: '',
    estimated_value: '',
    condition: '',
    loan_start_date: '',
    loan_end_date: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await axios.post('http://localhost:3000/api/donations', formData);
      
      if (response.data.success) {
        setSubmitStatus({
          type: 'success',
          message: 'Thank you for your donation! We have received your request and will review it. You will receive an email confirmation once it is approved.'
        });
        
        // Reset form
        setFormData({
          donor_name: '',
          donor_email: '',
          donor_contact: '',
          type: 'monetary',
          date_received: new Date().toISOString().split('T')[0],
          notes: '',
          amount: '',
          method: '',
          item_description: '',
          estimated_value: '',
          condition: '',
          loan_start_date: '',
          loan_end_date: ''
        });
      }
    } catch (error) {
      console.error('Donation submission error:', error);
      setSubmitStatus({
        type: 'error',
        message: 'There was an error submitting your donation. Please try again or contact us directly.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderMonetaryFields = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-[#2e2b41] font-semibold mb-1 sm:mb-2 text-xs sm:text-sm">
            Amount (₱) *
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] text-xs sm:text-sm md:text-base"
            placeholder="Enter amount"
            required
          />
        </div>
        <div>
          <label className="block text-[#2e2b41] font-semibold mb-1 sm:mb-2 text-xs sm:text-sm">
            Payment Method
          </label>
          <select
            name="method"
            value={formData.method}
            onChange={handleChange}
            className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] text-xs sm:text-sm md:text-base"
          >
            <option value="">Select method</option>
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="check">Check</option>
            <option value="online">Online Payment</option>
          </select>
        </div>
      </div>
    </>
  );

  const renderArtifactFields = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-[#2e2b41] font-semibold mb-1 sm:mb-2 text-xs sm:text-sm">
            Item Description *
          </label>
          <textarea
            name="item_description"
            value={formData.item_description}
            onChange={handleChange}
            className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] text-xs sm:text-sm md:text-base"
            rows="3"
            placeholder="Describe the artifact in detail"
            required
          />
        </div>
        <div>
          <label className="block text-[#2e2b41] font-semibold mb-1 sm:mb-2 text-xs sm:text-sm">
            Estimated Value (₱)
          </label>
          <input
            type="number"
            name="estimated_value"
            value={formData.estimated_value}
            onChange={handleChange}
            className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] text-xs sm:text-sm md:text-base"
            placeholder="Estimated value"
          />
        </div>
      </div>
      <div>
        <label className="block text-[#2e2b41] font-semibold mb-1 sm:mb-2 text-xs sm:text-sm">
          Condition
        </label>
        <select
          name="condition"
          value={formData.condition}
          onChange={handleChange}
          className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] text-xs sm:text-sm md:text-base"
        >
          <option value="">Select condition</option>
          <option value="excellent">Excellent</option>
          <option value="good">Good</option>
          <option value="fair">Fair</option>
          <option value="poor">Poor</option>
          <option value="needs_restoration">Needs Restoration</option>
        </select>
      </div>
    </>
  );

  const renderLoanFields = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <div>
          <label className="block text-[#2e2b41] font-semibold mb-1 sm:mb-2 text-xs sm:text-sm">
            Loan Start Date *
          </label>
          <input
            type="date"
            name="loan_start_date"
            value={formData.loan_start_date}
            onChange={handleChange}
            className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] text-xs sm:text-sm md:text-base"
            required
          />
        </div>
        <div>
          <label className="block text-[#2e2b41] font-semibold mb-1 sm:mb-2 text-xs sm:text-sm">
            Loan End Date *
          </label>
          <input
            type="date"
            name="loan_end_date"
            value={formData.loan_end_date}
            onChange={handleChange}
            className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] text-xs sm:text-sm md:text-base"
            required
          />
        </div>
      </div>
      {renderArtifactFields()}
    </>
  );

  return (
    <div className="min-h-screen bg-cover bg-center" style={{
      backgroundImage: `linear-gradient(rgba(4,9,30,0.7), rgba(4,9,30,0.7)), url(${citymus})`
    }}>
      {/* Header */}
      <div className="bg-white shadow-lg">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-2 sm:space-x-4">
              <img src={logo} alt="Logo" className="w-12 h-12 sm:w-16 sm:h-16" />
              <h1 className="text-sm sm:text-lg md:text-2xl font-bold text-[#2e2b41]">Cagayan de Oro City Museum</h1>
            </Link>
            <Link
              to="/"
              className="bg-[#AB8841] text-white px-3 sm:px-6 py-2 rounded-lg hover:bg-[#8B6B21] transition-colors text-xs sm:text-sm md:text-base"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="text-center text-white mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Make a Donation</h2>
            <p className="text-sm sm:text-base md:text-lg px-2">
              Support the preservation of our cultural heritage and help us continue our mission
              to educate and inspire future generations.
            </p>
          </div>

          {/* Donation Form */}
          <div className="bg-white rounded-lg shadow-xl p-4 sm:p-6 md:p-8">
            {submitStatus && (
              <div className={`p-3 sm:p-4 rounded-lg mb-4 sm:mb-6 ${
                submitStatus.type === 'success' 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                <div className="flex items-center">
                  <i className={`fa-solid ${
                    submitStatus.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'
                  } mr-2 text-sm sm:text-base`}></i>
                  <span className="text-xs sm:text-sm md:text-base">{submitStatus.message}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Donor Information */}
              <div className="border-b border-gray-200 pb-4 sm:pb-6">
                <h3 className="text-sm sm:text-base md:text-xl font-semibold text-[#2e2b41] mb-3 sm:mb-4">
                  <i className="fa-solid fa-user mr-2 text-sm sm:text-base"></i>
                  Donor Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-[#2e2b41] font-semibold mb-1 sm:mb-2 text-xs sm:text-sm">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="donor_name"
                      value={formData.donor_name}
                      onChange={handleChange}
                      className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] text-xs sm:text-sm md:text-base"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[#2e2b41] font-semibold mb-1 sm:mb-2 text-xs sm:text-sm">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="donor_email"
                      value={formData.donor_email}
                      onChange={handleChange}
                      className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] text-xs sm:text-sm md:text-base"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[#2e2b41] font-semibold mb-1 sm:mb-2 text-xs sm:text-sm">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      name="donor_contact"
                      value={formData.donor_contact}
                      onChange={handleChange}
                      className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] text-xs sm:text-sm md:text-base"
                      placeholder="Enter your contact number"
                    />
                  </div>
                  <div>
                    <label className="block text-[#2e2b41] font-semibold mb-1 sm:mb-2 text-xs sm:text-sm">
                      Date Received *
                    </label>
                    <input
                      type="date"
                      name="date_received"
                      value={formData.date_received}
                      onChange={handleChange}
                      className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] text-xs sm:text-sm md:text-base"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Donation Type */}
              <div className="border-b border-gray-200 pb-4 sm:pb-6">
                <h3 className="text-sm sm:text-base md:text-xl font-semibold text-[#2e2b41] mb-3 sm:mb-4">
                  <i className="fa-solid fa-gift mr-2 text-sm sm:text-base"></i>
                  Donation Details
                </h3>
                <div>
                  <label className="block text-[#2e2b41] font-semibold mb-1 sm:mb-2 text-xs sm:text-sm">
                    Donation Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] text-xs sm:text-sm md:text-base"
                    required
                  >
                    <option value="monetary">Monetary Donation</option>
                    <option value="artifact">Artifact/Historical Item</option>
                    <option value="document">Document/Archive</option>
                    <option value="loan">Loan (Temporary)</option>
                  </select>
                </div>

                {/* Conditional Fields Based on Type */}
                <div className="mt-4 sm:mt-6">
                  {formData.type === 'monetary' && renderMonetaryFields()}
                  {formData.type === 'artifact' && renderArtifactFields()}
                  {formData.type === 'document' && renderArtifactFields()}
                  {formData.type === 'loan' && renderLoanFields()}
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-1 sm:mb-2 text-xs sm:text-sm">
                  Additional Notes
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] text-xs sm:text-sm md:text-base"
                  rows="3"
                  placeholder="Any additional information about your donation..."
                />
              </div>

              {/* Submit Button */}
              <div className="text-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#AB8841] text-white px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 rounded-lg text-xs sm:text-sm md:text-lg font-semibold hover:bg-[#8B6B21] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-paper-plane mr-2"></i>
                      Submit Donation
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Information Section */}
          <div className="mt-6 sm:mt-8 bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <h3 className="text-sm sm:text-base md:text-xl font-semibold text-[#2e2b41] mb-3 sm:mb-4">
              <i className="fa-solid fa-info-circle mr-2 text-sm sm:text-base"></i>
              About Donations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 text-gray-700">
              <div>
                <h4 className="font-semibold text-[#2e2b41] mb-2 text-xs sm:text-sm md:text-base">What We Accept:</h4>
                <ul className="space-y-1 text-xs sm:text-sm">
                  <li>• Historical artifacts and documents</li>
                  <li>• Cultural items and memorabilia</li>
                  <li>• Monetary donations</li>
                  <li>• Temporary loans for exhibitions</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-[#2e2b41] mb-2 text-xs sm:text-sm md:text-base">Process:</h4>
                <ul className="space-y-1 text-xs sm:text-sm">
                  <li>• Submit your donation request</li>
                  <li>• We review and evaluate</li>
                  <li>• You'll receive email confirmation</li>
                  <li>• We arrange collection/transfer</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationPage; 