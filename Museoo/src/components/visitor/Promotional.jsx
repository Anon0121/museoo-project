import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../config/api';

const Promotional = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [promotionalItems, setPromotionalItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPromotionalItems();
  }, []);

  const fetchPromotionalItems = async () => {
    try {
      const response = await api.get('/api/promotional');
      // Filter only active items and sort by order
      const activeItems = response.data
        .filter(item => item.isActive)
        .sort((a, b) => a.order - b.order);
      setPromotionalItems(activeItems);
    } catch (error) {
      console.error('Error fetching promotional items:', error);
      // Fallback to empty array if API fails
      setPromotionalItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (promotionalItems.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % promotionalItems.length);
      }, 5000); // Change slide every 5 seconds

      return () => clearInterval(interval);
    }
  }, [promotionalItems.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % promotionalItems.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + promotionalItems.length) % promotionalItems.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <section id="promotional" className="min-h-screen bg-gradient-to-br from-gray-50 to-[#8B6B21]/5 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Featured Highlights
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-[#8B6B21] to-[#D4AF37] mx-auto rounded-full mb-8"></div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Discover the amazing experiences and special exhibitions that await you at the Cagayan de Oro City Museum.
          </p>
        </div>

        {/* Promotional Carousel */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center space-x-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B6B21]"></div>
              <span className="text-gray-600 font-medium">Loading promotional content...</span>
            </div>
          </div>
        ) : promotionalItems.length > 0 ? (
          <div className="relative">
            {/* Main Carousel */}
            <div className="relative h-[500px] md:h-[600px] rounded-3xl overflow-hidden shadow-2xl">
            {promotionalItems.map((item, index) => (
              <div
                key={item.id}
                className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                  index === currentSlide ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'
                }`}
              >
                                 {/* Background Image */}
                 <div 
                   className="absolute inset-0 bg-cover bg-center"
                   style={{
                     backgroundImage: item.image 
                       ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${api.defaults.baseURL}${item.image})`
                       : 'linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4))'
                   }}
                 />
                
                                 {/* Content Overlay */}
                 <div className="absolute inset-0 flex items-center">
                   <div className="max-w-4xl mx-auto px-6 md:px-12 text-white" style={{ marginLeft: '15%' }}>
                    <div className="space-y-6">
                      {/* Badge */}
                      <div className="inline-block">
                        <span className="px-4 py-2 bg-gradient-to-r from-[#8B6B21] to-[#D4AF37] text-white rounded-full text-sm font-semibold">
                          {item.badge}
                        </span>
                      </div>
                      
                      {/* Title */}
                      <h3 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight">
                        {item.title}
                      </h3>
                      
                      {/* Subtitle */}
                      <p className="text-xl md:text-2xl text-gray-200 font-medium">
                        {item.subtitle}
                      </p>
                      
                      {/* Description */}
                      <p className="text-lg md:text-xl text-gray-300 max-w-2xl leading-relaxed">
                        {item.description}
                      </p>
                      
                                             {/* Promotional Badge */}
                       {item.ctaText && (
                         <div className="pt-4">
                           <span className="inline-flex items-center px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-semibold text-lg border border-white/30">
                             {item.ctaText}
                           </span>
                         </div>
                       )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-all duration-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-3 rounded-full hover:bg-white/30 transition-all duration-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3">
            {promotionalItems.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide 
                    ? 'bg-white scale-125' 
                    : 'bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
                     </div>
         </div>
       ) : (
         <div className="text-center py-12">
           <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
             <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
             </svg>
           </div>
           <h3 className="text-xl font-semibold text-gray-600 mb-2">No Promotional Content</h3>
           <p className="text-gray-500">Check back soon for exciting highlights and special exhibitions.</p>
         </div>
       )}

                  {/* Additional Promotional Cards */}
         <div className="mt-20">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {/* Quick Access Cards */}
             <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
               <div className="w-16 h-16 bg-gradient-to-r from-[#8B6B21] to-[#D4AF37] rounded-2xl flex items-center justify-center mb-6">
                 <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                 </svg>
               </div>
               <h3 className="text-xl font-bold text-gray-800 mb-4">Digital Archive Library</h3>
               <p className="text-gray-600 mb-6">
                 Explore our extensive digital archive library featuring historical documents, photographs, and cultural artifacts from Cagayan de Oro's rich heritage.
               </p>
               <Link
                 to="/archive"
                 className="inline-flex items-center text-[#8B6B21] font-semibold hover:text-[#D4AF37] transition-colors"
               >
                 Explore Archive
                 <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                 </svg>
               </Link>
             </div>

             <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
               <div className="w-16 h-16 bg-gradient-to-r from-[#8B6B21] to-[#D4AF37] rounded-2xl flex items-center justify-center mb-6">
                 <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                 </svg>
               </div>
               <h3 className="text-xl font-bold text-gray-800 mb-4">Plan Your Visit</h3>
               <p className="text-gray-600 mb-6">
                 Schedule your visit to the museum and ensure you have the best experience with our guided tours and special programs.
               </p>
               <Link
                 to="/schedule"
                 className="inline-flex items-center text-[#8B6B21] font-semibold hover:text-[#D4AF37] transition-colors"
               >
                 Schedule Visit
                 <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                 </svg>
               </Link>
             </div>
           </div>
         </div>
      </div>
    </section>
  );
};

export default Promotional;
