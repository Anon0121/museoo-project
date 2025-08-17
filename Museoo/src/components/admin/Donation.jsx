import React, { useState, useEffect } from "react";
import axios from "axios";

const Donation = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [approving, setApproving] = useState(null);
  const [previewLetter, setPreviewLetter] = useState(null);
  const [showEmailTest, setShowEmailTest] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);

  const [formData, setFormData] = useState({
    donor_name: "",
    donor_email: "",
    donor_contact: "",
    type: "monetary",
    date_received: new Date().toISOString().split('T')[0],
    notes: "",
    amount: "",
    method: "",
    item_description: "",
    estimated_value: "",
    condition: "",
    loan_start_date: "",
    loan_end_date: "",
  });

  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchDonations();
  }, []);

  const fetchDonations = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/donations');
      setDonations(response.data.donations || []);
    } catch (error) {
      console.error('Error fetching donations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (donationId) => {
    setApproving(donationId);
    try {
      const response = await axios.post(`http://localhost:3000/api/donations/${donationId}/approve`);
      if (response.data.success) {
        if (response.data.emailError) {
          alert(`✅ Donation approved! However, there was an issue sending the email: ${response.data.emailError}\n\nPlease check the email configuration in your .env file.`);
        } else {
          alert('✅ Donation approved! A beautiful appreciation letter has been sent successfully to the donor.');
        }
        fetchDonations(); // Refresh the list
      }
    } catch (error) {
      console.error('Error approving donation:', error);
      alert('❌ Error approving donation');
    } finally {
      setApproving(null);
    }
  };

  const previewAppreciationLetter = (donation) => {
    const donationTypeLabels = {
      monetary: 'Monetary Donation',
      artifact: 'Artifact/Historical Item',
      document: 'Document/Archive',
      loan: 'Loan (Temporary)'
    };

    const formatDonationDetails = () => {
      let details = [];
      
      if (donation.type === 'monetary' && donation.amount) {
        details.push(`Amount: ₱${parseFloat(donation.amount).toLocaleString()}`);
      }
      
      if (donation.method) {
        details.push(`Payment Method: ${donation.method}`);
      }
      
      if (donation.item_description) {
        details.push(`Item Description: ${donation.item_description}`);
      }
      
      if (donation.estimated_value) {
        details.push(`Estimated Value: ₱${parseFloat(donation.estimated_value).toLocaleString()}`);
      }
      
      return details;
    };

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
        <div style="background-color: #ffffff; padding: 40px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; border-bottom: 3px solid #8B6B21; padding-bottom: 20px; margin-bottom: 30px;">
            <div style="font-size: 24px; font-weight: bold; color: #8B6B21; margin-bottom: 10px;">🏛️ Cagayan de Oro City Museum</div>
            <div style="color: #666; font-size: 14px;">Preserving Our Cultural Heritage</div>
          </div>
          
          <div style="text-align: right; color: #666; margin-bottom: 30px; font-size: 14px;">
            ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          
          <div style="font-size: 18px; margin-bottom: 20px; color: #2e2b41;">
            Dear ${donation.donor_name},
          </div>
          
          <div style="margin-bottom: 30px; text-align: justify;">
            <p>On behalf of the entire team at the Cagayan de Oro City Museum, I am delighted to inform you that your generous donation has been approved and accepted with great appreciation.</p>
            
            <p>Your contribution plays a vital role in our mission to preserve and showcase the rich cultural heritage of Cagayan de Oro. Your support enables us to continue our work in educating the community and future generations about our city's history and cultural significance.</p>
            
            <div style="background-color: #f8f9fa; border-left: 4px solid #8B6B21; padding: 20px; margin: 20px 0; border-radius: 5px;">
              <h3 style="color: #8B6B21; margin-top: 0; margin-bottom: 15px;">📋 Donation Details</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li><strong>Type:</strong> ${donationTypeLabels[donation.type]}</li>
                <li><strong>Date Received:</strong> ${new Date(donation.date_received).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</li>
                ${formatDonationDetails().map(detail => `<li><strong>${detail.split(':')[0]}:</strong> ${detail.split(':')[1]}</li>`).join('')}
              </ul>
            </div>
            
            <p>We are truly grateful for your generosity and commitment to preserving our cultural heritage. Your donation will be carefully documented and utilized to enhance our museum's collections and educational programs.</p>
            
            <p>Our team will contact you soon to arrange the collection or transfer of your donation, and to discuss any specific requirements or arrangements you may have.</p>
          </div>
          
          <div style="margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px;">
            <p>Once again, thank you for your invaluable support.</p>
            <p style="font-weight: bold; color: #8B6B21;">Dr. Maria Santos</p>
            <p style="color: #666; font-size: 14px;">Museum Director</p>
            <p style="color: #666; font-size: 14px;">Cagayan de Oro City Museum</p>
          </div>
          
          <div style="background-color: #8B6B21; color: white; padding: 15px; border-radius: 5px; margin-top: 20px; text-align: center;">
            <h4 style="margin: 0 0 10px 0;">📞 Contact Information</h4>
            <p style="margin: 5px 0; font-size: 14px;">📍 Address: City Hall Complex, Cagayan de Oro City</p>
            <p style="margin: 5px 0; font-size: 14px;">📧 Email: museum@cagayandeoro.gov.ph</p>
            <p style="margin: 5px 0; font-size: 14px;">📱 Phone: (088) 123-4567</p>
            <p style="margin: 5px 0; font-size: 14px;">🌐 Website: www.cagayandeoromuseum.gov.ph</p>
          </div>
        </div>
      </div>
    `;

    setPreviewLetter({
      donor: donation.donor_name,
      email: donation.donor_email,
      content: htmlContent
    });
  };

  const closePreview = () => {
    setPreviewLetter(null);
  };

  const downloadAppreciationLetter = async (donationId, donorName) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/donations/${donationId}/appreciation-letter`, {
        responseType: 'blob'
      });
      
      // Create a blob URL and trigger download
      const blob = new Blob([response.data], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `appreciation-letter-${donorName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      alert('✅ Appreciation letter downloaded successfully!');
    } catch (error) {
      console.error('Error downloading appreciation letter:', error);
      alert('❌ Error downloading appreciation letter');
    }
  };

  const testEmailFunction = async () => {
    if (!testEmail) {
      alert('Please enter a test email address');
      return;
    }

    setTestingEmail(true);
    try {
      const response = await axios.post('http://localhost:3000/api/donations/test-email', {
        testEmail: testEmail
      });
      
      if (response.data.success) {
        alert('✅ Test email sent successfully! Check your inbox.');
        setShowEmailTest(false);
        setTestEmail('');
      } else {
        alert(`❌ Test email failed: ${response.data.error}`);
      }
    } catch (error) {
      console.error('Test email error:', error);
      alert('❌ Error sending test email. Check console for details.');
    } finally {
      setTestingEmail(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);

    try {
      const res = await axios.post("http://localhost:3000/api/donations", formData);
      if (res.data.success) {
        alert("Donation recorded successfully!");
        setFormData({
          donor_name: "",
          donor_email: "",
          donor_contact: "",
          type: "monetary",
          date_received: new Date().toISOString().split('T')[0],
          notes: "",
          amount: "",
          method: "",
          item_description: "",
          estimated_value: "",
          condition: "",
          loan_start_date: "",
          loan_end_date: "",
        });
        setShowForm(false);
        fetchDonations();
      } else {
        alert("Failed to record donation.");
      }
    } catch (err) {
      alert("Error saving donation.");
    }
    setFormLoading(false);
  };

  const renderMonetaryFields = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[#2e2b41] font-semibold mb-2">
            Amount (₱) *
          </label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
            placeholder="Enter amount"
            required
          />
        </div>
        <div>
          <label className="block text-[#2e2b41] font-semibold mb-2">
            Payment Method
          </label>
          <select
            name="method"
            value={formData.method}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[#2e2b41] font-semibold mb-2">
            Item Description *
          </label>
          <textarea
            name="item_description"
            value={formData.item_description}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
            rows="3"
            placeholder="Describe the artifact in detail"
            required
          />
        </div>
        <div>
          <label className="block text-[#2e2b41] font-semibold mb-2">
            Estimated Value (₱)
          </label>
          <input
            type="number"
            name="estimated_value"
            value={formData.estimated_value}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
            placeholder="Estimated value"
          />
        </div>
      </div>
      <div>
        <label className="block text-[#2e2b41] font-semibold mb-2">
          Condition
        </label>
        <select
          name="condition"
          value={formData.condition}
          onChange={handleChange}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[#2e2b41] font-semibold mb-2">
            Loan Start Date *
          </label>
          <input
            type="date"
            name="loan_start_date"
            value={formData.loan_start_date}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
            required
          />
        </div>
        <div>
          <label className="block text-[#2e2b41] font-semibold mb-2">
            Loan End Date *
          </label>
          <input
            type="date"
            name="loan_end_date"
            value={formData.loan_end_date}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
            required
          />
        </div>
      </div>
      {renderArtifactFields()}
    </>
  );

  const getStatusBadge = (status) => {
    const badges = {
      pending: "bg-yellow-100 text-yellow-800 border border-yellow-200",
      approved: "bg-green-100 text-green-800 border border-green-200",
      rejected: "bg-red-100 text-red-800 border border-red-200"
    };
    return badges[status] || "bg-gray-100 text-gray-800 border border-gray-200";
  };

  const getTypeBadge = (type) => {
    const badges = {
      monetary: "bg-blue-100 text-blue-800 border border-blue-200",
      artifact: "bg-purple-100 text-purple-800 border border-purple-200",
      document: "bg-indigo-100 text-indigo-800 border border-indigo-200",
      loan: "bg-orange-100 text-orange-800 border border-orange-200"
    };
    return badges[type] || "bg-gray-100 text-gray-800 border border-gray-200";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-[#2e2b41]">
          <i className="fa-solid fa-spinner fa-spin mr-2"></i>
          Loading donations...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-[#2e2b41] mb-2">
              <i className="fa-solid fa-hand-holding-dollar mr-3"></i>
              Donation Management
            </h2>
            <p className="text-gray-600">Manage and approve donation requests from visitors</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowEmailTest(true)}
              className="bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition-colors font-semibold shadow-md"
            >
              <i className="fa-solid fa-envelope mr-2"></i>
              Test Email
            </button>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-[#AB8841] text-white px-6 py-3 rounded-lg hover:bg-[#8B6B21] transition-colors font-semibold shadow-md"
            >
              <i className="fa-solid fa-plus mr-2"></i>
              {showForm ? "Cancel" : "Add Donation"}
            </button>
          </div>
        </div>
      </div>

      {/* Add Donation Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
          <h3 className="text-2xl font-bold text-[#2e2b41] mb-6">
            <i className="fa-solid fa-plus-circle mr-3"></i>
            Add New Donation
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Donor Information */}
            <div className="border-b border-gray-200 pb-6">
              <h4 className="text-xl font-semibold text-[#2e2b41] mb-4">
                <i className="fa-solid fa-user mr-2"></i>
                Donor Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#2e2b41] font-semibold mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="donor_name"
                    value={formData.donor_name}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                    placeholder="Enter donor's full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#2e2b41] font-semibold mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="donor_email"
                    value={formData.donor_email}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                    placeholder="Enter donor's email"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[#2e2b41] font-semibold mb-2">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    name="donor_contact"
                    value={formData.donor_contact}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                    placeholder="Enter contact number"
                  />
                </div>
                <div>
                  <label className="block text-[#2e2b41] font-semibold mb-2">
                    Date Received *
                  </label>
                  <input
                    type="date"
                    name="date_received"
                    value={formData.date_received}
                    onChange={handleChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Donation Type */}
            <div className="border-b border-gray-200 pb-6">
              <h4 className="text-xl font-semibold text-[#2e2b41] mb-4">
                <i className="fa-solid fa-gift mr-2"></i>
                Donation Details
              </h4>
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2">
                  Donation Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                  required
                >
                  <option value="monetary">Monetary Donation</option>
                  <option value="artifact">Artifact/Historical Item</option>
                  <option value="document">Document/Archive</option>
                  <option value="loan">Loan (Temporary)</option>
                </select>
              </div>

              {/* Conditional Fields Based on Type */}
              <div className="mt-6">
                {formData.type === 'monetary' && renderMonetaryFields()}
                {formData.type === 'artifact' && renderArtifactFields()}
                {formData.type === 'document' && renderArtifactFields()}
                {formData.type === 'loan' && renderLoanFields()}
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="block text-[#2e2b41] font-semibold mb-2">
                Additional Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                rows="4"
                placeholder="Any additional information about the donation..."
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                className="bg-[#AB8841] hover:bg-[#8B6B21] text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-md"
                disabled={formLoading}
              >
                {formLoading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-save mr-2"></i>
                    Save Donation
                  </>
                )}
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

      {/* Donations List */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#AB8841] to-[#8B6B21]">
          <h3 className="text-xl font-bold text-white">
            <i className="fa-solid fa-list mr-2"></i>
            All Donations ({donations.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">
                  Donor
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">
                  Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {donations.map((donation) => (
                <tr key={donation.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-semibold text-[#2e2b41]">
                        {donation.donor_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {donation.donor_email}
                      </div>
                      {donation.donor_contact && (
                        <div className="text-xs text-gray-400">
                          {donation.donor_contact}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getTypeBadge(donation.type)}`}>
                      <i className={`fa-solid ${
                        donation.type === 'monetary' ? 'fa-money-bill' :
                        donation.type === 'artifact' ? 'fa-landmark' :
                        donation.type === 'document' ? 'fa-file-alt' :
                        'fa-clock'
                      } mr-1`}></i>
                      {donation.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-[#2e2b41]">
                      {donation.type === 'monetary' && donation.amount && (
                        <div className="font-semibold">₱{parseFloat(donation.amount).toLocaleString()}</div>
                      )}
                      {donation.item_description && (
                        <div className="truncate max-w-xs text-gray-600">{donation.item_description}</div>
                      )}
                      {donation.method && (
                        <div className="text-xs text-gray-500">Method: {donation.method}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(donation.status)}`}>
                      <i className={`fa-solid ${
                        donation.status === 'pending' ? 'fa-clock' :
                        donation.status === 'approved' ? 'fa-check' :
                        'fa-times'
                      } mr-1`}></i>
                      {donation.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {donation.date_received ? new Date(donation.date_received).toLocaleDateString() : '-'}
                  </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {donation.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(donation.id)}
                            disabled={approving === donation.id}
                            className="bg-[#AB8841] hover:bg-[#8B6B21] text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold mr-2"
                          >
                            {approving === donation.id ? (
                              <>
                                <i className="fa-solid fa-spinner fa-spin mr-1"></i>
                                Approving...
                              </>
                            ) : (
                              <>
                                <i className="fa-solid fa-check mr-1"></i>
                                Approve
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => previewAppreciationLetter(donation)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors text-xs font-semibold mr-2"
                          >
                            <i className="fa-solid fa-eye mr-1"></i>
                            Preview Letter
                          </button>
                        </>
                      )}
                      {donation.status === 'approved' && (
                        <button
                          onClick={() => downloadAppreciationLetter(donation.id, donation.donor_name)}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors text-xs font-semibold"
                        >
                          <i className="fa-solid fa-download mr-1"></i>
                          Download Letter
                        </button>
                      )}
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {donations.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <i className="fa-solid fa-inbox text-4xl mb-4 text-gray-300"></i>
            <p className="text-lg">No donations found</p>
            <p className="text-sm">Donations will appear here once submitted</p>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewLetter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-full overflow-y-auto">
            <h3 className="text-2xl font-bold text-[#2e2b41] mb-4">
              <i className="fa-solid fa-envelope mr-2"></i>
              Appreciation Letter Preview
            </h3>
            <div className="text-lg text-[#2e2b41] mb-4">
              <p>Dear {previewLetter.donor},</p>
              <p>This is a preview of the appreciation letter that will be sent to you upon approval of your donation.</p>
              <p>Please review the content and ensure it accurately reflects the details of your donation.</p>
            </div>
            <div className="overflow-hidden" dangerouslySetInnerHTML={{ __html: previewLetter.content }} />
            <div className="flex justify-end mt-6">
              <button
                onClick={closePreview}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-md"
              >
                <i className="fa-solid fa-times mr-2"></i>
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Email Modal */}
      {showEmailTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold text-[#2e2b41] mb-4">
              <i className="fa-solid fa-envelope mr-2"></i>
              Test Email Configuration
            </h3>
            <p className="text-gray-600 mb-4">
              Send a test appreciation letter to verify your email configuration is working correctly.
            </p>
            <div className="mb-4">
              <label className="block text-[#2e2b41] font-semibold mb-2">
                Test Email Address
              </label>
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]"
                placeholder="Enter email address to test"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEmailTest(false);
                  setTestEmail('');
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={testEmailFunction}
                disabled={testingEmail}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {testingEmail ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-1"></i>
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-paper-plane mr-1"></i>
                    Send Test Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Donation;
