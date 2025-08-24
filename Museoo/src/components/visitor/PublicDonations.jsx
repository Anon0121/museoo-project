import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const PublicDonations = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPublicDonations();
  }, []);

  const fetchPublicDonations = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/donations/public');
      setDonations(response.data.donations || []);
    } catch (error) {
      console.error('Error fetching public donations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'monetary':
        return (
          <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
      case 'artifact':
        return (
          <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'document':
        return (
          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'loan':
        return (
          <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        );
    }
  };

  const getTypeLabel = (type) => {
    switch (type?.toLowerCase()) {
      case 'monetary': return 'Monetary Donation';
      case 'artifact': return 'Artifact/Historical Item';
      case 'document': return 'Document/Archive';
      case 'loan': return 'Loan (Temporary)';
      default: return 'Donation';
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

  const formatAmount = (amount) => {
    if (!amount) return '';
    return `₱${parseFloat(amount).toLocaleString()}`;
  };

  const filteredDonations = donations.filter(donation => {
    const matchesFilter = filter === 'all' || donation.display_category === filter;
    const matchesSearch = !searchTerm || 
      donation.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.display_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.display_donor?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'monetary', label: 'Monetary Donations' },
    { value: 'artifact', label: 'Artifacts' },
    { value: 'document', label: 'Documents' },
    { value: 'loan', label: 'Loans' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37] mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading donations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <div className="bg-black/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-white hover:text-[#D4AF37] transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white">Our Generous Donors</h1>
                <p className="text-gray-400">Celebrating the contributions that help preserve our cultural heritage</p>
              </div>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-[#8B6B21] to-[#D4AF37] rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="bg-black/30 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Search Donations
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by donor name, description, or type..."
                  className="w-full px-4 py-3 pl-12 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-all duration-300"
                />
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Filter by Category
              </label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent transition-all duration-300"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Featured Donations */}
        {donations.filter(d => d.featured).length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <svg className="w-6 h-6 text-[#D4AF37] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Featured Donations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {donations.filter(d => d.featured).map((donation) => (
                <div key={donation.id} className="bg-gradient-to-br from-[#D4AF37]/20 to-[#8B6B21]/20 backdrop-blur-sm border border-[#D4AF37]/30 rounded-2xl p-6 hover:from-[#D4AF37]/30 hover:to-[#8B6B21]/30 transition-all duration-300">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getTypeIcon(donation.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {donation.display_name || 'Generous Donation'}
                      </h3>
                      <p className="text-gray-300 text-sm mb-3">
                        {donation.display_description || 'A valuable contribution to our museum'}
                      </p>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-gray-400">
                          <span className="font-medium">Donor:</span>
                          <span className="ml-2 text-white">{donation.display_donor}</span>
                        </div>
                        {donation.display_amount && donation.amount && (
                          <div className="flex items-center text-gray-400">
                            <span className="font-medium">Amount:</span>
                            <span className="ml-2 text-[#D4AF37] font-semibold">{formatAmount(donation.amount)}</span>
                          </div>
                        )}
                        {donation.display_date && donation.date_received && (
                          <div className="flex items-center text-gray-400">
                            <span className="font-medium">Date:</span>
                            <span className="ml-2 text-white">{formatDate(donation.date_received)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-[#D4AF37]/20">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#D4AF37]/20 text-[#D4AF37]">
                      {getTypeLabel(donation.type)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Donations */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">
            Recent Donations ({filteredDonations.length})
          </h2>
          
          {filteredDonations.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">No Donations Found</h3>
              <p className="text-gray-400">Try adjusting your search terms or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDonations.map((donation) => (
                <div key={donation.id} className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 hover:bg-gray-700/50 transition-all duration-300">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {getTypeIcon(donation.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {donation.display_name || 'Generous Donation'}
                      </h3>
                      {donation.display_description && (
                        <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                          {donation.display_description}
                        </p>
                      )}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center text-gray-400">
                          <span className="font-medium">Donor:</span>
                          <span className="ml-2 text-white">{donation.display_donor}</span>
                        </div>
                        {donation.display_amount && donation.amount && (
                          <div className="flex items-center text-gray-400">
                            <span className="font-medium">Amount:</span>
                            <span className="ml-2 text-[#D4AF37] font-semibold">{formatAmount(donation.amount)}</span>
                          </div>
                        )}
                        {donation.display_date && donation.date_received && (
                          <div className="flex items-center text-gray-400">
                            <span className="font-medium">Date:</span>
                            <span className="ml-2 text-white">{formatDate(donation.date_received)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                      {getTypeLabel(donation.type)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-[#8B6B21] to-[#D4AF37] rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-white mb-4">
              Want to Make a Difference?
            </h3>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              Your donation helps us preserve and showcase the rich cultural heritage of Cagayan de Oro City. 
              Every contribution, no matter the size, makes a meaningful impact.
            </p>
            <Link
              to="/donate"
              className="inline-flex items-center px-8 py-3 bg-white text-[#8B6B21] font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Make a Donation
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicDonations;
