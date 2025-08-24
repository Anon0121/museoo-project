import React, { useState, useEffect } from 'react';
import api from '../../config/api';

const Exhibits = () => {
  const [exhibits, setExhibits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedExhibit, setSelectedExhibit] = useState(null);


  useEffect(() => {
    fetchExhibits();
  }, []);

  const fetchExhibits = async () => {
    try {
      const response = await api.get('/api/activities/exhibits');
      // Map the data to handle single image
      const mappedExhibits = response.data.map(exhibit => ({
        ...exhibit,
        image: exhibit.images && exhibit.images.length > 0 ? exhibit.images[0] : null
      }));
      setExhibits(mappedExhibits);
    } catch (error) {
      console.error('Error fetching exhibits:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Filter exhibits based on active tab
  const upcomingExhibits = exhibits.filter(exhibit => 
    new Date(exhibit.start_date) > new Date()
  );
  const ongoingExhibits = exhibits.filter(exhibit => {
    const now = new Date();
    const startDate = new Date(exhibit.start_date);
    const endDate = exhibit.end_date ? new Date(exhibit.end_date) : null;
    
    // Exhibit is ongoing if:
    // 1. Start date is in the past or today
    // 2. End date is either null (no end date) or in the future
    return startDate <= now && (!endDate || endDate >= now);
  });

  const ExhibitCard = ({ exhibit }) => (
    <div 
      className="bg-white rounded-2xl shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer overflow-hidden group"
      onClick={() => setSelectedExhibit(exhibit)}
    >
      {/* Image Section */}
      <div className="relative h-48 overflow-hidden">
        {exhibit.image ? (
          <img
            src={`${api.defaults.baseURL}${exhibit.image}`}
            alt={exhibit.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div className="w-full h-full bg-gradient-to-br from-[#8B6B21]/20 to-[#D4AF37]/20 flex items-center justify-center" style={{ display: exhibit.image ? 'none' : 'flex' }}>
          <svg className="w-16 h-16 text-[#8B6B21]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <div className="absolute top-4 left-4 z-10">
          <span className="px-3 py-1 bg-[#8B6B21] text-white rounded-full text-xs font-semibold">
            {activeTab === 'upcoming' ? 'Coming Soon' : 'Now Showing'}
          </span>
        </div>
      </div>
      
      {/* Content Section */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2 group-hover:text-[#8B6B21] transition-colors">
          {exhibit.title}
        </h3>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-600">
            <svg className="w-4 h-4 mr-2 text-[#8B6B21]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="font-medium">{formatDate(exhibit.start_date)}</span>
          </div>
          
          {exhibit.end_date && (
            <div className="flex items-center text-gray-600">
              <svg className="w-4 h-4 mr-2 text-[#8B6B21]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Until {formatDate(exhibit.end_date)}</span>
            </div>
          )}
          
          {exhibit.location && (
            <div className="flex items-center text-gray-600">
              <svg className="w-4 h-4 mr-2 text-[#8B6B21]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="line-clamp-1">{exhibit.location}</span>
            </div>
          )}
        </div>

        <p className="text-gray-600 text-sm line-clamp-3 mb-4">
          {exhibit.description}
        </p>

        <button 
          onClick={() => setSelectedExhibit(exhibit)}
          className="w-full bg-gradient-to-r from-[#8B6B21] to-[#D4AF37] hover:from-[#D4AF37] hover:to-[#8B6B21] text-white py-3 px-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
        >
          View Details
        </button>
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-12">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-gray-600 mb-2">
        No {activeTab === 'upcoming' ? 'Upcoming' : 'Ongoing'} Exhibits
      </h3>
      <p className="text-gray-500">
        {activeTab === 'upcoming' 
          ? 'Check back soon for exciting new exhibits!' 
          : 'No exhibits are currently on display.'
        }
      </p>
    </div>
  );

  return (
    <section id="exhibit" className="min-h-screen bg-gradient-to-br from-gray-50 to-[#8B6B21]/5 py-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Our Exhibits
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-[#8B6B21] to-[#D4AF37] mx-auto rounded-full mb-8"></div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Explore our carefully curated exhibits that showcase the rich cultural heritage and history of Cagayan de Oro.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-2xl shadow-lg p-2 border border-gray-100">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === 'upcoming'
                    ? 'bg-gradient-to-r from-[#8B6B21] to-[#D4AF37] text-white shadow-lg'
                    : 'text-gray-600 hover:text-[#8B6B21] hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Upcoming</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('ongoing')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  activeTab === 'ongoing'
                    ? 'bg-gradient-to-r from-[#8B6B21] to-[#D4AF37] text-white shadow-lg'
                    : 'text-gray-600 hover:text-[#8B6B21] hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Ongoing</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Exhibits Grid */}
        <div className="space-y-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B6B21]"></div>
                <span className="text-gray-600 font-medium">Loading exhibits...</span>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'upcoming' && upcomingExhibits.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {upcomingExhibits.map((exhibit) => (
                    <ExhibitCard key={exhibit.id} exhibit={exhibit} />
                  ))}
                </div>
              )}
              
              {activeTab === 'ongoing' && ongoingExhibits.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {ongoingExhibits.map((exhibit) => (
                    <ExhibitCard key={exhibit.id} exhibit={exhibit} />
                  ))}
                </div>
              )}
              
              {((activeTab === 'upcoming' && upcomingExhibits.length === 0) ||
                (activeTab === 'ongoing' && ongoingExhibits.length === 0)) && (
                <EmptyState />
              )}
            </>
          )}
        </div>

        {/* Exhibit Details Modal */}
        {selectedExhibit && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="relative">
                {/* Modal Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">{selectedExhibit.title}</h2>
                      <span className="px-3 py-1 bg-[#8B6B21]/20 text-[#8B6B21] rounded-full text-sm font-medium mt-2 inline-block">
                        {activeTab === 'upcoming' ? 'Coming Soon' : 'Now Showing'}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedExhibit(null)}
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-6">
                  {/* Exhibit Image */}
                  {selectedExhibit.image && (
                    <div className="mb-6">
                      <div className="relative h-64 md:h-80 overflow-hidden rounded-xl">
                        <img
                          src={`${api.defaults.baseURL}${selectedExhibit.image}`}
                          alt={selectedExhibit.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="w-full h-full bg-gradient-to-br from-[#8B6B21]/20 to-[#D4AF37]/20 flex items-center justify-center" style={{ display: 'none' }}>
                          <svg className="w-16 h-16 text-[#8B6B21]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Exhibit Details */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center text-gray-600">
                        <svg className="w-5 h-5 mr-3 text-[#8B6B21]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">Start Date: {formatDate(selectedExhibit.start_date)}</span>
                      </div>
                      
                      {selectedExhibit.end_date && (
                        <div className="flex items-center text-gray-600">
                          <svg className="w-5 h-5 mr-3 text-[#8B6B21]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>End Date: {formatDate(selectedExhibit.end_date)}</span>
                        </div>
                      )}
                    </div>

                    {selectedExhibit.location && (
                      <div className="flex items-center text-gray-600">
                        <svg className="w-5 h-5 mr-3 text-[#8B6B21]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{selectedExhibit.location}</span>
                      </div>
                    )}

                    {selectedExhibit.curator && (
                      <div className="flex items-center text-gray-600">
                        <svg className="w-5 h-5 mr-3 text-[#8B6B21]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>Curator: {selectedExhibit.curator}</span>
                      </div>
                    )}

                    <div className="border-t border-gray-200 pt-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">Description</h3>
                      <p className="text-gray-600 leading-relaxed">{selectedExhibit.description}</p>
                    </div>

                    {selectedExhibit.category && (
                      <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Category</h3>
                        <p className="text-gray-600 leading-relaxed">{selectedExhibit.category}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-gray-200">
                  <button
                    onClick={() => setSelectedExhibit(null)}
                    className="w-full bg-gradient-to-r from-[#8B6B21] to-[#D4AF37] hover:from-[#D4AF37] hover:to-[#8B6B21] text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}


      </div>
    </section>
  );
};

export default Exhibits;
