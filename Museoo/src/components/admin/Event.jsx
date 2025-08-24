import React, { useState, useEffect } from "react";
import api from "../../config/api";

const Event = ({ userPermissions }) => {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    start_date: "",
    time: "",
    location: "",
    organizer: "",
    image: null,
    maxCapacity: 50,
  });
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalEvent, setModalEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [showRegistrations, setShowRegistrations] = useState(false);
  const [selectedEventRegistrations, setSelectedEventRegistrations] = useState([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image") {
      setForm((prev) => ({
        ...prev,
        image: files[0],
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await api.get("/api/activities/events");
      console.log('📅 Events received from API:', res.data);
      const mapped = res.data.map(event => ({
        ...event,
        maxCapacity: event.max_capacity || 50,
        currentRegistrations: event.current_registrations || 0,
      }));
      setEvents(mapped);
    } catch (err) {
      console.error("Error fetching events:", err);
      setEvents([]);
    }
  };

  useEffect(() => {
    fetchEvents();
    
    // Set up periodic refresh every 30 seconds to keep slot availability current
    const interval = setInterval(() => {
      fetchEvents();
    }, 30000); // 30 seconds
    
    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("type", "event");
      formData.append("start_date", form.start_date);
      formData.append("time", form.time);
      formData.append("location", form.location);
      formData.append("organizer", form.organizer);
      formData.append("max_capacity", form.maxCapacity);
      if (form.image) {
        formData.append("images", form.image);
      }

      const res = await api.post("/api/activities", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.success) {
        alert("Event added successfully!");
        setForm({
          title: "",
          description: "",
          start_date: "",
          time: "",
          location: "",
          organizer: "",
          image: null,
          maxCapacity: 50,
        });
        e.target.reset();
        setShowForm(false);
        fetchEvents();
      } else {
        alert("Failed to add event.");
      }
    } catch (err) {
      console.error("Error adding event:", err);
      alert("Error adding event.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    
    try {
      const res = await api.delete(`/api/activities/${id}`);
      
      if (res.data.success) {
        setEvents(events.filter(event => event.id !== id));
        alert("Event deleted successfully!");
      } else {
        alert("Failed to delete event.");
      }
    } catch (err) {
      console.error("Error deleting event:", err);
      alert("Error deleting event.");
    }
  };

  const handleViewEvent = (event) => {
    setModalEvent(event);
    setShowModal(true);
  };

  const fetchEventRegistrations = async (eventId) => {
    setLoadingRegistrations(true);
    try {
      const response = await fetch(`http://localhost:3000/api/event-registrations/event/${eventId}`);
      const data = await response.json();
      setSelectedEventRegistrations(data);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      setSelectedEventRegistrations([]);
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const handleViewRegistrations = (event) => {
    fetchEventRegistrations(event.id);
    setShowRegistrations(true);
  };

  const handleApproveRegistration = async (registrationId) => {
    if (!window.confirm("Are you sure you want to approve this registration?")) return;
    
    try {
      const response = await fetch(`http://localhost:3000/api/event-registrations/${registrationId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          approved_by: 'Admin'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert("Registration approved successfully! QR code has been generated.");
        // Refresh both registrations and events data for real-time updates
        if (selectedEventRegistrations.length > 0) {
          fetchEventRegistrations(selectedEventRegistrations[0].event_id);
        }
        fetchEvents(); // Refresh events to update slot availability
      } else {
        alert("Failed to approve registration: " + data.error);
      }
    } catch (error) {
      console.error('Error approving registration:', error);
      alert("Error approving registration.");
    }
  };

  const handleRejectRegistration = async (registrationId) => {
    const rejectionReason = prompt("Please provide a reason for rejection (optional):");
    if (rejectionReason === null) return;
    
    try {
      const response = await fetch(`http://localhost:3000/api/event-registrations/${registrationId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rejected_by: 'Admin',
          rejection_reason: rejectionReason || 'Registration rejected by admin'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert("Registration rejected successfully!");
        // Refresh both registrations and events data for real-time updates
        if (selectedEventRegistrations.length > 0) {
          fetchEventRegistrations(selectedEventRegistrations[0].event_id);
        }
        fetchEvents(); // Refresh events to update slot availability
      } else {
        alert("Failed to reject registration: " + data.error);
      }
    } catch (error) {
      console.error('Error rejecting registration:', error);
      alert("Error rejecting registration.");
    }
  };

  const handleDeleteRegistration = async (registrationId) => {
    if (!window.confirm("Are you sure you want to delete this participant? This action cannot be undone.")) return;
    
    try {
      const response = await fetch(`http://localhost:3000/api/event-registrations/${registrationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert("Participant deleted successfully!");
        // Refresh both registrations and events data for real-time updates
        if (selectedEventRegistrations.length > 0) {
          fetchEventRegistrations(selectedEventRegistrations[0].event_id);
        }
        fetchEvents(); // Refresh events to update slot availability
      } else {
        alert("Failed to delete participant: " + data.error);
      }
    } catch (error) {
      console.error('Error deleting registration:', error);
      alert("Error deleting participant.");
    }
  };

  const now = new Date();
  const upcoming = events.filter(event => {
    let eventDateTime;
    if (event.start_date) {
      const startDate = new Date(event.start_date);
      if (event.time) {
        const [hours, minutes] = event.time.split(':');
        startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        eventDateTime = startDate;
      } else {
        startDate.setHours(23, 59, 59, 999);
        eventDateTime = startDate;
      }
    } else {
      eventDateTime = new Date();
    }
    return eventDateTime > now;
  });
  
  const history = events.filter(event => {
    let eventDateTime;
    if (event.start_date) {
      const startDate = new Date(event.start_date);
      if (event.time) {
        const [hours, minutes] = event.time.split(':');
        startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        eventDateTime = startDate;
      } else {
        startDate.setHours(23, 59, 59, 999);
        eventDateTime = startDate;
      }
    } else {
      eventDateTime = new Date();
    }
    return eventDateTime <= now;
  });

  const totalEvents = events.length;
  const upcomingCount = upcoming.length;
  const pastCount = history.length;

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#2e2b41] mb-2">
              <i className="fa-solid fa-calendar-day mr-3"></i>
              Event Management
            </h1>
            <p className="text-gray-600 text-sm md:text-base">Manage museum events and activities</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-[#AB8841] text-white px-4 md:px-6 py-2 md:py-3 rounded-lg hover:bg-[#8B6B21] transition-colors font-semibold shadow-md text-sm md:text-base"
          >
            <i className="fa-solid fa-plus mr-2"></i>
            {showForm ? "Cancel" : "Add Event"}
          </button>
        </div>
      </div>

      {/* Add Event Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-8 border border-gray-200">
          <h3 className="text-xl md:text-2xl font-bold text-[#2e2b41] mb-4 md:mb-6">
            <i className="fa-solid fa-plus-circle mr-3"></i>
            Add New Event
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2 text-sm md:text-base">
                  Event Title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] text-sm md:text-base"
                  placeholder="Enter event title"
                  required
                />
              </div>
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2 text-sm md:text-base">
                  Organizer *
                </label>
                <input
                  type="text"
                  name="organizer"
                  value={form.organizer}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] text-sm md:text-base"
                  placeholder="Enter organizer name"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2 text-sm md:text-base">
                  Start Date *
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={form.start_date}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] text-sm md:text-base"
                  required
                />
              </div>
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2 text-sm md:text-base">
                  Time *
                </label>
                <input
                  type="time"
                  name="time"
                  value={form.time}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] text-sm md:text-base"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[#2e2b41] font-semibold mb-2 text-sm md:text-base">
                Location *
              </label>
              <input
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] text-sm md:text-base"
                placeholder="Enter event location"
                required
              />
            </div>

            <div>
              <label className="block text-[#2e2b41] font-semibold mb-2 text-sm md:text-base">
                Description *
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] text-sm md:text-base"
                rows="4"
                placeholder="Enter event description"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2 text-sm md:text-base">
                  Max Capacity *
                </label>
                <input
                  type="number"
                  name="maxCapacity"
                  value={form.maxCapacity}
                  onChange={handleChange}
                  min="1"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] text-sm md:text-base"
                  placeholder="50"
                  required
                />
                <div className="text-xs text-gray-500 mt-1">
                  <i className="fa-solid fa-info-circle mr-1"></i>
                  Maximum number of participants
                </div>
              </div>
              <div>
                <label className="block text-[#2e2b41] font-semibold mb-2 text-sm md:text-base">
                  Event Image
                </label>
                <input
                  type="file"
                  name="image"
                  onChange={handleChange}
                  accept="image/*"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] text-sm md:text-base"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#AB8841] hover:bg-[#8B6B21] text-white px-6 md:px-8 py-2 md:py-3 rounded-lg font-semibold transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
              >
                {submitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    Adding Event...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-plus mr-2"></i>
                    Add Event
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 md:px-8 py-2 md:py-3 rounded-lg font-semibold transition-colors shadow-md text-sm md:text-base"
              >
                <i className="fa-solid fa-times mr-2"></i>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3 md:mr-4">
              <i className="fa-solid fa-calendar text-blue-600 text-lg md:text-xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Events</p>
              <p className="text-xl md:text-2xl font-bold text-blue-600">{totalEvents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-full flex items-center justify-center mr-3 md:mr-4">
              <i className="fa-solid fa-clock text-green-600 text-lg md:text-xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Upcoming</p>
              <p className="text-xl md:text-2xl font-bold text-green-600">{upcomingCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100 rounded-full flex items-center justify-center mr-3 md:mr-4">
              <i className="fa-solid fa-play text-orange-600 text-lg md:text-xl"></i>
            </div>
            <div>
              <p className="text-sm text-gray-600">Past</p>
              <p className="text-xl md:text-2xl font-bold text-orange-600">{pastCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-4 md:px-6">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`py-3 md:py-4 px-1 border-b-2 font-medium text-sm md:text-base transition-colors ${
                activeTab === 'upcoming'
                  ? 'border-[#AB8841] text-[#AB8841]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className="fa-solid fa-calendar-plus mr-2"></i>
              Upcoming Events ({upcomingCount})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-3 md:py-4 px-1 border-b-2 font-medium text-sm md:text-base transition-colors ${
                activeTab === 'history'
                  ? 'border-[#AB8841] text-[#AB8841]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className="fa-solid fa-history mr-2"></i>
              Event History ({pastCount})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-4 md:p-6">
          {activeTab === 'upcoming' && (
            <div>
              {upcoming.length > 0 ? (
                <EventSection
                  title=""
                  events={upcoming}
                  icon="fa-solid fa-calendar-plus"
                  color="green"
                  onView={handleViewEvent}
                  onDelete={handleDelete}
                  onViewRegistrations={handleViewRegistrations}
                  formatTime={formatTime}
                  showHeader={false}
                />
              ) : (
                <div className="text-center py-8 md:py-12">
                  <i className="fa-solid fa-calendar-plus text-4xl md:text-6xl mb-4 text-gray-300"></i>
                  <h3 className="text-lg md:text-xl font-semibold text-gray-600 mb-2">No Upcoming Events</h3>
                  <p className="text-sm md:text-base text-gray-500">No events are scheduled for the future</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              {history.length > 0 ? (
                <EventSection
                  title=""
                  events={history}
                  icon="fa-solid fa-history"
                  color="gray"
                  onView={handleViewEvent}
                  onDelete={handleDelete}
                  onViewRegistrations={handleViewRegistrations}
                  formatTime={formatTime}
                  showHeader={false}
                />
              ) : (
                <div className="text-center py-8 md:py-12">
                  <i className="fa-solid fa-history text-4xl md:text-6xl mb-4 text-gray-300"></i>
                  <h3 className="text-lg md:text-xl font-semibold text-gray-600 mb-2">No Past Events</h3>
                  <p className="text-sm md:text-base text-gray-500">No events have been completed yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Show this only when there are no events at all */}
      {events.length === 0 && (
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 border border-gray-200">
          <div className="text-center py-8 md:py-12">
            <i className="fa-solid fa-calendar-times text-4xl md:text-6xl mb-4 text-gray-300"></i>
            <h3 className="text-lg md:text-xl font-semibold text-gray-600 mb-2">No Events Found</h3>
            <p className="text-sm md:text-base text-gray-500">Start by adding your first event using the "Add Event" button above</p>
          </div>
        </div>
      )}

      {/* Registration Modal */}
      {showRegistrations && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-[#2e2b41] to-[#AB8841] p-4 md:p-6 rounded-t-lg">
              <div className="flex justify-between items-center">
                <h2 className="text-xl md:text-2xl font-bold text-white">Event Registrations</h2>
                <button 
                  className="text-white hover:text-gray-200 text-2xl font-bold ml-4"
                  onClick={() => setShowRegistrations(false)}
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-4 md:p-6">
              {loadingRegistrations ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B6B21]"></div>
                    <span className="text-gray-600 font-medium">Loading registrations...</span>
                  </div>
                </div>
              ) : selectedEventRegistrations.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">Name</th>
                        <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">Email</th>
                        <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">Gender</th>
                        <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">Visitor Type</th>
                        <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">Status</th>
                        <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedEventRegistrations.map((registration) => (
                        <tr key={registration.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-[#2e2b41]">
                              {registration.firstname} {registration.lastname}
                            </div>
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">{registration.email}</div>
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                            <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium capitalize">
                              {registration.gender}
                            </span>
                          </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              registration.visitor_type === 'local' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-purple-100 text-purple-800'
                            }`}>
                              {registration.visitor_type}
                            </span>
                          </td>
                                                            <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                      registration.status === 'pending' 
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : registration.status === 'checked_in'
                                        ? 'bg-green-100 text-green-800'
                                        : registration.status === 'cancelled'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {registration.status === 'pending' ? 'Pending Check-in' :
                                       registration.status === 'checked_in' ? 'Checked In' :
                                       registration.status === 'cancelled' ? 'Cancelled' :
                                       registration.status}
                                    </span>
                                  </td>
                          <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm font-medium">
                             <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                               {registration.approval_status === 'pending' && (
                                 <>
                                   <button
                                     onClick={() => handleApproveRegistration(registration.id)}
                                     className="text-green-600 hover:text-green-800 font-semibold text-xs md:text-sm px-2 py-1 rounded hover:bg-green-50 transition-colors"
                                   >
                                     <i className="fa-solid fa-check mr-1"></i>
                                     Approve
                                   </button>
                                   <button
                                     onClick={() => handleRejectRegistration(registration.id)}
                                     className="text-red-600 hover:text-red-800 font-semibold text-xs md:text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors"
                                   >
                                     <i className="fa-solid fa-times mr-1"></i>
                                     Reject
                                   </button>
                                 </>
                               )}
                               {registration.approval_status === 'approved' && (
                                 <span className="text-green-600 text-xs md:text-sm">
                                   <i className="fa-solid fa-check-circle mr-1"></i>
                                   Approved
                                 </span>
                               )}
                               {registration.approval_status === 'rejected' && (
                                 <span className="text-red-600 text-xs md:text-sm">
                                   <i className="fa-solid fa-times-circle mr-1"></i>
                                   Rejected
                                 </span>
                               )}
                               <button
                                 onClick={() => handleDeleteRegistration(registration.id)}
                                 className="text-red-600 hover:text-red-800 font-semibold text-xs md:text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors"
                               >
                                 <i className="fa-solid fa-trash mr-1"></i>
                                 Delete
                               </button>
                             </div>
                           </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <i className="fa-solid fa-users text-4xl md:text-6xl mb-4 text-gray-300"></i>
                  <h3 className="text-lg md:text-xl font-semibold text-gray-600 mb-2">No Registrations</h3>
                  <p className="text-sm md:text-base text-gray-500">No participants have registered for this event yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Event Details Modal */}
      {showModal && modalEvent && (
       <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
         <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
           <div className="p-4 md:p-6 border-b border-gray-200">
             <div className="flex items-center justify-between">
               <h3 className="text-xl md:text-2xl font-bold text-[#2e2b41]">
                 <i className="fa-solid fa-calendar-day mr-3"></i>
                 Event Details
               </h3>
               <button
                 onClick={() => setShowModal(false)}
                 className="text-gray-500 hover:text-gray-700 text-2xl ml-4"
               >
                 <i className="fa-solid fa-times"></i>
               </button>
             </div>
           </div>

           <div className="p-4 md:p-6">
             {/* Event Image */}
             {modalEvent.images && modalEvent.images.length > 0 && (
               <div className="mb-4 md:mb-6">
                 <img
                   src={`${api.defaults.baseURL}${modalEvent.images[0]}`}
                   alt={modalEvent.title}
                   className="w-full h-48 md:h-64 object-cover rounded-lg"
                 />
               </div>
             )}

             {/* Event Details Grid */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
               <div className="space-y-3 md:space-y-4">
                 <div>
                   <label className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider">Title</label>
                   <p className="text-sm md:text-base font-semibold text-[#2e2b41]">{modalEvent.title}</p>
                 </div>
                 <div>
                   <label className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider">Type</label>
                   <span className="inline-block bg-[#AB8841] text-white px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium">
                     Event
                   </span>
                 </div>
                 <div>
                   <label className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider">Location</label>
                   <p className="text-sm md:text-base text-[#2e2b41]">{modalEvent.location}</p>
                 </div>
               </div>

               <div className="space-y-3 md:space-y-4">
                 <div>
                   <label className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider">Date</label>
                   <p className="text-sm md:text-base text-[#2e2b41]">
                     {new Date(modalEvent.start_date).toLocaleDateString('en-US', {
                       weekday: 'long',
                       year: 'numeric',
                       month: 'long',
                       day: 'numeric'
                     })}
                   </p>
                 </div>
                 <div>
                   <label className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider">Time</label>
                   <p className="text-sm md:text-base text-[#2e2b41]">{formatTime(modalEvent.time)}</p>
                 </div>
                 <div>
                   <label className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider">Organizer</label>
                   <p className="text-sm md:text-base text-[#2e2b41]">{modalEvent.organizer}</p>
                 </div>
               </div>
             </div>

             {/* Description */}
             <div className="mt-4 md:mt-6">
               <label className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wider">Description</label>
               <p className="text-sm md:text-base text-[#2e2b41] mt-2">{modalEvent.description}</p>
             </div>
           </div>
         </div>
       </div>
     )}
    </div>
  );
};

// Event Section Component
const EventSection = ({ title, events, icon, color, onView, onDelete, onViewRegistrations, formatTime, showHeader = true }) => {
  const colorClasses = {
    green: "from-green-500 to-green-600",
    orange: "from-orange-500 to-orange-600",
    gray: "from-gray-500 to-gray-600",
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      {showHeader && (
        <div className={`px-4 md:px-6 py-3 md:py-4 border-b border-gray-200 bg-gradient-to-r ${colorClasses[color]}`}>
          <h3 className="text-lg md:text-xl font-bold text-white">
            <i className={`${icon} mr-2`}></i>
            {title} ({events.length})
          </h3>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">Event</th>
              <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">Date & Time</th>
              <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">Available Slots</th>
              <th className="px-3 md:px-6 py-3 md:py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {events.map((event) => (
              <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 md:w-12 md:h-12 flex-shrink-0">
                      {event.images && event.images.length > 0 ? (
                        <img
                          src={`${api.defaults.baseURL}${event.images[0]}`}
                          alt={event.title}
                          className="w-8 h-8 md:w-12 md:h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 md:w-12 md:h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          <i className="fa-solid fa-image text-xs md:text-sm text-gray-400"></i>
                        </div>
                      )}
                    </div>
                    <div className="ml-3 min-w-0">
                      <div className="text-sm font-semibold text-[#2e2b41] truncate max-w-20 md:max-w-32">{event.title}</div>
                    </div>
                  </div>
                </td>
                
                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                  <div className="text-sm text-[#2e2b41] truncate max-w-20 md:max-w-32">
                    {new Date(event.start_date).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-500 truncate max-w-20 md:max-w-32">
                    {formatTime(event.time)}
                  </div>
                </td>
                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-[#2e2b41]">
                    {(event.maxCapacity || 50) - (event.currentRegistrations || 0)} slots
                  </div>
                  <div className="text-xs text-gray-500">
                    {event.currentRegistrations || 0} / {event.maxCapacity || 50} filled
                  </div>
                </td>
                <td className="px-3 md:px-6 py-3 md:py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 ml-2">
                    <button
                      onClick={() => onView(event)}
                      className="text-blue-600 hover:text-blue-800 font-semibold text-xs md:text-sm px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                    >
                      <i className="fa-solid fa-eye mr-1"></i>
                      View
                    </button>
                    <button
                      onClick={() => onViewRegistrations(event)}
                      className="text-green-600 hover:text-green-800 font-semibold text-xs md:text-sm px-2 py-1 rounded hover:bg-green-50 transition-colors"
                    >
                      <i className="fa-solid fa-users mr-1"></i>
                      Registrations
                    </button>
                    <button
                      onClick={() => onDelete(event.id)}
                      className="text-red-600 hover:text-red-800 font-semibold text-xs md:text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      <i className="fa-solid fa-trash mr-1"></i>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Event;
