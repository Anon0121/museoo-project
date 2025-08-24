import React, { useEffect, useState } from "react";
import api from "../../config/api";

const Visitors = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("newest"); // newest, oldest
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [visitorsPerPage] = useState(10);

  const fetchVisitors = async () => {
    try {
      // Add cache-busting parameter to force fresh data
      const timestamp = new Date().getTime();
      const response = await api.get(`/api/visitors/all?t=${timestamp}`);
      
      // Debug: Log the response data
      console.log('🔍 Frontend received visitors data:', response.data.visitors?.length || 0, 'visitors');
      
      // All visitors in the list have been checked in
      console.log('📅 Visitors who have visited:', response.data.visitors?.length || 0);
      
      // Log unique visit times
      const checkinTimes = response.data.visitors?.map(v => v.checkin_time) || [];
      const uniqueTimes = [...new Set(checkinTimes)];
      console.log('🕐 Unique visit times:', uniqueTimes.length);
      uniqueTimes.forEach((time, index) => {
        console.log(`   ${index + 1}. ${time}`);
      });
      
      setVisitors(response.data.visitors || []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching visitors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitors();
    
    // Set up real-time updates every 10 seconds
    const interval = setInterval(fetchVisitors, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not visited yet';
    
    // Handle different date formats
    let date;
    if (typeof dateString === 'string') {
      date = new Date(dateString);
    } else if (dateString instanceof Date) {
      date = dateString;
    } else {
      return 'Not visited yet';
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Not visited yet';
    }
    
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not visited yet';
    
    // Handle different date formats
    let date;
    if (typeof dateString === 'string') {
      date = new Date(dateString);
    } else if (dateString instanceof Date) {
      date = dateString;
    } else {
      return 'Not visited yet';
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Not visited yet';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Filter visitors based on search and filters
  const filteredVisitors = visitors.filter(visitor => {
    const matchesSearch = searchTerm === "" || 
      `${visitor.first_name} ${visitor.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              visitor.visitorType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.address?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || visitor.visitor_type === typeFilter;
    
    const matchesDate = dateFilter === "" || 
      (visitor.checkin_time && new Date(visitor.checkin_time).toISOString().split('T')[0] === dateFilter);
    
    return matchesSearch && matchesType && matchesDate;
  }).sort((a, b) => {
    // Sort by check-in time
    const timeA = a.checkin_time ? new Date(a.checkin_time).getTime() : 0;
    const timeB = b.checkin_time ? new Date(b.checkin_time).getTime() : 0;
    
    if (sortOrder === "newest") {
      return timeB - timeA; // Newest first
    } else {
      return timeA - timeB; // Oldest first
    }
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredVisitors.length / visitorsPerPage);
  const indexOfLastVisitor = currentPage * visitorsPerPage;
  const indexOfFirstVisitor = indexOfLastVisitor - visitorsPerPage;
  const currentVisitors = filteredVisitors.slice(indexOfFirstVisitor, indexOfLastVisitor);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, dateFilter, sortOrder]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-[#2e2b41]">
          <i className="fa-solid fa-spinner fa-spin mr-2"></i>
          Loading visitor records...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#2e2b41] mb-2 font-['Lora']">
              <i className="fa-solid fa-users mr-2 sm:mr-3"></i>
              Visitor Records
            </h1>
            <p className="text-gray-600 text-sm sm:text-base font-['Telegraph']">Real-time visitor tracking and records</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs sm:text-sm text-gray-500 font-['Telegraph']">Total Visitors</p>
            <p className="text-xl sm:text-2xl font-bold text-[#AB8841] font-['Lora']">{visitors.length}</p>
            <p className="text-xs text-gray-400 mt-1 font-['Telegraph']">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Real-time Status */}
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <span className="text-sm font-semibold text-green-600 font-['Lora']">Live Tracking Active</span>
          </div>
          <div className="text-xs sm:text-sm text-gray-500 font-['Telegraph']">
            Auto-refresh every 10 seconds
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-['Lora']">Search</label>
            <input
              type="text"
              placeholder="Search by name, email, visitor type, purpose, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
              <option value="Primary Visitor">Primary Visitor</option>
              <option value="Additional Visitor">Additional Visitor</option>
              <option value="Walk-in Visitor">Walk-in Visitor</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-['Lora']">Visit Date</label>
                          <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] focus:border-transparent font-['Telegraph']"
              />
          </div>

          {/* Sort Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-['Lora']">Sort By</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#AB8841] focus:border-transparent font-['Telegraph']"
            >
              <option value="newest">Newest Scanned First</option>
              <option value="oldest">Oldest Scanned First</option>
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-end">
            <div className="bg-[#AB8841] text-white px-4 py-2 rounded-lg font-medium font-['Telegraph']">
              {filteredVisitors.length} visitors
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="block lg:hidden">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-[#AB8841] to-[#8B6B21]">
            <h3 className="text-lg sm:text-xl font-bold text-white font-['Lora']">
              <i className="fa-solid fa-list mr-2"></i>
              All Visitors ({visitors.length})
            </h3>
          </div>
          <div className="p-4 sm:p-6">
            {currentVisitors.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="text-gray-500">
                  <i className="fa-solid fa-users text-3xl sm:text-4xl mb-4 text-gray-300"></i>
                  <p className="text-base sm:text-lg font-['Lora']">No visitor records found</p>
                  <p className="text-sm font-['Telegraph']">Try adjusting your search or filters</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {currentVisitors.map((visitor, index) => (
                  <div key={visitor.visitor_id || index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm sm:text-base font-semibold text-[#2e2b41] truncate font-['Lora']">
                          {visitor.first_name} {visitor.last_name}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-600 font-['Telegraph']">{visitor.email}</p>
                      </div>
                      <div className="ml-3 text-right">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 font-['Telegraph']">
                          Visited
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                      <div>
                        <span className="text-gray-500 font-['Telegraph']">Gender:</span>
                        <span className="ml-1 text-[#2e2b41] capitalize font-['Telegraph']">{visitor.gender}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 font-['Telegraph']">Visitor Type:</span>
                        <span className="ml-1 text-[#2e2b41] capitalize font-['Telegraph']">{visitor.visitor_type}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 font-['Telegraph']">Purpose:</span>
                        <span className="ml-1 text-[#2e2b41] capitalize font-['Telegraph']">{visitor.purpose}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 font-['Telegraph']">Type:</span>
                        <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium font-['Telegraph'] ${
                          visitor.visitor_type === 'Primary Visitor' 
                            ? 'bg-blue-100 text-blue-800' 
                            : visitor.visitor_type === 'Walk-in Visitor'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {visitor.visitor_type || 'Unknown'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 font-['Telegraph']">Booking:</span>
                        <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium font-['Telegraph'] ${
                          visitor.booking_type === 'individual' 
                            ? 'bg-blue-100 text-blue-800' 
                            : visitor.booking_type === 'group'
                            ? 'bg-purple-100 text-purple-800'
                            : visitor.booking_type === 'ind-walkin'
                            ? 'bg-orange-100 text-orange-800'
                            : visitor.booking_type === 'group-walkin'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {visitor.booking_type || 'Unknown'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500 font-['Telegraph']">Visit Date & Time:</span>
                        <span className="ml-1 text-[#2e2b41] font-['Telegraph']">
                          {formatDateTime(visitor.checkin_time)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs sm:text-sm">
                        <span className="text-gray-500 font-['Telegraph']">Address:</span>
                        <span className="ml-1 text-[#2e2b41] truncate block font-['Telegraph']">{visitor.address}</span>
                      </div>
                      <div className="mt-2 text-xs sm:text-sm">
                        <span className="text-gray-500 font-['Telegraph']">Visit Time:</span>
                        <span className="ml-1 text-green-600 font-medium font-['Telegraph']">{formatDateTime(visitor.checkin_time)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Mobile Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-['Telegraph']"
                >
                  <i className="fa-solid fa-chevron-left mr-1"></i>
                  Previous
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 text-sm rounded-lg font-['Telegraph'] ${
                        currentPage === page
                          ? 'bg-[#AB8841] text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-['Telegraph']"
                >
                  Next
                  <i className="fa-solid fa-chevron-right ml-1"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#AB8841] to-[#8B6B21]">
            <h3 className="text-xl font-bold text-white font-['Lora']">
              <i className="fa-solid fa-list mr-2"></i>
              All Visitors ({filteredVisitors.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider font-['Lora']">
                    Visitor Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider font-['Lora']">
                    Gender
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider font-['Lora']">
                    Visitor Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider font-['Lora']">
                    Address
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider font-['Lora']">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider font-['Lora']">
                    Purpose
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider font-['Lora']">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider font-['Lora']">
                    Booking Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider font-['Lora']">
                    Visit Date & Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider font-['Lora']">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentVisitors.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <i className="fa-solid fa-users text-4xl mb-4 text-gray-300"></i>
                        <p className="text-lg font-['Lora']">No visitor records found</p>
                        <p className="text-sm font-['Telegraph']">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  currentVisitors.map((visitor, index) => (
                    <tr key={visitor.visitor_id || index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-[#2e2b41] font-['Lora']">
                          {visitor.first_name} {visitor.last_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#2e2b41] capitalize font-['Telegraph']">
                          {visitor.gender}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#2e2b41] capitalize font-['Telegraph']">
                          {visitor.visitor_type}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-[#2e2b41] max-w-xs truncate font-['Telegraph']">
                          {visitor.address}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#2e2b41] font-['Telegraph']">
                          {visitor.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#2e2b41] capitalize font-['Telegraph']">
                          {visitor.purpose}
                        </div>
                      </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium font-['Telegraph'] ${
                            visitor.visitor_type === 'Primary Visitor' 
                              ? 'bg-blue-100 text-blue-800' 
                              : visitor.visitor_type === 'Walk-in Visitor'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {visitor.visitor_type || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium font-['Telegraph'] ${
                            visitor.booking_type === 'individual' 
                              ? 'bg-blue-100 text-blue-800' 
                              : visitor.booking_type === 'group'
                              ? 'bg-purple-100 text-purple-800'
                              : visitor.booking_type === 'ind-walkin'
                              ? 'bg-orange-100 text-orange-800'
                              : visitor.booking_type === 'group-walkin'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {visitor.booking_type || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-[#2e2b41] font-['Telegraph']">
                        {formatDateTime(visitor.checkin_time)}
                      </div>
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 font-['Telegraph']">
                            Visited
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Summary and Pagination */}
          {filteredVisitors.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-sm text-gray-700 font-['Telegraph']">
                  Showing <span className="font-medium">{indexOfFirstVisitor + 1}</span> to <span className="font-medium">{Math.min(indexOfLastVisitor, filteredVisitors.length)}</span> of <span className="font-medium">{filteredVisitors.length}</span> visitors
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-gray-500 font-['Telegraph']">
                    Last updated: {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-['Telegraph']"
                  >
                    <i className="fa-solid fa-chevron-left mr-1"></i>
                    Previous
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 text-sm rounded-lg font-['Telegraph'] ${
                          currentPage === page
                            ? 'bg-[#AB8841] text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-['Telegraph']"
                  >
                    Next
                    <i className="fa-solid fa-chevron-right ml-1"></i>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Visitors;
