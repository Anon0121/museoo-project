import React, { useState } from "react";

const initialGeneral = {
  donor_name: "",
  donor_email: "",
  donor_contact: "",
  type: "monetary",
  date_received: "",
  notes: "",
};

const initialDetails = {
  amount: "",
  method: "",
  item_description: "",
  estimated_value: "",
  condition: "",
  loan_start_date: "",
  loan_end_date: "",
};

const DonationForm = ({ onSuccess }) => {
  const [general, setGeneral] = useState(initialGeneral);
  const [details, setDetails] = useState(initialDetails);
  const [loading, setLoading] = useState(false);

  const handleGeneralChange = (e) => {
    setGeneral({ ...general, [e.target.name]: e.target.value });
  };

  const handleDetailsChange = (e) => {
    setDetails({ ...details, [e.target.name]: e.target.value });
  };

  const handleTypeChange = (e) => {
    setGeneral({ ...general, type: e.target.value });
    setDetails(initialDetails); // reset details on type change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Combine general and details for submission
    const payload = { ...general, ...details };

    try {
      const res = await fetch("http://localhost:3000/api/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        alert("Donation recorded!");
        setGeneral(initialGeneral);
        setDetails(initialDetails);
        if (onSuccess) onSuccess();
      } else {
        alert("Failed to record donation.");
      }
    } catch (err) {
      alert("Error saving donation.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded shadow p-6 max-w-xl mx-auto space-y-4">
      <h2 className="text-xl font-bold mb-2">Add Donation</h2>
      <div>
        <label className="block font-medium mb-1">Donor Name *</label>
        <input
          type="text"
          name="donor_name"
          value={general.donor_name}
          onChange={handleGeneralChange}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>
      <div>
        <label className="block font-medium mb-1">Donor Email</label>
        <input
          type="email"
          name="donor_email"
          value={general.donor_email}
          onChange={handleGeneralChange}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block font-medium mb-1">Donor Contact</label>
        <input
          type="text"
          name="donor_contact"
          value={general.donor_contact}
          onChange={handleGeneralChange}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block font-medium mb-1">Donation Type *</label>
        <select
          name="type"
          value={general.type}
          onChange={handleTypeChange}
          className="w-full border rounded px-3 py-2"
        >
          <option value="monetary">Monetary</option>
          <option value="in-kind">In-Kind (Object)</option>
          <option value="loan">Loaned Artifact</option>
        </select>
      </div>
      <div>
        <label className="block font-medium mb-1">Date Received</label>
        <input
          type="date"
          name="date_received"
          value={general.date_received}
          onChange={handleGeneralChange}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <div>
        <label className="block font-medium mb-1">Notes</label>
        <textarea
          name="notes"
          value={general.notes}
          onChange={handleGeneralChange}
          className="w-full border rounded px-3 py-2"
        />
      </div>

      {/* Type-specific fields */}
      {general.type === "monetary" && (
        <>
          <div>
            <label className="block font-medium mb-1">Amount *</label>
            <input
              type="number"
              name="amount"
              value={details.amount}
              onChange={handleDetailsChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Method</label>
            <input
              type="text"
              name="method"
              value={details.method}
              onChange={handleDetailsChange}
              className="w-full border rounded px-3 py-2"
              placeholder="e.g., Cash, Check, Online"
            />
          </div>
        </>
      )}

      {general.type === "in-kind" && (
        <>
          <div>
            <label className="block font-medium mb-1">Item Description *</label>
            <textarea
              name="item_description"
              value={details.item_description}
              onChange={handleDetailsChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Estimated Value</label>
            <input
              type="number"
              name="estimated_value"
              value={details.estimated_value}
              onChange={handleDetailsChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Condition</label>
            <input
              type="text"
              name="condition"
              value={details.condition}
              onChange={handleDetailsChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </>
      )}

      {general.type === "loan" && (
        <>
          <div>
            <label className="block font-medium mb-1">Item Description *</label>
            <textarea
              name="item_description"
              value={details.item_description}
              onChange={handleDetailsChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Estimated Value</label>
            <input
              type="number"
              name="estimated_value"
              value={details.estimated_value}
              onChange={handleDetailsChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Condition</label>
            <input
              type="text"
              name="condition"
              value={details.condition}
              onChange={handleDetailsChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Loan Start Date</label>
            <input
              type="date"
              name="loan_start_date"
              value={details.loan_start_date}
              onChange={handleDetailsChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Loan End Date</label>
            <input
              type="date"
              name="loan_end_date"
              value={details.loan_end_date}
              onChange={handleDetailsChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </>
      )}

      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
        disabled={loading}
      >
        {loading ? "Saving..." : "Save Donation"}
      </button>
    </form>
  );
};

export default DonationForm;
