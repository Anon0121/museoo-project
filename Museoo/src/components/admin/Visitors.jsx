import React, { useEffect, useState } from "react";
import api from "../../config/api";

const Visitors = () => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const fetchVisitors = async () => {
    try {
      const response = await api.get('/api/visitors/all');
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
    if (!dateString) return 'Not scanned';
    const date = new Date(dateString);
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
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
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
      visitor.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "checked-in" && visitor.checkin_time && visitor.checkin_time !== 'Not checked in') ||
      (statusFilter === "not-checked-in" && (!visitor.checkin_time || visitor.checkin_time === 'Not checked in'));
    
    const matchesType = typeFilter === "all" || visitor.visitor_type === typeFilter;
    
    const matchesDate = dateFilter === "" || 
      (visitor.created_at && new Date(visitor.created_at).toISOString().split('T')[0] === dateFilter);
    
    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

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
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#2e2b41] mb-2">
              <i className="fa-solid fa-users mr-2 sm:mr-3"></i>
              Visitor Records
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">Real-time visitor tracking and records</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs sm:text-sm text-gray-500">Total Visitors</p>
            <p className="text-xl sm:text-2xl font-bold text-[#AB8841]">{visitors.length}</p>
            <p className="text-xs text-gray-400 mt-1">
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
            <span className="text-sm font-semibold text-green-600">Live Tracking Active</span>
          </div>
          <div className="text-xs sm:text-sm text-gray-500">
            Auto-refresh every 10 seconds
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search by name or email..."
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
              <option value="checked-in">Checked In</option>
              <option value="not-checked-in">Not Checked In</option>
            </select>
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
              <option value="Primary Visitor">Primary Visitor</option>
              <option value="Additional Visitor">Additional Visitor</option>
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

          {/* Results Count */}
          <div className="flex items-end">
            <div className="bg-[#AB8841] text-white px-4 py-2 rounded-lg font-medium">
              {filteredVisitors.length} visitors
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="block lg:hidden">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-[#AB8841] to-[#8B6B21]">
            <h3 className="text-lg sm:text-xl font-bold text-white">
              <i className="fa-solid fa-list mr-2"></i>
              All Visitors ({visitors.length})
            </h3>
          </div>
          <div className="p-4 sm:p-6">
            {filteredVisitors.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="text-gray-500">
                  <i className="fa-solid fa-users text-3xl sm:text-4xl mb-4 text-gray-300"></i>
                  <p className="text-base sm:text-lg">No visitor records found</p>
                  <p className="text-sm">Try adjusting your search or filters</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredVisitors.map((visitor, index) => (
                  <div key={visitor.visitor_id || index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm sm:text-base font-semibold text-[#2e2b41] truncate">
                          {visitor.first_name} {visitor.last_name}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-600">{visitor.email}</p>
                      </div>
                      <div className="ml-3 text-right">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          visitor.checkin_time 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {visitor.checkin_time ? 'Checked In' : 'Not Scanned'}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                      <div>
                        <span className="text-gray-500">Gender:</span>
                        <span className="ml-1 text-[#2e2b41] capitalize">{visitor.gender}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Nationality:</span>
                        <span className="ml-1 text-[#2e2b41]">{visitor.nationality}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Purpose:</span>
                        <span className="ml-1 text-[#2e2b41] capitalize">{visitor.purpose}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Type:</span>
                        <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                          visitor.visitor_type === 'Primary Visitor' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {visitor.visitor_type || 'Unknown'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Visit Date:</span>
                        <span className="ml-1 text-[#2e2b41]">{formatDate(visitor.created_at)}</span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs sm:text-sm">
                        <span className="text-gray-500">Address:</span>
                        <span className="ml-1 text-[#2e2b41] truncate block">{visitor.address}</span>
                      </div>
                      {visitor.checkin_time && (
                        <div className="mt-2 text-xs sm:text-sm">
                          <span className="text-gray-500">Scan Time:</span>
                          <span className="ml-1 text-green-600 font-medium">{formatDateTime(visitor.checkin_time)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-[#AB8841] to-[#8B6B21]">
            <h3 className="text-xl font-bold text-white">
              <i className="fa-solid fa-list mr-2"></i>
              All Visitors ({filteredVisitors.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">
                    Visitor Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">
                    Gender
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">
                    Nationality
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">
                    Purpose
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">
                    Visit Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-[#2e2b41] uppercase tracking-wider">
                    QR Scan Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVisitors.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <i className="fa-solid fa-users text-4xl mb-4 text-gray-300"></i>
                        <p className="text-lg">No visitor records found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredVisitors.map((visitor, index) => (
                    <tr key={visitor.visitor_id || index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-[#2e2b41]">
                          {visitor.first_name} {visitor.last_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#2e2b41] capitalize">
                          {visitor.gender}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#2e2b41]">
                          {visitor.nationality}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-[#2e2b41] max-w-xs truncate">
                          {visitor.address}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#2e2b41]">
                          {visitor.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#2e2b41] capitalize">
                          {visitor.purpose}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            visitor.visitor_type === 'Primary Visitor' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {visitor.visitor_type || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#2e2b41]">
                          {formatDate(visitor.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#2e2b41]">
                          {visitor.checkin_time ? (
                            <span className="text-green-600 font-semibold">
                              {formatDateTime(visitor.checkin_time)}
                            </span>
                          ) : (
                            <span className="text-gray-400">
                              Not scanned yet
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Summary */}
          {filteredVisitors.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing <span className="font-medium">{filteredVisitors.length}</span> of <span className="font-medium">{visitors.length}</span> visitors
                </div>
                <div className="text-sm text-gray-500">
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Visitors;
