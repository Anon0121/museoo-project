import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../../config/api";
import citymus from "../../assets/citymus.jpg";
import logo from "../../assets/logo.png";

const TIME_SLOTS = [
  "09:00 - 10:00",
  "10:00 - 11:00",
  "11:00 - 12:00",
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
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mainVisitor, setMainVisitor] = useState({
    firstName: "",
    lastName: "",
    gender: "", // Remove default - force user to choose
    address: "",
    email: "",
    nationality: "",
    purpose: "educational",
    institution: "",
  });
  const [companions, setCompanions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  // Fetch real-time slots from database
  useEffect(() => {
    if (!visitDate) {
      setSlots([]);
      return;
    }

    const fetchSlots = async () => {
      setLoading(true);
      try {
        console.log('🔄 Fetching slots for date:', visitDate);
        const response = await api.get(`/api/slots?date=${visitDate}`);
        console.log('✅ Slots received:', response.data);
        
        if (Array.isArray(response.data) && response.data.length > 0) {
          setSlots(response.data);
        } else {
          // If no slots returned, create default slots for the date
          const defaultSlots = TIME_SLOTS.map(time => ({
            time,
            booked: 0,
            capacity: SLOT_CAPACITY
          }));
          setSlots(defaultSlots);
        }
      } catch (error) {
        console.error('❌ Error fetching slots:', error);
        // Fallback to default slots if API fails
        const fallbackSlots = TIME_SLOTS.map(time => ({
          time,
          booked: 0,
          capacity: SLOT_CAPACITY
        }));
        setSlots(fallbackSlots);
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [visitDate]);

  const handleMainChange = (e) => {
    const { name, value } = e.target;
    setMainVisitor((prev) => ({ ...prev, [name]: value }));
  };

  const handleCompanionChange = (id, e) => {
    const { name, value } = e.target;
    setCompanions((prev) =>
      prev.map((companion) =>
        companion.id === id ? { ...companion, [name]: value } : companion
      )
    );
  };

  const addCompanion = () => {
    setCompanions((prev) => [
      ...prev,
      {
        id: Date.now(),
        email: "",
      },
    ]);
  };

  const removeCompanion = (id) => {
    setCompanions((prev) => prev.filter((companion) => companion.id !== id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    const payload = {
      type: isGroup ? "group" : "individual",
      mainVisitor,
      companions: isGroup ? companions : [],
      totalVisitors: isGroup ? 1 + companions.length : 1,
      date: visitDate,
      time: selectedSlot,
    };

    try {
      console.log('📤 Submitting booking:', payload);
      const response = await api.post('/api/slots/book', payload);
      console.log('✅ Booking response:', response.data);
      
      if (response.data.success) {
        setSubmitStatus({
          type: 'success',
          message: 'Your visit has been successfully scheduled! You will receive a confirmation email shortly.'
        });
        // Reset form
        setMainVisitor({
          firstName: "",
          lastName: "",
          gender: "male",
          address: "",
          email: "",
          nationality: "",
          purpose: "educational",
          institution: "",
        });
        setCompanions([]);
        setVisitDate("");
        setSelectedSlot("");
        setSlots([]);
      } else {
        setSubmitStatus({
          type: 'error',
          message: response.data.error || 'Booking submission failed. Please try again later.'
        });
      }
    } catch (error) {
      console.error('❌ Booking error:', error);
      setSubmitStatus({
        type: 'error',
        message: error.response?.data?.error || 'Booking submission failed. Please try again later.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cover bg-center" style={{
      backgroundImage: `linear-gradient(rgba(4,9,30,0.7), rgba(4,9,30,0.7)), url(${citymus})`
    }}>
      {/* Navigation */}
      <nav className="bg-white shadow-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <Link to="/" className="flex items-center space-x-2 sm:space-x-4">
              <img src={logo} className="w-12 h-12 sm:w-16 sm:h-16" alt="Logo" />
              <div>
                <h1 className="text-sm sm:text-lg md:text-2xl font-bold text-gray-800">Cagayan de Oro City Museum</h1>
                <p className="text-xs sm:text-sm text-gray-600">Schedule Your Visit</p>
              </div>
            </Link>
            <Link
              to="/"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 text-xs sm:text-sm md:text-base"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
            Schedule Your Visit
          </h1>
          <div className="w-16 sm:w-20 md:w-24 h-1 bg-gradient-to-r from-blue-400 to-green-400 mx-auto rounded-full mb-4 sm:mb-6"></div>
          <p className="text-sm sm:text-base md:text-lg text-gray-200 max-w-2xl mx-auto px-2">
            Plan your museum experience by booking a time slot. We offer guided tours and educational programs for visitors of all ages.
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Status Message */}
          {submitStatus && (
            <div className={`p-4 sm:p-6 ${
              submitStatus.type === 'success' 
                ? 'bg-green-50 border-b border-green-200' 
                : 'bg-red-50 border-b border-red-200'
            }`}>
              <div className="flex items-center">
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mr-3 sm:mr-4 ${
                  submitStatus.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {submitStatus.type === 'success' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    )}
                  </svg>
                </div>
                <p className={`font-medium text-xs sm:text-sm md:text-base ${
                  submitStatus.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {submitStatus.message}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8">
            {/* Booking Type Toggle */}
            <div className="text-center">
              <label className="block text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-gray-800 mb-2 sm:mb-3 md:mb-4">Booking Type</label>
              <div className="inline-flex bg-gray-100 rounded-2xl p-1 sm:p-2">
                <button
                  type="button"
                  className={`px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 py-1 sm:py-2 md:py-3 rounded-xl font-semibold transition-all duration-300 text-xs sm:text-sm md:text-base ${
                    !isGroup 
                      ? 'bg-white text-blue-600 shadow-lg transform scale-105' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  onClick={() => setIsGroup(false)}
                >
                  <div className="flex items-center">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="hidden sm:inline">Individual Visit</span>
                    <span className="sm:hidden">Individual</span>
                  </div>
                </button>
                <button
                  type="button"
                  className={`px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 py-1 sm:py-2 md:py-3 rounded-xl font-semibold transition-all duration-300 text-xs sm:text-sm md:text-base ${
                    isGroup 
                      ? 'bg-white text-blue-600 shadow-lg transform scale-105' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  onClick={() => setIsGroup(true)}
                >
                  <div className="flex items-center">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="hidden sm:inline">Group Visit</span>
                    <span className="sm:hidden">Group</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Main Visitor Information */}
            <div className="bg-blue-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-blue-200">
              <h2 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-gray-800 mb-3 sm:mb-4 md:mb-6 flex items-center">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 mr-2 sm:mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-xs sm:text-sm md:text-base lg:text-lg">{isGroup ? 'Primary Contact Information' : 'Visitor Information'}</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
                <Input label="First Name" name="firstName" value={mainVisitor.firstName} onChange={handleMainChange} required />
                <Input label="Last Name" name="lastName" value={mainVisitor.lastName} onChange={handleMainChange} required />
                <Select label="Gender" name="gender" value={mainVisitor.gender} onChange={handleMainChange} options={["Male", "Female", "LGBT", "Prefer not to say"]} placeholder="Pick your gender" required />
                <Select label="Nationality" name="nationality" value={mainVisitor.nationality} onChange={handleMainChange} options={["Local", "Foreign"]} placeholder="Choose your nationality" required />
                <Input label="Address" name="address" value={mainVisitor.address} onChange={handleMainChange} required className="md:col-span-2" />
                <Input label="Email" name="email" type="email" value={mainVisitor.email} onChange={handleMainChange} required className="md:col-span-2" />
                <Input label="Institution/Organization" name="institution" value={mainVisitor.institution} onChange={handleMainChange} placeholder="e.g., University, Company, School (optional)" className="md:col-span-2" />
                <Select label="Purpose of Visit" name="purpose" value={mainVisitor.purpose} onChange={handleMainChange} options={["Educational", "Research", "Leisure", "Other"]} required className="md:col-span-2" />
              </div>
            </div>

            {/* Group Members */}
            {isGroup && (
              <div className="bg-green-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-green-200">
                <h2 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-gray-800 mb-3 sm:mb-4 md:mb-6 flex items-center">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 mr-2 sm:mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-xs sm:text-sm md:text-base lg:text-lg">Group Members ({companions.length + 1} total)</span>
                </h2>
                
                {companions.map((companion, idx) => (
                  <div key={companion.id} className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 mb-3 sm:mb-4 border border-green-200">
                    <div className="flex justify-between items-center mb-2 sm:mb-3 md:mb-4">
                      <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold text-gray-800">Companion {idx + 2}</h3>
                      <button
                        type="button"
                        onClick={() => removeCompanion(companion.id)}
                        className="text-red-600 hover:text-red-800 transition-colors p-1"
                      >
                        <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      <Input 
                        label="Email Address" 
                        name="email" 
                        type="email" 
                        value={companion.email} 
                        onChange={e => handleCompanionChange(companion.id, e)} 
                        required 
                        placeholder="companion@example.com"
                      />
                      <p className="text-xs text-gray-500">
                        Companion will receive a link to complete their details after booking approval.
                      </p>
                    </div>
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addCompanion}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-2 sm:py-3 px-3 sm:px-4 md:px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 text-xs sm:text-sm md:text-base"
                >
                  <div className="flex items-center justify-center">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Companion
                  </div>
                </button>
              </div>
            )}

            {/* Date and Time Selection */}
            <div className="bg-purple-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-purple-200">
              <h2 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-gray-800 mb-3 sm:mb-4 md:mb-6 flex items-center">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 mr-2 sm:mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-xs sm:text-sm md:text-lg">Schedule Details</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                <Input 
                  label="Visit Date" 
                  type="date" 
                  required 
                  value={visitDate} 
                  onChange={e => setVisitDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Time Slot Selection */}
              {visitDate && (
                <div>
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
                    Select a Time Slot {slots.length > 0 && `(${slots.length} available)`}
                  </h3>
                  
                  {/* Debug info - remove in production */}
                  {process.env.NODE_ENV === 'development' && (
                    <div className="mb-4 p-2 bg-yellow-100 rounded text-xs">
                      Debug: {slots.length} slots loaded, visitDate: {visitDate}
                    </div>
                  )}
                  
                  {/* Loading state */}
                  {loading && (
                    <div className="text-center py-8">
                      <div className="inline-flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                        <span className="text-xs sm:text-sm text-gray-600">Loading available slots...</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Single responsive slot layout */}
                  {!loading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {Array.isArray(slots) && slots.length > 0 ? slots.map(slot => {
                        const isAvailable = slot.capacity > slot.booked;
                        const isSelected = selectedSlot === slot.time;
                        const occupancyPercentage = Math.round((slot.booked / slot.capacity) * 100);
                        
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            onClick={() => isAvailable && setSelectedSlot(slot.time)}
                            disabled={!isAvailable}
                            className={`p-3 sm:p-4 rounded-xl border-2 transition-all duration-300 ${
                              // Responsive height based on screen size
                              'min-h-[80px] sm:min-h-[100px] md:min-h-[120px] lg:min-h-[140px]'
                            } ${
                              isSelected
                                ? 'border-purple-500 bg-purple-50 shadow-lg transform scale-105'
                                : isAvailable
                                ? 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'
                                : 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                            }`}
                          >
                            {/* Mobile layout (stacked) */}
                            <div className="block sm:hidden">
                              <div className="flex items-center justify-between">
                                <div className="text-left">
                                  <div className="font-semibold text-gray-800 text-xs sm:text-sm">{slot.time}</div>
                                  <div className="text-xs text-gray-600">
                                    {slot.capacity - slot.booked} / {slot.capacity} available
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs font-medium text-gray-800">{occupancyPercentage}% full</div>
                                  <div className="w-12 bg-gray-200 rounded-full h-2 mt-1">
                                    <div 
                                      className={`h-2 rounded-full transition-all duration-300 ${
                                        occupancyPercentage > 80 ? 'bg-red-500' : 
                                        occupancyPercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                                      }`}
                                      style={{ width: `${occupancyPercentage}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Desktop/Tablet layout (centered) */}
                            <div className="hidden sm:block text-center h-full flex flex-col justify-center">
                              <div className="font-semibold text-gray-800 mb-2 text-xs sm:text-sm md:text-base">{slot.time}</div>
                              <div className="text-xs md:text-sm text-gray-600 mb-2">
                                {slot.capacity - slot.booked} / {slot.capacity} available
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    occupancyPercentage > 80 ? 'bg-red-500' : 
                                    occupancyPercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${occupancyPercentage}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-gray-500">{occupancyPercentage}% full</div>
                            </div>
                          </button>
                        );
                      }) : (
                        <div className="col-span-full text-center py-8">
                          <div className="text-gray-500">
                            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-xs sm:text-sm md:text-base">No time slots available for this date</p>
                            <p className="text-xs sm:text-sm text-gray-400 mt-1">Please try a different date</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!selectedSlot || isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white py-3 sm:py-4 px-6 sm:px-8 rounded-xl text-xs sm:text-sm md:text-lg font-semibold transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-xs sm:text-sm">Scheduling Visit...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs sm:text-sm md:text-lg">Schedule My Visit</span>
                </div>
              )}
            </button>
          </form>
        </div>

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-12">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-2">Visit Duration</h3>
            <p className="text-xs sm:text-sm md:text-base text-gray-600">Each time slot is 1 hour long, perfect for exploring our exhibits.</p>
          </div>
          
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-2">Free Admission</h3>
            <p className="text-xs sm:text-sm md:text-base text-gray-600">All visits are completely free. No admission fees required.</p>
          </div>
          
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-3 sm:mb-4">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-2">Confirmation</h3>
            <p className="text-xs sm:text-sm md:text-base text-gray-600">You'll receive an email confirmation with your booking details.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable Input Component
const Input = ({ label, className = "", ...props }) => (
  <div className={className}>
    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">{label}</label>
    <input 
      {...props} 
      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-xs sm:text-sm md:text-base" 
    />
  </div>
);

// Reusable Select Component
const Select = ({ label, options, className = "", placeholder, ...props }) => (
  <div className={className}>
    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">{label}</label>
    <select 
      {...props} 
      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-xs sm:text-sm md:text-base"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt, idx) => (
        <option key={idx} value={opt.toLowerCase()}>
          {opt}
        </option>
      ))}
    </select>
  </div>
);

export default ScheduleVisit;
