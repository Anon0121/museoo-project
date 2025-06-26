import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import citymus from "../../assets/citymus.jpg";
import logo from "../../assets/logo.png";

const TIME_SLOTS = [
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
  // "12:00 - 13:00", // Lunch break, skip this
  "13:00 - 14:00",
  "14:00 - 15:00",
  "15:00 - 16:00",
  "16:00 - 17:00"
];
const SLOT_CAPACITY = 30;

const ScheduleVisit = () => {
  const [isGroup, setIsGroup] = useState(false);
  const [visitDate, setVisitDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [slots, setSlots] = useState([]); // [{ time, booked }]
  const [mainVisitor, setMainVisitor] = useState({
    firstName: "",
    lastName: "",
    gender: "male",
    address: "",
    email: "",
    nationality: "",
    purpose: "educational",
  });
  const [groupMembers, setGroupMembers] = useState([]);

  // Mock fetch slots from backend
  useEffect(() => {
    if (!visitDate) {
      setSlots([]);
      return;
    }
    fetch(`http://localhost:3000/api/slots?date=${visitDate}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSlots(data);
        } else {
          setSlots([]); // fallback if backend returns error object
        }
      })
      .catch(() => setSlots([]));
  }, [visitDate]);

  const handleMainChange = (e) => {
    const { name, value } = e.target;
    setMainVisitor((prev) => ({ ...prev, [name]: value }));
  };

  const handleGroupChange = (id, e) => {
    const { name, value } = e.target;
    setGroupMembers((prev) =>
      prev.map((member) =>
        member.id === id ? { ...member, [name]: value } : member
      )
    );
  };

  const addGroupMember = () => {
    setGroupMembers((prev) => [
      ...prev,
      {
        id: Date.now(),
        firstName: "",
        lastName: "",
        gender: "male",
        address: "",
        email: "",
        nationality: "",
        purpose: mainVisitor.purpose || "educational",
      },
    ]);
  };

  const removeGroupMember = (id) => {
    setGroupMembers((prev) => prev.filter((member) => member.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      type: isGroup ? "group" : "individual",
      mainVisitor,
      groupMembers: isGroup ? groupMembers.map(member => ({ ...member, purpose: member.purpose || mainVisitor.purpose || "educational" })) : [],
      totalVisitors: isGroup ? 1 + groupMembers.length : 1,
      date: visitDate,
      time: selectedSlot,
    };
    fetch("http://localhost:3000/api/slots/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("Booking submitted successfully!");
        // Optionally reset form here
      } else {
        alert("Booking submission failed. Please try again later.");
      }
    })
    .catch(error => {
      console.error("Error submitting booking:", error);
      alert("An error occurred. Please try again later.");
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 text-gray-800">
      {/* Navigation */}
      <nav
        className="flex justify-between items-center px-6 py-4 bg-cover bg-center shadow"
        style={{
          backgroundImage: `linear-gradient(rgba(4,9,30,0.7), rgba(4,9,30,0.7)), url(${citymus})`,
        }}
      >
        <Link to="/">
          <img src={logo} className="w-24" alt="Logo" />
        </Link>
        <ul className="hidden md:flex space-x-8 text-white text-lg font-medium">
          <li><a href="#home" className="hover:text-yellow-200">HOME</a></li>
          <li><a href="#about" className="hover:text-yellow-200">ABOUT</a></li>
          <li><a href="#exhibit" className="hover:text-yellow-200">EXHIBITS</a></li>
          <li><a href="#event" className="hover:text-yellow-200">EVENTS</a></li>
          <li><a href="#contact" className="hover:text-yellow-200">CONTACT</a></li>
        </ul>
      </nav>

      {/* Form Section */}
      <section className="py-16 px-4">
        <div className="max-w-xl mx-auto bg-white shadow-2xl rounded-2xl p-10 border border-blue-100">
          <h1 className="text-3xl font-bold text-center mb-2 text-blue-900">Schedule Your Visit</h1>
          <p className="text-center text-gray-600 mb-8">
            Fill in your details to book a museum tour. All fields are required.
          </p>

          {/* Booking Type Toggle */}
          <div className="flex justify-center mb-8">
            <button
              type="button"
              className={`px-6 py-2 rounded-l-lg font-semibold border ${!isGroup ? 'bg-blue-700 text-white' : 'bg-gray-100 text-blue-700'}`}
              onClick={() => setIsGroup(false)}
            >
              Individual Booking
            </button>
            <button
              type="button"
              className={`px-6 py-2 rounded-r-lg font-semibold border -ml-px ${isGroup ? 'bg-blue-700 text-white' : 'bg-gray-100 text-blue-700'}`}
              onClick={() => setIsGroup(true)}
            >
              Group Booking
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Main Visitor Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="First Name" name="firstName" value={mainVisitor.firstName} onChange={handleMainChange} required />
              <Input label="Last Name" name="lastName" value={mainVisitor.lastName} onChange={handleMainChange} required />
              <Select label="Gender" name="gender" value={mainVisitor.gender} onChange={handleMainChange} options={["Male", "Female", "Other"]} required />
              <Input label="Nationality" name="nationality" value={mainVisitor.nationality} onChange={handleMainChange} required />
              <Input label="Address" name="address" value={mainVisitor.address} onChange={handleMainChange} required className="md:col-span-2" />
              <Input label="Email" name="email" type="email" value={mainVisitor.email} onChange={handleMainChange} required className="md:col-span-2" />
              <Select label="Purpose of Visit" name="purpose" value={mainVisitor.purpose} onChange={handleMainChange} options={["Educational", "Research", "Leisure", "Other"]} required className="md:col-span-2" />
            </div>

            {/* Group Members */}
            {isGroup && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4 text-blue-800">Group Members</h2>
                {groupMembers.map((member, idx) => (
                  <div key={member.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">Member {idx + 1}</span>
                      <button
                        type="button"
                        className="text-red-600 hover:underline text-sm"
                        onClick={() => removeGroupMember(member.id)}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input label="First Name" name="firstName" value={member.firstName} onChange={e => handleGroupChange(member.id, e)} required />
                      <Input label="Last Name" name="lastName" value={member.lastName} onChange={e => handleGroupChange(member.id, e)} required />
                      <Select label="Gender" name="gender" value={member.gender} onChange={e => handleGroupChange(member.id, e)} options={["Male", "Female", "Other"]} required />
                      <Input label="Nationality" name="nationality" value={member.nationality} onChange={e => handleGroupChange(member.id, e)} required />
                      <Input label="Address" name="address" value={member.address} onChange={e => handleGroupChange(member.id, e)} required className="md:col-span-2" />
                      <Input label="Email" name="email" type="email" value={member.email} onChange={e => handleGroupChange(member.id, e)} required className="md:col-span-2" />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded mt-2 font-semibold"
                  onClick={addGroupMember}
                >
                  Add Group Member
                </button>
              </div>
            )}

            {/* Date Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Visit Date" type="date" required value={visitDate} onChange={e => setVisitDate(e.target.value)} />
            </div>

            {/* Time Slot Table */}
            {visitDate && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold mb-4 text-blue-800">Select a Time Slot</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-blue-200 rounded-lg">
                    <thead>
                      <tr className="bg-blue-100">
                        <th className="py-2 px-4 border-b">Time</th>
                        <th className="py-2 px-4 border-b">Available Slots</th>
                        <th className="py-2 px-4 border-b">Percentage</th>
                        <th className="py-2 px-4 border-b"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(slots) && slots.map(slot => {
                        if (slot.time === "12:00 - 13:00") return null; // Skip lunch break
                        return (
                          <tr key={slot.time}>
                            <td className="pl-7">{slot.time}</td>
                            <td className="pl-10">{slot.capacity - slot.booked} / {slot.capacity}</td>
                            <td className="pl-10">{Math.round((slot.booked / slot.capacity) * 100)}%</td>
                            <td>
                              <button
                                type="button"
                                onClick={() => setSelectedSlot(slot.time)}
                                disabled={slot.booked >= slot.capacity}
                                className={`px-4 py-1 rounded ${selectedSlot === slot.time ? 'bg-blue-700 text-white' : 'bg-gray-200 text-blue-700'} ${slot.booked >= slot.capacity ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600 hover:text-white'}`}
                              >
                                {slot.booked >= slot.capacity
                                  ? "Full"
                                  : (selectedSlot === slot.time ? "Selected" : "Select")}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <button
              type="submit"
              className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-lg text-lg font-semibold shadow"
              disabled={!selectedSlot}
            >
              Book Visit
            </button>
          </form>
        </div>
      </section>

      <footer className="bg-gray-900 text-white text-center py-4 mt-10 rounded-t-xl">
        &copy; 2025 Cagayan de Oro City Museum. All rights reserved.
      </footer>
    </div>
  );
};

// Reusable Input
const Input = ({ label, className = "", ...props }) => (
  <div className={className}>
    <label className="block font-medium mb-1">{label}</label>
    <input {...props} className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300" />
  </div>
);

// Select
const Select = ({ label, options, className = "", ...props }) => (
  <div className={className}>
    <label className="block font-medium mb-1">{label}</label>
    <select {...props} className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300">
      {options.map((opt, idx) => (
        <option key={idx} value={opt.toLowerCase()}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

export default ScheduleVisit;
