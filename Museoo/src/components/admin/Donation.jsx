import React, { useState } from "react";

const Donation = () => {
  const [donations, setDonations] = useState([]);
  const [form, setForm] = useState({
    name: "",
    amount: "",
    date: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.amount || !form.date) {
      alert("Please fill all fields.");
      return;
    }

    const newDonation = {
      id: Date.now(),
      name: form.name,
      amount: parseFloat(form.amount),
      date: form.date,
    };

    setDonations([newDonation, ...donations]);
    setForm({ name: "", amount: "", date: "" });
  };

  const handleDelete = (id) => {
    setDonations((prev) => prev.filter((donation) => donation.id !== id));
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Donation Records</h1>

      {/* Donation Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow mb-10 space-y-4"
      >
        <div>
          <label className="block font-medium mb-1">Donor Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Amount</label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              step="0.01"
              min="0"
              required
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Date</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded"
        >
          Add Donation
        </button>
      </form>

      {/* Donations Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <h2 className="text-lg font-semibold px-6 pt-6">All Donations</h2>
        {donations.length === 0 ? (
          <p className="text-gray-500 p-6">No donations recorded yet.</p>
        ) : (
          <table className="w-full text-sm text-left border-separate border-spacing-y-2 px-6 pb-6">
            <thead className="bg-gray-100 text-gray-700 font-medium">
              <tr>
                <th className="p-3">Donor</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Date</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((donation) => (
                <tr key={donation.id} className="bg-white hover:bg-gray-50">
                  <td className="p-3 font-semibold">{donation.name}</td>
                  <td className="p-3 text-green-600">
                    {formatCurrency(donation.amount)}
                  </td>
                  <td className="p-3">{donation.date}</td>
                  <td className="p-3">
                    <button
                      onClick={() => handleDelete(donation.id)}
                      className="text-red-600 hover:underline text-sm"
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

export default Donation;
