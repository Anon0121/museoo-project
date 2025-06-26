import React, { useState, useEffect } from "react";
const ALL_BOOKINGS_API = "http://localhost:3000/api/slots/all";

const SLOT_API = "http://localhost:3000/api/slots";
const SLOT_CAPACITY = 30;

const Schedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    nationality: "",
    gender: "Male",
    address: "",
    purpose: "",
    visitType: "Walk-in",
    visitDate: "",
    selectedSlot: "",
    status: "Pending",
  });
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  
  // New state for filtering and search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("visitors");
    if (saved) setSchedules(JSON.parse(saved));
  }, []);

  // Save to localStorage whenever schedules change
  useEffect(() => {
    localStorage.setItem("visitors", JSON.stringify(schedules));
  }, [schedules]);

  // Fetch slots when date changes
  useEffect(() => {
    if (!form.visitDate) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    fetch(`${SLOT_API}?date=${form.visitDate}`)
      .then(res => res.json())
      .then(data => {
        setSlots(Array.isArray(data) ? data : []);
        setLoadingSlots(false);
      })
      .catch(() => {
        setSlots([]);
        setLoadingSlots(false);
      });
  }, [form.visitDate]);

  const fetchBookings = () => {
    setLoadingBookings(true);
    fetch(ALL_BOOKINGS_API)
      .then(res => res.json())
      .then(data => {
        setBookings(Array.isArray(data) ? data : []);
        setLoadingBookings(false);
      })
      .catch(() => {
        setBookings([]);
        setLoadingBookings(false);
      });
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleInputChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSlotSelect = (slotTime) => {
    setForm({ ...form, selectedSlot: slotTime });
  };

  const addSchedule = async (e) => {
    e.preventDefault();
    if (!form.selectedSlot) return;

    const payload = {
      type: "individual",
      mainVisitor: {
        firstName: form.firstName,
        lastName: form.lastName,
        gender: form.gender,
        address: form.address,
        email: "", // Add email if you want to collect it
        nationality: form.nationality,
      },
      groupMembers: [],
      totalVisitors: 1,
      date: form.visitDate,
      time: form.selectedSlot,
    };

    try {
      const res = await fetch("http://localhost:3000/api/slots/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setForm({
          firstName: "",
          lastName: "",
          nationality: "",
          gender: "Male",
          address: "",
          purpose: "",
          visitType: "Walk-in",
          visitDate: "",
          selectedSlot: "",
          status: "Pending",
        });
        fetchBookings();
      } else {
        alert("Failed to add booking.");
      }
    } catch (err) {
      alert("Error adding booking.");
    }
  };

  const updateStatus = (id, status) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    );
  };

  const deleteSchedule = async (bookingId) => {
    if (window.confirm('Delete this schedule?')) {
      try {
        const response = await fetch(`http://localhost:3000/api/slots/bookings/${bookingId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          alert('Booking deleted successfully!');
          fetchBookings(); // Refresh the list
        } else {
          alert('Failed to delete booking');
        }
      } catch (error) {
        console.error('Error deleting booking:', error);
        alert('Error deleting booking');
      }
    }
  };

  // New action handlers for booking management
  const handleViewBooking = async (booking) => {
    try {
      // Fetch detailed visitor information from the database
      const response = await fetch(`http://localhost:3000/api/slots/bookings/${booking.booking_id}/details`);
      let details = "";
      if (response.ok) {
        const visitorData = await response.json();
        details = `\n📋 Booking Details\n\n--- Visitor Information ---\nName: ${visitorData.first_name} ${visitorData.last_name}\nGender: ${visitorData.gender}\nNationality: ${visitorData.nationality}\nEmail: ${visitorData.email || 'Not provided'}\nAddress: ${visitorData.address}\n\n--- Booking Information ---\nBooking ID: ${booking.booking_id}\nType: ${booking.type}\nStatus: ${booking.status}\nDate: ${formatDate(booking.date)}\nTime Slot: ${booking.time_slot}\nTotal Visitors: ${booking.total_visitors}\nCreated: ${formatDate(booking.created_at)}\n`;
      } else {
        details = `\n📋 Booking Details\n\n--- Visitor Information ---\nName: ${booking.first_name} ${booking.last_name}\n\n--- Booking Information ---\nBooking ID: ${booking.booking_id}\nType: ${booking.type}\nStatus: ${booking.status}\nDate: ${formatDate(booking.date)}\nTime Slot: ${booking.time_slot}\nTotal Visitors: ${booking.total_visitors}\nCreated: ${formatDate(booking.created_at)}\n`;
      }
      alert(details);
    } catch (error) {
      console.error('Error fetching booking details:', error);
      alert('Error fetching booking details.');
    }
  };

  const handleApproveBooking = async (booking) => {
    if (window.confirm(`Approve booking for ${booking.first_name} ${booking.last_name}?`)) {
      try {
        // You'll need to implement this API endpoint
        const response = await fetch(`http://localhost:3000/api/slots/bookings/${booking.booking_id}/approve`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'approved' })
        });
        
        if (response.ok) {
          alert('Booking approved successfully!');
          fetchBookings(); // Refresh the list
        } else {
          alert('Failed to approve booking');
        }
      } catch (error) {
        console.error('Error approving booking:', error);
        alert('Error approving booking');
      }
    }
  };

  const handleCancelBooking = async (booking) => {
    if (window.confirm(`Cancel booking for ${booking.first_name} ${booking.last_name}?`)) {
      try {
        const response = await fetch(`http://localhost:3000/api/slots/bookings/${booking.booking_id}/cancel`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'cancelled' })
        });
        if (response.ok) {
          alert('Booking cancelled successfully!');
          fetchBookings(); // Refresh the list
        } else {
          alert('Failed to cancel booking');
        }
      } catch (error) {
        console.error('Error cancelling booking:', error);
        alert('Error cancelling booking');
      }
    }
  };

  // Filter bookings based on search and filters
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = searchTerm === "" || 
      `${booking.first_name} ${booking.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.booking_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    const matchesDate = dateFilter === "" || booking.date === dateFilter;
    const matchesType = typeFilter === "all" || booking.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesDate && matchesType;
  });

  // Get status badge styling
  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      confirmed: "bg-green-100 text-green-800 border-green-200",
      approved: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
      completed: "bg-blue-100 text-blue-800 border-blue-200"
    };
    
    return `px-3 py-1 rounded-full text-xs font-medium border ${statusStyles[status?.toLowerCase()] || statusStyles.pending}`;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-200 text-gray-800 p-6">
      <h1 className="text-2xl font-bold mb-6 text-blue-900">Schedule a Visit (Admin)</h1>
      <form
        onSubmit={addSchedule}
        className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input label="First Name" name="firstName" value={form.firstName} onChange={handleInputChange} required />
          <Input label="Last Name" name="lastName" value={form.lastName} onChange={handleInputChange} required />
          <Select label="Nationality" name="nationality" value={form.nationality} onChange={handleInputChange} required options={["Filipino", "American", "British", "Other"]} />
          <Select label="Gender" name="gender" value={form.gender} onChange={handleInputChange} required options={["Male", "Female"]} />
          <Input label="Address" name="address" value={form.address} onChange={handleInputChange} required className="md:col-span-2" />
          <Select label="Purpose" name="purpose" value={form.purpose} onChange={handleInputChange} required options={["Education", "Research", "Leisure", "Cultural"]} />
          <Input label="Visit Date" type="date" name="visitDate" value={form.visitDate} onChange={handleInputChange} required />
        </div>
        {/* Time Slot Table */}
        {form.visitDate && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4 text-blue-800">Select a Time Slot</h2>
            {loadingSlots ? (
              <div className="text-blue-600">Loading slots...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-blue-200 rounded-lg">
                  <thead>
                    <tr className="bg-blue-100">
                      <th className="py-2 px-4 border-b">Time</th>
                      <th className="py-2 px-4 border-b">Available Slots</th>
                      <th className="py-2 px-4 border-b">In Percentage</th>
                      <th className="py-2 px-4 border-b">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(slots) && slots.map(slot => {
                      if (slot.time === "12:00 - 13:00") return null; // Skip lunch break
                      return (
                        <tr key={slot.time}>
                          <td>{slot.time}</td>
                          <td>{slot.capacity - slot.booked} / {slot.capacity}</td>
                          <td>{Math.round((slot.booked / slot.capacity) * 100)}%</td>
                          <td>
                            <button
                              type="button"
                              onClick={() => handleSlotSelect(slot.time)}
                              disabled={slot.booked >= slot.capacity}
                              className={`px-4 py-1 rounded ${form.selectedSlot === slot.time ? 'bg-blue-700 text-white' : 'bg-gray-200 text-blue-700'} ${slot.booked >= slot.capacity ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600 hover:text-white'}`}
                            >
                              {slot.booked >= slot.capacity ? "Full" : (form.selectedSlot === slot.time ? "Selected" : "Select")}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        <button
          type="submit"
          className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-lg text-lg font-semibold shadow"
          disabled={!form.selectedSlot}
        >
          Add Schedule
        </button>
      </form>

      {/* Enhanced Bookings Display */}
      <div className="mt-10 max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">All Bookings</h2>
                <p className="text-blue-100 mt-1">Manage and view all museum visit bookings</p>
              </div>
              <div className="mt-4 md:mt-0">
                <button
                  onClick={fetchBookings}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200"
                >
                  🔄 Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  placeholder="Search by name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="approved">Approved</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Date Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="individual">Individual</option>
                  <option value="group">Group</option>
                </select>
              </div>

              {/* Results Count */}
              <div className="flex items-end">
                <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-medium">
                  {filteredBookings.length} bookings
                </div>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="overflow-x-auto">
            {loadingBookings ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading bookings...</p>
                </div>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📋</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
                <p className="text-gray-500">Try adjusting your search or filters</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visitor</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visitors</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBookings.map((booking, index) => (
                    <tr key={booking.booking_id || index} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {booking.first_name} {booking.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatDate(booking.created_at)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-mono">
                          {String(booking.booking_id).substring(0, 8)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          booking.type === 'group' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {booking.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(booking.date)}</div>
                        <div className="text-sm text-gray-500">{booking.time_slot}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadge(booking.status)}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <span className="mr-2">👥</span>
                          {booking.total_visitors}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {booking.status === 'cancelled' ? (
                            <button className="text-gray-600 hover:text-gray-900 transition-colors duration-150" onClick={() => deleteSchedule(booking.booking_id)}>
                              🗑️ Delete
                            </button>
                          ) : (
                            <>
                              <button className="text-blue-600 hover:text-blue-900 transition-colors duration-150" onClick={() => handleViewBooking(booking)}>
                                👁️ View
                              </button>
                              <button className="text-red-600 hover:text-red-900 transition-colors duration-150" onClick={() => handleCancelBooking(booking)}>
                                ✕ Cancel
                              </button>
                              <button className="text-gray-600 hover:text-gray-900 transition-colors duration-150" onClick={() => deleteSchedule(booking.booking_id)}>
                                🗑️ Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination or Summary */}
          {filteredBookings.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{filteredBookings.length}</span> of <span className="font-medium">{bookings.length}</span> bookings
                </div>
                <div className="text-sm text-gray-500">
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
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

// Reusable Select
const Select = ({ label, options, className = "", ...props }) => (
  <div className={className}>
    <label className="block font-medium mb-1">{label}</label>
    <select {...props} className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300">
      <option value="">Select {label}</option>
      {options.map((opt, idx) => (
        <option key={idx} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

export default Schedule;
