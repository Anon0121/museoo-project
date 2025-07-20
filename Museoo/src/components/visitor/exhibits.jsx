import React, { useState, useEffect } from "react";

const Exhibits = () => {
  const [upcoming, setUpcoming] = useState([]);
  const [ongoing, setOngoing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalExhibit, setModalExhibit] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3000/api/activities/exhibits")
      .then((res) => res.json())
      .then((data) => {
        // Map snake_case to camelCase
        const mapped = data.map((ex) => ({
          ...ex,
          startDate: ex.start_date,
          endDate: ex.end_date,
          images: ex.images,
          location: ex.location,
          curator: ex.curator,
          category: ex.category,
          description: ex.description,
        }));
        const now = new Date();
        setUpcoming(mapped.filter((ex) => new Date(ex.startDate) > now));
        setOngoing(
          mapped.filter(
            (ex) =>
              new Date(ex.startDate) <= now && new Date(ex.endDate) >= now
          )
        );
        setLoading(false);
      })
      .catch(() => {
        setUpcoming([]);
        setOngoing([]);
        setLoading(false);
      });
  }, []);

  const ExhibitCard = ({ exhibit }) => (
    <div key={exhibit.id} className="bg-gray-200 rounded-lg shadow p-4 flex flex-col items-stretch">
      {/* Image */}
      {exhibit.images && exhibit.images.length > 0 ? (
        <div className="w-full aspect-[4/3] bg-white flex items-center justify-center mb-4 border">
          <img
            src={`http://localhost:3000${exhibit.images[0]}`}
            alt={exhibit.title}
            className="object-contain max-h-48 w-full"
          />
        </div>
      ) : (
        <div className="w-full aspect-[4/3] bg-white flex items-center justify-center mb-4 border">
          <span className="text-gray-400 italic">No Image</span>
        </div>
      )}
      {/* Title */}
      <div className="text-left font-bold text-lg mb-1">TITLE: <span className="font-normal">{exhibit.title}</span></div>
      {/* Dates */}
      <div className="text-left text-sm mb-1">
        <span className="font-semibold">Dates:</span> <span className="font-normal">{exhibit.startDate} - {exhibit.endDate}</span>
      </div>
      {/* Location */}
      <div className="text-left text-sm mb-3">LOCATION: {exhibit.location}</div>
      {/* See More */}
      <button
        className="text-left mt-2 text-blue-700 hover:underline text-base font-medium"
        onClick={() => setModalExhibit(exhibit)}
      >
        See More
      </button>
    </div>
  );

  return (
    <section className="w-[90%] mx-auto text-center pt-24" id="exhibit">
      <h1 className="text-3xl md:text-4xl font-bold mb-4">Upcoming Exhibits</h1>
      <p className="text-gray-600 mb-10">
        Discover the next big things at the Cagayan De Oro Museum.
      </p>
      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : upcoming.length === 0 ? (
        <div className="text-gray-500">No upcoming exhibits at the moment.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {upcoming.map((exhibit) => (
            <ExhibitCard key={exhibit.id} exhibit={exhibit} />
          ))}
        </div>
      )}

      <h1 className="text-3xl md:text-4xl font-bold mb-4 mt-16">Ongoing Exhibits</h1>
      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : ongoing.length === 0 ? (
        <div className="text-gray-500">No ongoing exhibits at the moment.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ongoing.map((exhibit) => (
            <ExhibitCard key={exhibit.id} exhibit={exhibit} />
          ))}
        </div>
      )}

      {/* Modal for viewing details */}
      {modalExhibit && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl"
              onClick={() => setModalExhibit(null)}
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-4">{modalExhibit.title}</h2>
            {modalExhibit.images && modalExhibit.images.length > 0 && (
              <div className="flex gap-2 mb-4 flex-wrap justify-center">
                {modalExhibit.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={`http://localhost:3000${img}`}
                    alt="exhibit"
                    className="w-24 h-24 object-cover rounded"
                  />
                ))}
              </div>
            )}
            <div className="mb-2 text-left"><strong>Description:</strong> {modalExhibit.description}</div>
            <div className="mb-2 text-left"><strong>Location:</strong> {modalExhibit.location}</div>
            <div className="mb-2 text-left"><strong>Curator:</strong> {modalExhibit.curator}</div>
            <div className="mb-2 text-left"><strong>Category:</strong> {modalExhibit.category}</div>
            <div className="mb-2 text-left"><strong>Start Date:</strong> {modalExhibit.startDate}</div>
            <div className="mb-2 text-left"><strong>End Date:</strong> {modalExhibit.endDate}</div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Exhibits;
