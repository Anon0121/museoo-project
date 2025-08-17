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
    gender: "", // Remove default - force user to choose
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
  const [showForm, setShowForm] = useState(false);
  
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
        setShowForm(false);
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
        const response = await fetch(`http://localhost:3000/api/slots/bookings/${booking.booking_id}/approve`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'approved' })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          alert('Booking approved successfully!');
          fetchBookings(); // Only refresh if success
        } else {
          alert('Failed to approve booking: ' + (data.message || 'Unknown error'));
          // Do NOT refresh bookings, so status/button stays as pending
        }
      } catch (error) {
        console.error('Error approving booking:', error);
        alert('Error approving booking');
        // Do NOT refresh bookings, so status/button stays as pending
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
      `${booking.first_name} ${booking.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    const matchesDate = dateFilter === "" || booking.date === dateFilter;
    const matchesType = typeFilter === "all" || booking.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesDate && matchesType;
  });

  // Get status badge styling
  const getStatusBadge = (status) => {
    const statusStyles = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      approved: "bg-green-100 text-green-800 border-green-200",
      'checked-in': "bg-blue-100 text-blue-800 border-blue-200",
      cancelled: "bg-red-100 text-red-800 border-red-200"
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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#2e2b41] mb-2">
              <i className="fa-solid fa-calendar mr-3"></i>
              Schedule Management
            </h1>
            <p className="text-gray-600">Manage museum visit schedules and bookings</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-[#AB8841] text-white px-6 py-3 rounded-lg hover:bg-[#8B6B21] transition-colors font-semibold shadow-md"
          >
            <i className="fa-solid fa-plus mr-2"></i>
            {showForm ? "Cancel" : "Add Schedule"}
          </button>
        </div>
      </div>

      {/* Add Schedule Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
          <h3 className="text-2xl font-bold text-[#2e2b41] mb-6">
            <i className="fa-solid fa-plus-circle mr-3"></i>
            Add New Schedule
          </h3>
          <form onSubmit={addSchedule} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Input label="First Name" name="firstName" value={form.firstName} onChange={handleInputChange} required />
              <Input label="Last Name" name="lastName" value={form.lastName} onChange={handleInputChange} required />
                              <Select label="Nationality" name="nationality" value={form.nationality} onChange={handleInputChange} required options={["Local", "Foreign"]} placeholder="Choose your nationality" />
                              <Select label="Gender" name="gender" value={form.gender} onChange={handleInputChange} required options={["Male", "Female", "LGBT", "Prefer not to say"]} placeholder="Pick your gender" />
              <Input label="Address" name="address" value={form.address} onChange={handleInputChange} required className="md:col-span-2" />
              <Select label="Purpose" name="purpose" value={form.purpose} onChange={handleInputChange} required options={["Education", "Research", "Leisure", "Cultural"]} />
                              <Input 
                  label="Visit Date" 
                  type="date" 
                  name="visitDate" 
                  value={form.visitDate} 
                  onChange={handleInputChange} 
                  required 
                  min={new Date().toISOString().split('T')[0]}
                />
            </div>
            
            {/* Time Slot Table */}
            {form.visitDate && (
              <div className="mt-8">
                <h4 className="text-lg font-semibold mb-4 text-[#2e2b41]">
                  <i className="fa-solid fa-clock mr-2"></i>
                  Select a Time Slot
                </h4>
                {loadingSlots ? (
                  <div className="text-center py-8">
                    <i className="fa-solid fa-spinner fa-spin text-[#AB8841] text-2xl mb-2"></i>
                    <p className="text-gray-600">Loading available slots...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="py-3 px-4 border-b text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">Time</th>
                          <th className="py-3 px-4 border-b text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">Available Slots</th>
                          <th className="py-3 px-4 border-b text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">Capacity</th>
                          <th className="py-3 px-4 border-b text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(slots) && slots.map(slot => {
                          if (slot.time === "12:00 - 13:00") return null; // Skip lunch break
                          return (
                            <tr key={slot.time} className="hover:bg-gray-50">
                              <td className="py-3 px-4 border-b text-sm text-[#2e2b41]">{slot.time}</td>
                              <td className="py-3 px-4 border-b text-sm text-gray-600">{slot.capacity - slot.booked} / {slot.capacity}</td>
                              <td className="py-3 px-4 border-b text-sm text-gray-600">{Math.round((slot.booked / slot.capacity) * 100)}%</td>
                              <td className="py-3 px-4 border-b">
                                <button
                                  type="button"
                                  onClick={() => handleSlotSelect(slot.time)}
                                  disabled={slot.booked >= slot.capacity}
                                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    form.selectedSlot === slot.time 
                                      ? 'bg-[#AB8841] text-white' 
                                      : slot.booked >= slot.capacity 
                                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                                        : 'bg-gray-200 text-[#2e2b41] hover:bg-[#AB8841] hover:text-white'
                                  }`}
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
            
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={!form.selectedSlot}
                className="bg-[#AB8841] hover:bg-[#8B6B21] text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fa-solid fa-plus mr-2"></i>
                Add Schedule
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <i className="fa-solid fa-calendar text-blue-600 text-xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-blue-600">{bookings.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
              <i className="fa-solid fa-clock text-yellow-600 text-xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {bookings.filter(b => b.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
              <i className="fa-solid fa-check text-green-600 text-xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-green-600">
                {bookings.filter(b => b.status === 'approved').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
              <i className="fa-solid fa-times text-red-600 text-xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Cancelled</p>
              <p className="text-2xl font-bold text-red-600">
                {bookings.filter(b => b.status === 'cancelled').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bookings Display */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#2e2b41] to-[#AB8841]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">
                <i className="fa-solid fa-list mr-2"></i>
                All Bookings
              </h2>
              <p className="text-blue-100 mt-1">Manage and view all museum visit bookings</p>
            </div>
            <div className="mt-4 md:mt-0">
            <button
                  onClick={fetchBookings}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-black px-4 py-2 rounded-lg font-medium transition-all duration-200">
                  <i className="fa-solid fa-sync-alt mr-2"></i>
                  Refresh
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
                placeholder="Search by visitor name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="checked-in">Checked In</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] focus:border-transparent"
              />
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="individual">Individual</option>
                <option value="group">Group</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-end">
              <div className="bg-[#AB8841] text-white px-4 py-2 rounded-lg font-medium">
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
                <i className="fa-solid fa-spinner fa-spin text-[#AB8841] text-3xl mb-4"></i>
                <p className="text-gray-600">Loading bookings...</p>
              </div>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <i className="fa-solid fa-calendar text-6xl mb-4 text-gray-300"></i>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">Visitor</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">Visitors</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBookings.map((booking, index) => (
                  <tr key={booking.booking_id || index} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-4">
                          <div className="text-sm font-medium text-[#2e2b41]">
                            {booking.first_name} {booking.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(booking.created_at)}
                          </div>
                        </div>
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
                      <div className="text-sm text-[#2e2b41]">{formatDate(booking.date)}</div>
                      <div className="text-sm text-gray-500">{booking.time_slot}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(booking.status)}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#2e2b41]">
                      <div className="flex items-center">
                        <i className="fa-solid fa-users mr-2 text-[#AB8841]"></i>
                        {booking.total_visitors}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-800 transition-colors duration-150" onClick={() => handleViewBooking(booking)}>
                          <i className="fa-solid fa-eye mr-1"></i>
                          View
                        </button>
                        {booking.status !== 'cancelled' && (
                          <button className="text-orange-600 hover:text-orange-800 transition-colors duration-150" onClick={() => handleCancelBooking(booking)}>
                            <i className="fa-solid fa-times mr-1"></i>
                            Cancel
                          </button>
                        )}
                        {booking.status === 'pending' && (
                          <button
                            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors duration-150"
                            onClick={() => handleApproveBooking(booking)}
                          >
                            <i className="fa-solid fa-check mr-1"></i>
                            Approve
                          </button>
                        )}
                        <button className="text-red-600 hover:text-red-800 transition-colors duration-150" onClick={() => deleteSchedule(booking.booking_id)}>
                          <i className="fa-solid fa-trash mr-1"></i>
                          Delete
                        </button>
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
  );
};

// Reusable Input
const Input = ({ label, className = "", ...props }) => (
  <div className={className}>
    <label className="block text-[#2e2b41] font-semibold mb-2">{label}</label>
    <input {...props} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]" />
  </div>
);

// Reusable Select
const Select = ({ label, options, className = "", placeholder, ...props }) => (
  <div className={className}>
    <label className="block text-[#2e2b41] font-semibold mb-2">{label}</label>
    <select {...props} className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841]">
      <option value="">{placeholder || `Select ${label}`}</option>
      {options.map((opt, idx) => (
        <option key={idx} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

export default Schedule;
