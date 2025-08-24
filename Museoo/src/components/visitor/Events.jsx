import React, { useState, useEffect } from 'react';
import api from '../../config/api';
import EventRegistration from './EventRegistration';



const Events = () => {

  const [events, setEvents] = useState([]);

  const [loading, setLoading] = useState(true);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [selectedEventForRegistration, setSelectedEventForRegistration] = useState(null);



  useEffect(() => {

    fetchEvents();

  }, []);



  const fetchEvents = async () => {

    try {

      const response = await api.get('/api/activities/events');

      // Filter for upcoming events only (today and future dates)

      const today = new Date();

      today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

      const upcomingEvents = response.data.filter(event => {

        const eventDate = new Date(event.start_date);

        eventDate.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

        return eventDate >= today; // Only include today and future events

      });

      setEvents(upcomingEvents);

    } catch (error) {

      console.error('Error fetching events:', error);

    } finally {

      setLoading(false);

    }

  };



  // Function to determine event status and label

  const getEventStatus = (eventDate) => {

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const eventDateObj = new Date(eventDate);

    eventDateObj.setHours(0, 0, 0, 0);

    if (eventDateObj.getTime() === today.getTime()) {

      return { label: 'Event Now', className: 'bg-green-500 text-white' };

    } else if (eventDateObj > today) {

      return { label: 'Coming Soon', className: 'bg-blue-500 text-white' };

    }

    return null; // This shouldn't happen due to filtering, but just in case

  };

  const formatTime = (timeString) => {

    if (!timeString) return '';

    const time = new Date(`2000-01-01T${timeString}`);

    return time.toLocaleTimeString('en-US', { 

      hour: 'numeric', 

      minute: '2-digit',

      hour12: true 

    });

  };



  const EventCard = ({ event }) => {

    const eventStatus = getEventStatus(event.start_date);

    return (

      <div 

        className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"

        onClick={() => setSelectedEvent(event)}

      >

        {/* Event status badge at the top */}

        {eventStatus && (

          <div className="flex justify-start mb-3">

            <span className={`px-3 py-1 rounded-full text-xs font-medium ${eventStatus.className}`}>

              {eventStatus.label}

            </span>

          </div>

        )}

        <div className="flex items-start justify-between mb-4">

          <div className="flex-1">

            <h3 className="text-xl font-bold text-gray-800 mb-2">{event.title}</h3>

          </div>

          <div className="w-12 h-12 bg-gradient-to-br from-[#8B6B21] to-[#D4AF37] rounded-xl flex items-center justify-center ml-4 flex-shrink-0">

            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">

              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />

            </svg>

          </div>

        </div>

      

      <div className="flex items-center justify-between text-sm text-gray-500">

        <div className="flex items-center space-x-4">

          <span className="flex items-center">

            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">

              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />

            </svg>

            {new Date(event.start_date).toLocaleDateString()}

          </span>



          <span className="flex items-center">

            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">

              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />

            </svg>

            {(event.max_capacity || 50) - (event.current_registrations || 0)} slots left

          </span>

        </div>

        <span className="px-3 py-1 bg-[#8B6B21]/20 text-[#8B6B21] rounded-full text-xs font-medium">

          Event

        </span>

      </div>
      
      {/* Registration Button */}
      <div className="mt-4">
        {(event.current_registrations || 0) >= (event.max_capacity || 50) ? (
          <button
            disabled
            className="w-full bg-gray-400 text-white py-3 px-4 rounded-xl font-semibold cursor-not-allowed"
          >
            Event Full
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedEventForRegistration(event);
              setShowRegistration(true);
            }}
            className="w-full bg-gradient-to-r from-[#8B6B21] to-[#D4AF37] hover:from-[#D4AF37] hover:to-[#8B6B21] text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
          >
            Register Now
          </button>
        )}
      </div>

    </div>

  );

  };



  const EmptyState = () => (

    <div className="text-center py-12">

      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">

        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">

          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />

        </svg>

      </div>

      <h3 className="text-xl font-semibold text-gray-600 mb-2">No Upcoming Events</h3>

      <p className="text-gray-500">Check back later for exciting events and activities.</p>

    </div>

  );



  return (

    <section id="event" className="min-h-screen bg-gradient-to-br from-gray-50 to-[#8B6B21]/5 py-20 px-4">

      <div className="max-w-6xl mx-auto">

        {/* Header */}

        <div className="text-center mb-16">

          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">

            Upcoming Events

          </h2>

          <div className="w-24 h-1 bg-gradient-to-r from-[#8B6B21] to-[#D4AF37] mx-auto rounded-full mb-8"></div>

          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">

            Join us for exciting events, educational programs, and cultural activities that celebrate the rich heritage of Cagayan de Oro.

          </p>

        </div>



        {/* Events Grid */}

        <div className="space-y-8">

          {loading ? (

            <div className="text-center py-12">

              <div className="inline-flex items-center space-x-3">

                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B6B21]"></div>

                <span className="text-gray-600 font-medium">Loading events...</span>

              </div>

            </div>

          ) : events.length > 0 ? (

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">

              {events.map((event) => (

                <EventCard key={event.id} event={event} />

              ))}

            </div>

          ) : (

            <EmptyState />

          )}

        </div>



        {/* Event Details Modal */}

        {selectedEvent && (

          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">

            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">

              <div className="p-8">

                <div className="flex items-start justify-between mb-6">

                  <div className="flex items-center space-x-4">

                    <div className="w-16 h-16 bg-gradient-to-br from-[#8B6B21] to-[#D4AF37] rounded-xl flex items-center justify-center">

                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />

                      </svg>

                    </div>

                    <div>

                      <h3 className="text-2xl font-bold text-gray-800">{selectedEvent.title}</h3>

                      <div className="flex items-center space-x-2 mt-2">

                        {/* Event status badge */}

                        {getEventStatus(selectedEvent.start_date) && (

                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEventStatus(selectedEvent.start_date).className}`}>

                            {getEventStatus(selectedEvent.start_date).label}

                          </span>

                        )}

                        {/* Event type badge */}

                        <span className="px-3 py-1 bg-[#8B6B21]/20 text-[#8B6B21] rounded-full text-sm font-medium">

                          Event

                        </span>

                      </div>

                    </div>

                  </div>

                  <button

                    onClick={() => setSelectedEvent(null)}

                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"

                  >

                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />

                    </svg>

                  </button>

                </div>



                <div className="space-y-6">

                  <div>

                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Description</h4>

                    <p className="text-gray-600 leading-relaxed">{selectedEvent.description}</p>

                  </div>



                  <div className="grid md:grid-cols-2 gap-6">

                    <div className="bg-gray-50 rounded-xl p-4">

                      <div className="flex items-center space-x-3 mb-2">

                        <svg className="w-5 h-5 text-[#8B6B21]" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />

                        </svg>

                        <span className="font-semibold text-gray-800">Date</span>

                      </div>

                      <p className="text-gray-600">{new Date(selectedEvent.start_date).toLocaleDateString('en-US', { 

                        weekday: 'long', 

                        year: 'numeric', 

                        month: 'long', 

                        day: 'numeric' 

                      })}</p>

                    </div>



                    <div className="bg-gray-50 rounded-xl p-4">

                      <div className="flex items-center space-x-3 mb-2">

                        <svg className="w-5 h-5 text-[#8B6B21]" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />

                        </svg>

                        <span className="font-semibold text-gray-800">Time</span>

                      </div>

                      <p className="text-gray-600">{formatTime(selectedEvent.time)}</p>

                    </div>

                  </div>



                  {selectedEvent.location && (

                    <div className="bg-gray-50 rounded-xl p-4">

                      <div className="flex items-center space-x-3 mb-2">

                        <svg className="w-5 h-5 text-[#8B6B21]" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />

                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />

                        </svg>

                        <span className="font-semibold text-gray-800">Location</span>

                      </div>

                      <p className="text-gray-600">{selectedEvent.location}</p>

                    </div>

                  )}



                  {selectedEvent.organizer && (

                    <div className="bg-gray-50 rounded-xl p-4">

                      <div className="flex items-center space-x-3 mb-2">

                        <svg className="w-5 h-5 text-[#8B6B21]" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />

                        </svg>

                        <span className="font-semibold text-gray-800">Organizer</span>

                      </div>

                      <p className="text-gray-600">{selectedEvent.organizer}</p>

                    </div>

                  )}

                  <div className="bg-gray-50 rounded-xl p-4">

                    <div className="flex items-center space-x-3 mb-2">

                      <svg className="w-5 h-5 text-[#8B6B21]" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />

                      </svg>

                      <span className="font-semibold text-gray-800">Capacity</span>

                    </div>

                    <p className="text-gray-600">{(selectedEvent.max_capacity || 50) - (selectedEvent.current_registrations || 0)} slots remaining</p>

                  </div>



                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">

                    {(selectedEvent.current_registrations || 0) >= (selectedEvent.max_capacity || 50) ? (
                      <button
                        disabled
                        className="px-6 py-3 bg-gray-400 text-white rounded-xl font-semibold cursor-not-allowed"
                      >
                        Event Full
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedEventForRegistration(selectedEvent);
                          setShowRegistration(true);
                          setSelectedEvent(null);
                        }}
                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                      >
                        Register Now
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedEvent(null)}
                      className="px-6 py-3 bg-gradient-to-r from-[#8B6B21] to-[#D4AF37] hover:from-[#D4AF37] hover:to-[#8B6B21] text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                    >
                      Close
                    </button>

                  </div>

                </div>

              </div>

            </div>

          </div>

        )}

        {/* Event Registration Modal */}
        {showRegistration && selectedEventForRegistration && (
          <EventRegistration
            exhibit={selectedEventForRegistration}
            onClose={() => {
              setShowRegistration(false);
              setSelectedEventForRegistration(null);
            }}
            onRegistrationSuccess={(registration) => {
              console.log('Registration successful:', registration);
              setShowRegistration(false);
              setSelectedEventForRegistration(null);
              // Optionally refresh the events to update capacity
              fetchEvents();
            }}
          />
        )}

      </div>

    </section>

  );

};



export default Events;



