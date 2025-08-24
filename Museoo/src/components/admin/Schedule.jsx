import React, { useState, useEffect } from "react";
const ALL_BOOKINGS_API = "http://localhost:3000/api/slots/all";

const SLOT_API = "http://localhost:3000/api/slots";
const SLOT_CAPACITY = 30;

const Schedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    visitorType: "",
    gender: "",
    address: "",
    purpose: "",
    institution: "",
    visitType: "indwalkin", // indwalkin or groupwalkin
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
  const [showArchive, setShowArchive] = useState(false);
  const [additionalVisitors, setAdditionalVisitors] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [modalVisitors, setModalVisitors] = useState([]);

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
    // Toggle selection - if clicking the same slot, unselect it
    setForm({ ...form, selectedSlot: form.selectedSlot === slotTime ? "" : slotTime });
  };

  const addSchedule = async (e) => {
    e.preventDefault();
    if (!form.selectedSlot) return;

    // Determine the booking type based on visit type
    let bookingType;
    if (form.visitType === "indwalkin") {
      bookingType = "ind-walkin";
    } else if (form.visitType === "groupwalkin") {
      bookingType = "group-walkin";
    }
    
    // Prepare the payload based on booking type
    let payload;
    
    if (form.visitType === "indwalkin") {
      // Ind-Walkin - Individual walk-in (email + date only, 24h expiration)
      payload = {
        type: bookingType,
        mainVisitor: {
          firstName: "Walk-in",
          lastName: "Visitor",
          email: form.email,
          gender: "",
          address: "",
          visitorType: "",
          purpose: "",
          institution: ""
        },
        groupMembers: [],
        totalVisitors: 1,
        date: form.visitDate,
        time: form.selectedSlot,
      };
    } else if (form.visitType === "groupwalkin") {
      // Group-Walkin - Group walk-in (primary + additional emails, 24h expiration)
      payload = {
        type: bookingType,
        mainVisitor: {
          firstName: "",
          lastName: "",
          email: form.email,
          gender: "",
          address: "",
          visitorType: "",
          purpose: "",
          institution: ""
        },
        groupMembers: additionalVisitors.map(visitor => ({
          firstName: "",
          lastName: "",
          email: visitor.email
        })),
        totalVisitors: 1 + additionalVisitors.length,
        date: form.visitDate,
        time: form.selectedSlot,
      };
    }

    try {
      console.log('Sending booking payload:', payload);
      const res = await fetch("http://localhost:3000/api/slots/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (res.ok) {
        const result = await res.json();
        
        // Show success message with booking details
        let successMessage = `Booking created successfully!\n\nBooking ID: ${result.booking_id}\nType: ${bookingType}\nTotal Visitors: ${payload.totalVisitors}\n\n`;
        
        if (form.visitType === "indwalkin") {
          successMessage += `Ind-Walkin booking created successfully! It is now pending approval. Once approved, the visitor will receive an email with QR code and link to complete their profile (24-hour expiration).`;
        } else if (form.visitType === "groupwalkin") {
          successMessage += `Group-Walkin booking created successfully! It is now pending approval. Once approved, all visitors will receive emails with QR codes and profile completion links (24-hour expiration).`;
        }
        
        alert(successMessage);
        
        // Reset form
        setForm({
          firstName: "",
          lastName: "",
          email: "",
          visitorType: "",
          gender: "",
          address: "",
          purpose: "",
          institution: "",
          visitType: "indwalkin",
          visitDate: "",
          selectedSlot: "",
          status: "Pending",
        });
        setAdditionalVisitors([]);
        setShowForm(false);
        fetchBookings();
      } else {
        const errorData = await res.json();
        alert(`Failed to add booking: ${errorData.message || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Error adding booking:", err);
      alert("Error adding booking. Please try again.");
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
      setSelectedBooking(booking);
      setShowBookingModal(true);
      
      // Set basic booking details from the booking object
      setBookingDetails({
        first_name: booking.first_name,
        last_name: booking.last_name,
        email: booking.email,
        institution: booking.institution
      });

      // Fetch ALL visitors for this booking
      console.log('🔍 Booking type:', booking.type);
      console.log('🔍 Booking ID:', booking.booking_id);
      console.log('🔍 Total visitors:', booking.total_visitors);
      
      console.log('🔍 Fetching all visitors for booking...');
      try {
        const visitorsResponse = await fetch(`http://localhost:3000/api/additional-visitors/booking/${booking.booking_id}`);
        console.log('🔍 Visitors response status:', visitorsResponse.status);
        console.log('🔍 Visitors response URL:', `http://localhost:3000/api/additional-visitors/booking/${booking.booking_id}`);
        
        if (visitorsResponse.ok) {
          const visitorsData = await visitorsResponse.json();
          console.log('🔍 All visitors data:', visitorsData);
          console.log('🔍 Visitors array length:', visitorsData.visitors?.length || 0);
          setModalVisitors(visitorsData.visitors || []);
        } else {
          const errorText = await visitorsResponse.text();
          console.log('🔍 Visitors response error:', errorText);
          setModalVisitors([]);
        }
      } catch (error) {
        console.error('Error fetching visitors:', error);
        setModalVisitors([]);
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
      setBookingDetails(null);
      setModalVisitors([]);
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

  // Separate current and archived bookings
  const currentBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.date);
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    return bookingDate >= fiveDaysAgo;
  });

  const archivedBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.date);
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    return bookingDate < fiveDaysAgo;
  });

  // Filter bookings based on search and filters
  const filteredBookings = (showArchive ? archivedBookings : currentBookings).filter(booking => {
    const matchesSearch = searchTerm === "" || 
      `${booking.first_name} ${booking.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    const matchesDate = dateFilter === "" || booking.date === dateFilter;
    const matchesType = typeFilter === "all" || booking.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesDate && matchesType;
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // Sort by creation date (latest first)

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

  // Map database status to display status
  const getDisplayStatus = (status) => {
    const statusMap = {
      'pending': 'Pending',
      'approved': 'Approved',
      'checked-in': 'Visited',
      'cancelled': 'Cancelled'
    };
    
    return statusMap[status?.toLowerCase()] || status;
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
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#2e2b41] mb-2 font-['Lora']">
              <i className="fa-solid fa-calendar mr-2 sm:mr-3"></i>
              {showArchive ? 'Schedule Archive' : 'Schedule Management'}
            </h1>
            <p className="text-gray-600 text-sm sm:text-base font-['Telegraph']">
              {showArchive 
                ? `Archived schedules (older than 5 days) - ${archivedBookings.length} records` 
                : 'Manage museum visit schedules and bookings'
              }
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={() => setShowArchive(!showArchive)}
              className={`px-4 sm:px-6 py-2 sm:py-3 rounded-lg transition-colors font-semibold shadow-md text-sm sm:text-base font-['Telegraph'] ${
                showArchive 
                  ? 'bg-gray-600 text-white hover:bg-gray-700' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <i className={`fa-solid ${showArchive ? 'fa-calendar' : 'fa-archive'} mr-2`}></i>
              {showArchive ? 'Current Schedules' : 'View Archive'}
            </button>
            {!showArchive && (
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-[#AB8841] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-[#8B6B21] transition-colors font-semibold shadow-md text-sm sm:text-base font-['Telegraph']"
              >
                <i className="fa-solid fa-plus mr-2"></i>
                {showForm ? "Cancel" : "Add Schedule"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Add Schedule Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8 border border-gray-200">
          <h3 className="text-xl sm:text-2xl font-bold text-[#2e2b41] mb-4 sm:mb-6 font-['Lora']">
            <i className="fa-solid fa-plus-circle mr-2 sm:mr-3"></i>
            Add New Schedule
          </h3>
          <form onSubmit={addSchedule} className="space-y-6">
            {/* Visit Type Selection */}
            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
              <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-[#2e2b41] font-['Lora']">
                <i className="fa-solid fa-users mr-2"></i>
                Visit Type
              </h4>
              <div className="flex flex-wrap gap-3 sm:gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="visitType"
                    value="indwalkin"
                    checked={form.visitType === "indwalkin"}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium font-['Telegraph']">Ind-Walkin</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="visitType"
                    value="groupwalkin"
                    checked={form.visitType === "groupwalkin"}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium font-['Telegraph']">Group-Walkin</span>
                </label>
              </div>
            </div>

            {/* Primary Visitor Information */}
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
              <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-[#2e2b41] font-['Lora']">
                <i className="fa-solid fa-user mr-2"></i>
                Primary Visitor Information
              </h4>
              
              {form.visitType === "indwalkin" ? (
                // Ind-Walkin - Individual walk-in (email + date only, 24h expiration)
                <div>
                  <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center">
                      <i className="fa-solid fa-clock text-orange-600 mr-2"></i>
                      <span className="text-sm text-orange-800 font-['Telegraph']">
                        <strong>Ind-Walkin:</strong> Individual walk-in booking. Only email and date required. 
                        Link expires in 24 hours. Requires approval before email is sent.
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <Input label="Email" type="email" name="email" value={form.email} onChange={handleInputChange} required />
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
                </div>
              ) : (
                // Group-Walkin - Group walk-in (primary + additional emails, 24h expiration)
                <div>
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <i className="fa-solid fa-users text-red-600 mr-2"></i>
                      <span className="text-sm text-red-800 font-['Telegraph']">
                        <strong>Group-Walkin:</strong> Group walk-in booking. Primary visitor info + additional emails. 
                        Links expire in 24 hours. Requires approval before emails are sent.
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:gap-6">
                    <Input label="Primary Visitor Email" type="email" name="email" value={form.email} onChange={handleInputChange} required />
                  </div>
                  
                  {/* Additional Visitors Section */}
                  <div className="mt-6 bg-green-50 p-4 rounded-lg">
                    <h5 className="text-md font-semibold mb-3 text-[#2e2b41]">
                      <i className="fa-solid fa-users mr-2"></i>
                      Additional Visitors
                    </h5>
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center">
                        <i className="fa-solid fa-exclamation-triangle text-yellow-600 mr-2"></i>
                        <span className="text-sm text-yellow-800">
                          <strong>Note:</strong> Each additional visitor will receive an individual email with QR code and form link. 
                          All links expire in 24 hours. Maximum 29 additional visitors allowed.
                        </span>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Additional Visitors
                      </label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="number"
                          min="0"
                          max="29"
                          maxLength="2"
                          value={additionalVisitors.length === 0 ? "" : additionalVisitors.length} 
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            // Only allow 2 digits maximum
                            if (inputValue.length > 2) return;
                            
                            const count = Math.min(29, Math.max(0, parseInt(inputValue) || 0));
                            setAdditionalVisitors(Array(count).fill().map((_, i) => ({
                              id: i,
                              email: ''
                            })));
                          }}
                          onKeyPress={(e) => {
                            // Only allow numbers and prevent more than 2 digits
                            if (!/[0-9]/.test(e.key) || e.target.value.length >= 2) {
                              e.preventDefault();
                            }
                          }}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#AB8841] focus:border-transparent"
                          placeholder="0"
                        />
                        <span className="text-sm text-gray-600">
                          additional visitors (Total: {additionalVisitors.length + 1})
                        </span>
                        {additionalVisitors.length >= 29 && (
                          <span className="text-xs text-red-600 font-medium">
                            Maximum limit reached
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {additionalVisitors.map((visitor, index) => (
                      <div key={visitor.id} className="bg-white p-4 rounded-lg border border-gray-200 mb-3">
                        <h6 className="text-sm font-semibold text-[#2e2b41] mb-3">
                          Additional Visitor {index + 1}
                        </h6>
                        <div className="w-full">
                          <Input 
                            label="Email" 
                            type="email"
                            value={visitor.email}
                            onChange={(e) => {
                              const updated = [...additionalVisitors];
                              updated[index].email = e.target.value;
                              setAdditionalVisitors(updated);
                            }}
                            required
                            placeholder="Enter email address"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Visit Date Section */}
                  <div className="mt-6 bg-purple-50 p-4 rounded-lg">
                    <h5 className="text-md font-semibold mb-3 text-[#2e2b41]">
                      <i className="fa-solid fa-calendar mr-2"></i>
                      Visit Date
                    </h5>
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
                </div>
              )}
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
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.isArray(slots) && slots.map(slot => {
                      if (slot.time === "12:00 - 13:00") return null; // Skip lunch break
                      const availableSlots = slot.capacity - slot.booked;
                      const isSelected = form.selectedSlot === slot.time;
                      const isFull = slot.booked >= slot.capacity;
                      
                      return (
                        <div
                          key={slot.time}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                            isSelected 
                              ? 'border-[#AB8841] bg-[#AB8841] text-white shadow-lg' 
                              : isFull
                                ? 'border-gray-300 bg-gray-100 cursor-not-allowed'
                                : 'border-gray-200 bg-white hover:border-[#AB8841] hover:shadow-md'
                          }`}
                          onClick={() => !isFull && handleSlotSelect(slot.time)}
                        >
                          <div className="text-center">
                            <div className={`text-lg font-bold mb-2 ${
                              isSelected ? 'text-white' :
                              isFull ? 'text-gray-500' :
                              availableSlots === 0 ? 'text-red-600' : 
                              availableSlots <= 5 ? 'text-orange-600' : 'text-green-600'
                            }`}>
                              {availableSlots}
                            </div>
                            <div className={`text-xs font-medium mb-1 ${
                              isSelected ? 'text-white' : 'text-gray-500'
                            }`}>
                              slots available
                            </div>
                            <div className={`text-sm font-semibold ${
                              isSelected ? 'text-white' : 'text-[#2e2b41]'
                            }`}>
                              {slot.time}
                            </div>
                            {isFull && (
                              <div className="text-xs text-red-600 font-medium mt-1">
                                FULL
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 md:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4">
              <i className="fa-solid fa-calendar text-blue-600 text-sm sm:text-lg md:text-xl"></i>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600 font-['Lora']">Total Bookings</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 font-['Telegraph']">{bookings.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 md:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4">
              <i className="fa-solid fa-clock text-yellow-600 text-sm sm:text-lg md:text-xl"></i>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600 font-['Lora']">Pending</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-600 font-['Telegraph']">
                {bookings.filter(b => b.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 md:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-green-100 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4">
              <i className="fa-solid fa-check text-green-600 text-sm sm:text-lg md:text-xl"></i>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600 font-['Lora']">Approved</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-green-600 font-['Telegraph']">
                {bookings.filter(b => b.status === 'approved').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 md:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-red-100 rounded-full flex items-center justify-center mr-2 sm:mr-3 md:mr-4">
              <i className="fa-solid fa-times text-red-600 text-sm sm:text-lg md:text-xl"></i>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600 font-['Lora']">Cancelled</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-red-600 font-['Telegraph']">
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
        <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-['Lora']">Search</label>
              <input
                type="text"
                placeholder="Search by visitor name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] focus:border-transparent font-['Telegraph']"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-['Lora']">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] focus:border-transparent font-['Telegraph']"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="checked-in">Visited</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-['Lora']">Date</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] focus:border-transparent font-['Telegraph']"
              />
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-['Lora']">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] focus:border-transparent font-['Telegraph']"
              >
                <option value="all">All Types</option>
                <option value="individual">Individual</option>
                <option value="group">Group</option>
                <option value="ind-walkin">Ind-Walkin</option>
                <option value="group-walkin">Group-Walkin</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-end">
              <div className="bg-[#AB8841] text-white px-4 py-2 rounded-lg font-medium font-['Telegraph']">
                {filteredBookings.length} bookings
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto bg-white rounded-lg shadow-lg border border-gray-200">
          {loadingBookings ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <i className="fa-solid fa-spinner fa-spin text-[#AB8841] text-3xl mb-4"></i>
                <p className="text-gray-600 font-['Telegraph']">Loading bookings...</p>
              </div>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <i className="fa-solid fa-calendar text-6xl mb-4 text-gray-300"></i>
              <h3 className="text-lg font-medium text-gray-900 mb-2 font-['Lora']">No bookings found</h3>
              <p className="text-gray-500 font-['Telegraph']">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <div className="text-xs text-gray-500 mb-2 font-['Telegraph']">Desktop View Active (768px+)</div>
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider font-['Lora']">Created</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider font-['Lora']">Visitor</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider font-['Lora']">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider font-['Lora']">Date & Time</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider font-['Lora']">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider font-['Lora']">Visitors</th>
                      {!showArchive && (
                        <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider font-['Lora']">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBookings.map((booking, index) => (
                      <tr key={booking.booking_id || index} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700 font-medium font-['Telegraph']">
                            {formatDate(booking.created_at)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-[#2e2b41] font-['Telegraph']">
                            {booking.first_name} {booking.last_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full font-['Telegraph'] ${
                            booking.type === 'group' 
                              ? 'bg-purple-100 text-purple-800' 
                              : booking.type === 'individual'
                              ? 'bg-blue-100 text-blue-800'
                              : booking.type === 'ind-walkin'
                              ? 'bg-orange-100 text-orange-800'
                              : booking.type === 'group-walkin'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {booking.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-[#2e2b41] font-['Telegraph']">{formatDate(booking.date)}</div>
                          <div className="text-sm text-gray-500 font-['Telegraph']">{booking.time_slot}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={getStatusBadge(booking.status)}>
                            {getDisplayStatus(booking.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#2e2b41]">
                          <div className="flex items-center font-['Telegraph']">
                            <i className="fa-solid fa-users mr-2 text-[#AB8841]"></i>
                            {booking.total_visitors}
                          </div>
                        </td>
                        {!showArchive && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button className="text-blue-600 hover:text-blue-800 transition-colors duration-150 font-['Telegraph']" onClick={() => handleViewBooking(booking)}>
                                <i className="fa-solid fa-eye mr-1"></i>
                                View
                              </button>
                              {booking.status !== 'cancelled' && (
                                <button className="text-orange-600 hover:text-orange-800 transition-colors duration-150 font-['Telegraph']" onClick={() => handleCancelBooking(booking)}>
                                  <i className="fa-solid fa-times mr-1"></i>
                                  Cancel
                                </button>
                              )}
                              {booking.status === 'pending' && (
                                <button
                                  className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors duration-150 font-['Telegraph']"
                                  onClick={() => handleApproveBooking(booking)}
                                >
                                  <i className="fa-solid fa-check mr-1"></i>
                                  Approve
                                </button>
                              )}
                              <button className="text-red-600 hover:text-red-800 transition-colors duration-150 font-['Telegraph']" onClick={() => deleteSchedule(booking.booking_id)}>
                                <i className="fa-solid fa-trash mr-1"></i>
                                Delete
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="block md:hidden space-y-4 p-2">
                <div className="text-xs text-gray-500 mb-2 font-['Telegraph']">Mobile View Active (425px detected)</div>
                {filteredBookings.map((booking, index) => (
                  <div key={booking.booking_id || index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full font-['Telegraph'] ${
                          booking.type === 'group' 
                            ? 'bg-purple-100 text-purple-800' 
                            : booking.type === 'individual'
                            ? 'bg-blue-100 text-blue-800'
                            : booking.type === 'ind-walkin'
                            ? 'bg-orange-100 text-orange-800'
                            : booking.type === 'group-walkin'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {booking.type}
                        </span>
                        <span className={getStatusBadge(booking.status)}>
                          {getDisplayStatus(booking.status)}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-[#2e2b41] font-['Telegraph']">
                        <i className="fa-solid fa-users mr-1 text-[#AB8841]"></i>
                        {booking.total_visitors}
                      </div>
                    </div>

                    {/* Visitor Info */}
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold text-[#2e2b41] font-['Lora']">
                        {booking.first_name} {booking.last_name}
                      </h3>
                      <p className="text-sm text-gray-600 font-['Telegraph']">
                        Created: {formatDate(booking.created_at)}
                      </p>
                    </div>

                    {/* Date & Time */}
                    <div className="mb-4">
                      <div className="flex items-center text-sm text-[#2e2b41] font-['Telegraph']">
                        <i className="fa-solid fa-calendar mr-2 text-[#AB8841]"></i>
                        {formatDate(booking.date)} at {booking.time_slot}
                      </div>
                    </div>

                    {/* Actions */}
                    {!showArchive && (
                      <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                        <button 
                          className="text-blue-600 hover:text-blue-800 transition-colors duration-150 text-sm font-['Telegraph'] flex items-center"
                          onClick={() => handleViewBooking(booking)}
                        >
                          <i className="fa-solid fa-eye mr-1"></i>
                          View
                        </button>
                        {booking.status !== 'cancelled' && (
                          <button 
                            className="text-orange-600 hover:text-orange-800 transition-colors duration-150 text-sm font-['Telegraph'] flex items-center"
                            onClick={() => handleCancelBooking(booking)}
                          >
                            <i className="fa-solid fa-times mr-1"></i>
                            Cancel
                          </button>
                        )}
                        {booking.status === 'pending' && (
                          <button
                            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors duration-150 text-sm font-['Telegraph'] flex items-center"
                            onClick={() => handleApproveBooking(booking)}
                          >
                            <i className="fa-solid fa-check mr-1"></i>
                            Approve
                          </button>
                        )}
                        <button 
                          className="text-red-600 hover:text-red-800 transition-colors duration-150 text-sm font-['Telegraph'] flex items-center"
                          onClick={() => deleteSchedule(booking.booking_id)}
                        >
                          <i className="fa-solid fa-trash mr-1"></i>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Pagination or Summary */}
        {filteredBookings.length > 0 && (
          <div className="px-4 sm:px-6 py-4 bg-gray-50 border-t">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="text-sm text-gray-700 font-['Telegraph']">
                Showing <span className="font-medium">{filteredBookings.length}</span> of <span className="font-medium">{bookings.length}</span> bookings
              </div>
              <div className="text-sm text-gray-500 font-['Telegraph']">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {showBookingModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-2xl font-bold text-[#2e2b41] font-['Lora']">
                  <i className="fa-solid fa-calendar-check mr-3 text-[#AB8841]"></i>
                  Booking Details
                </h2>
                <p className="text-gray-600 mt-1 font-['Telegraph']">
                  {selectedBooking.first_name} {selectedBooking.last_name}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setSelectedBooking(null);
                  setBookingDetails(null);
                  setModalVisitors([]);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
              >
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full font-['Telegraph'] ${
                    selectedBooking.type === 'group' 
                      ? 'bg-purple-100 text-purple-800' 
                      : selectedBooking.type === 'individual'
                      ? 'bg-blue-100 text-blue-800'
                      : selectedBooking.type === 'ind-walkin'
                      ? 'bg-orange-100 text-orange-800'
                      : selectedBooking.type === 'group-walkin'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedBooking.type}
                  </span>
                  <span className={getStatusBadge(selectedBooking.status)}>
                    {getDisplayStatus(selectedBooking.status)}
                  </span>
                </div>
                <div className="flex items-center text-sm text-[#2e2b41] font-['Telegraph']">
                  <i className="fa-solid fa-users mr-2 text-[#AB8841]"></i>
                  {selectedBooking.total_visitors} {selectedBooking.total_visitors === 1 ? 'visitor' : 'visitors'}
                </div>
              </div>

              {/* Visitor Information */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-[#2e2b41] mb-3 font-['Lora']">
                  <i className="fa-solid fa-user mr-2 text-[#AB8841]"></i>
                  Visitor Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-['Telegraph']">Full Name</label>
                    <p className="text-[#2e2b41] font-['Telegraph']">{selectedBooking.first_name} {selectedBooking.last_name}</p>
                  </div>
                  {bookingDetails && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 font-['Telegraph']">Gender</label>
                        <p className="text-[#2e2b41] font-['Telegraph']">{bookingDetails.gender || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 font-['Telegraph']">Email</label>
                        <p className="text-[#2e2b41] font-['Telegraph']">{bookingDetails.email || 'Not provided'}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1 font-['Telegraph']">Address</label>
                        <p className="text-[#2e2b41] font-['Telegraph']">{bookingDetails.address || 'Not provided'}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Booking Information */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-[#2e2b41] mb-3 font-['Lora']">
                  <i className="fa-solid fa-calendar-alt mr-2 text-[#AB8841]"></i>
                  Booking Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-['Telegraph']">Booking ID</label>
                    <p className="text-[#2e2b41] font-['Telegraph'] font-mono">#{selectedBooking.booking_id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-['Telegraph']">Visit Date</label>
                    <p className="text-[#2e2b41] font-['Telegraph']">{formatDate(selectedBooking.date)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-['Telegraph']">Time Slot</label>
                    <p className="text-[#2e2b41] font-['Telegraph']">{selectedBooking.time_slot}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-['Telegraph']">Created On</label>
                    <p className="text-[#2e2b41] font-['Telegraph']">{formatDate(selectedBooking.created_at)}</p>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              {bookingDetails && (
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-[#2e2b41] mb-3 font-['Lora']">
                    <i className="fa-solid fa-info-circle mr-2 text-[#AB8841]"></i>
                    Additional Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 font-['Telegraph']">Visitor Type</label>
                      <p className="text-[#2e2b41] font-['Telegraph']">{bookingDetails.visitorType || 'Not specified'}</p>
                    </div>
                    {selectedBooking.institution && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 font-['Telegraph']">Institution</label>
                        <p className="text-[#2e2b41] font-['Telegraph']">{selectedBooking.institution}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* All Visitors Information */}
              {console.log('🔍 Modal visitors length:', modalVisitors.length)}
              {console.log('🔍 Modal visitors data:', modalVisitors)}
              {console.log('🔍 Selected booking:', selectedBooking)}
              {(modalVisitors.length > 0 || (selectedBooking?.total_visitors && selectedBooking.total_visitors > 1)) && (
                <div className="bg-purple-50 rounded-lg p-4">
                                      <h3 className="text-lg font-semibold text-[#2e2b41] mb-3 font-['Lora']">
                      <i className="fa-solid fa-users mr-2 text-[#AB8841]"></i>
                      All Visitors ({modalVisitors.length})
                    </h3>
                    {modalVisitors.length === 0 && (
                      <div className="space-y-2 mb-4">
                        <p className="text-gray-600 font-['Telegraph']">No visitors found in database.</p>
                        <p className="text-sm text-gray-500 font-['Telegraph']">
                          Expected: {selectedBooking?.total_visitors || 'Unknown'} total visitors
                        </p>
                        <p className="text-xs text-gray-400 font-['Telegraph']">
                          Booking ID: {selectedBooking?.booking_id} | Type: {selectedBooking?.type}
                        </p>
                      </div>
                    )}
                                      <div className="space-y-3">
                      {modalVisitors.map((visitor, index) => (
                                              <div key={visitor.visitorId || visitor.tokenId || index} className="bg-white rounded-lg p-3 border border-purple-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold text-[#2e2b41] font-['Lora']">
                                {visitor.firstName} {visitor.lastName}
                              </h4>
                              {visitor.isMainVisitor && (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 font-['Telegraph']">
                                  Primary
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full font-['Telegraph'] ${
                                visitor.status === 'checked-in' || visitor.status === 'visited'
                                  ? 'bg-green-100 text-green-800' 
                                  : visitor.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {visitor.status === 'checked-in' || visitor.status === 'visited' ? 'Checked In' : visitor.status === 'pending' ? 'Pending' : visitor.status}
                              </span>
                              {visitor.checkinTime && (
                                <span className="text-xs text-gray-500 font-['Telegraph']">
                                  <i className="fa-solid fa-clock mr-1"></i>
                                  {new Date(visitor.checkinTime).toLocaleTimeString()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600 font-['Telegraph']">Email:</span>
                              <span className="ml-1 text-[#2e2b41] font-['Telegraph']">{visitor.email || 'Not provided'}</span>
                            </div>
                            {visitor.gender && visitor.gender !== 'Not specified' && (
                              <div>
                                <span className="text-gray-600 font-['Telegraph']">Gender:</span>
                                <span className="ml-1 text-[#2e2b41] font-['Telegraph']">{visitor.gender}</span>
                              </div>
                            )}
                            {visitor.visitorType && visitor.visitorType !== 'Visitor' && (
                              <div>
                                <span className="text-gray-600 font-['Telegraph']">Type:</span>
                                <span className="ml-1 text-[#2e2b41] font-['Telegraph']">{visitor.visitorType}</span>
                              </div>
                            )}
                            {visitor.institution && visitor.institution !== 'Not specified' && (
                              <div>
                                <span className="text-gray-600 font-['Telegraph']">Institution:</span>
                                <span className="ml-1 text-[#2e2b41] font-['Telegraph']">{visitor.institution}</span>
                              </div>
                            )}
                            {visitor.address && visitor.address !== 'Not provided' && (
                              <div className="sm:col-span-2">
                                <span className="text-gray-600 font-['Telegraph']">Address:</span>
                                <span className="ml-1 text-[#2e2b41] font-['Telegraph']">{visitor.address}</span>
                              </div>
                            )}
                          </div>
                        </div>
                                          ))}
                    </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowBookingModal(false);
                  setSelectedBooking(null);
                  setBookingDetails(null);
                  setModalVisitors([]);
                }}
                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-['Telegraph']"
              >
                Close
              </button>
              {selectedBooking.status === 'pending' && (
                <button
                  onClick={() => {
                    handleApproveBooking(selectedBooking);
                    setShowBookingModal(false);
                    setSelectedBooking(null);
                    setBookingDetails(null);
                    setModalVisitors([]);
                  }}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-['Telegraph']"
                >
                  <i className="fa-solid fa-check mr-2"></i>
                  Approve Booking
                </button>
              )}
            </div>
          </div>
        </div>
      )}
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
