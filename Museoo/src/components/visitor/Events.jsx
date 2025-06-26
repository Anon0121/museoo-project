import React, { useState, useEffect } from "react";

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3000/api/activities/events")
      .then((res) => res.json())
      .then((data) => {
        // Map snake_case to camelCase
        const mapped = data.map((ev) => ({
          ...ev,
          date: ev.start_date,
          time: ev.time,
          images: ev.images,
          location: ev.location,
          organizer: ev.organizer,
          description: ev.description,
        }));
        setEvents(mapped);
        setLoading(false);
      })
      .catch(() => {
        setEvents([]);
        setLoading(false);
      });
  }, []);

  const now = new Date();
  const upcoming = events.filter((ev) => {
    const eventDateTime = new Date(ev.date);
    return eventDateTime > now;
  });
  const past = events.filter((ev) => {
    const eventDateTime = new Date(ev.date);
    return eventDateTime <= now;
  });

  return (
    <section className="w-[90%] mx-auto text-center pt-24" id="event">
      <h1 className="text-3xl md:text-4xl font-bold mb-4">Upcoming Events</h1>
      <p className="text-gray-600 mb-10">
        A new chapter in history unfolds — discover the untold stories and rare artifacts that await.
      </p>
      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <>
          {/* Upcoming Events */}
          <div className="mb-16">
            {upcoming.length === 0 ? (
              <div className="text-gray-500">No upcoming events at the moment.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {upcoming.map((event) => (
                  <div key={event.id} className="bg-gray-200 rounded-lg shadow p-6 flex flex-row items-center">
                    {/* Image */}
                    {event.images && event.images.length > 0 ? (
                      <div className="w-48 h-36 flex-shrink-0 flex items-center justify-center bg-white border mr-8">
                        <img
                          src={`http://localhost:3000${event.images[0]}`}
                          alt={event.title}
                          className="object-contain max-h-32 max-w-full"
                        />
                      </div>
                    ) : (
                      <div className="w-48 h-36 flex-shrink-0 flex items-center justify-center bg-white border mr-8">
                        <span className="text-gray-400 italic">No Image</span>
                      </div>
                    )}
                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-center text-left">
                      <div className="text-2xl font-bold mb-2">{event.title}</div>
                      <div className="text-lg mb-1">Date: <span className="font-normal">{formatDate(event.date)}</span>{event.time && <span className="ml-2 font-normal">{event.time}</span>}</div>
                      <div className="text-base mb-1">Location: <span className="font-normal">{event.location}</span></div>
                      <div className="text-base">{event.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
};

export default Events;
