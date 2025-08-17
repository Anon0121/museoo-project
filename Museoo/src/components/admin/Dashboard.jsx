
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../config/api";

const Dashboard = ({ userPermissions, setActiveTab }) => {
  const [stats, setStats] = useState({
    visitors: 0,
    schedules: 0,
    events: 0,
    exhibits: 0,
    culturalObjects: 0,
    donations: 0,
    archives: 0,
    todayVisitors: 0,
    todayBookings: 0,
    pendingDonations: 0,
    recentBookings: [],
    recentDonations: [],
    recentActivities: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/api/stats/summary");
      setStats(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hour${Math.floor(diffInMinutes / 60) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffInMinutes / 1440)} day${Math.floor(diffInMinutes / 1440) > 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-[#2e2b41]">
          <i className="fa-solid fa-spinner fa-spin mr-2"></i>
          Loading dashboard stats...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 md:p-6 text-red-700">
        <i className="fa-solid fa-exclamation-triangle mr-2"></i>
        Error: {error}
      </div>
    );
  }

  const mainStatCards = [
    {
      title: "Total Visitors",
      value: stats.visitors,
      icon: "fa-users",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600"
    },
    {
      title: "Scheduled Tours",
      value: stats.schedules,
      icon: "fa-calendar-check",
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-600"
    },
    {
      title: "Total Events",
      value: stats.events,
      icon: "fa-calendar-week",
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600"
    },
    {
      title: "Total Exhibits",
      value: stats.exhibits,
      icon: "fa-eye",
      color: "from-pink-500 to-pink-600",
      bgColor: "bg-pink-50",
      textColor: "text-pink-600"
    }
  ];

  const todayStatCards = [
    {
      title: "Today's Visitors",
      value: stats.todayVisitors,
      icon: "fa-user-plus",
      color: "from-emerald-500 to-emerald-600",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-600"
    },
    {
      title: "Today's Bookings",
      value: stats.todayBookings,
      icon: "fa-calendar-day",
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600"
    },
    {
      title: "Pending Donations",
      value: stats.pendingDonations,
      icon: "fa-clock",
      color: "from-yellow-500 to-yellow-600",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-600"
    },
    {
      title: "Cultural Objects",
      value: stats.culturalObjects,
      icon: "fa-landmark",
      color: "from-indigo-500 to-indigo-600",
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-600"
    }
  ];

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#2e2b41] mb-2">
              <i className="fa-solid fa-chart-line mr-2 sm:mr-3"></i>
              Admin Dashboard
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">Real-time overview of museum activities and statistics</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs sm:text-sm text-gray-500">Last updated</p>
            <p className="text-xs sm:text-sm font-semibold text-[#2e2b41]">
              {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {mainStatCards.map((card, index) => (
          <div key={index} className={`${card.bgColor} rounded-lg shadow-lg p-4 sm:p-6 border border-gray-200 hover:shadow-xl transition-shadow`}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h2 className="text-gray-600 font-semibold text-xs sm:text-sm uppercase tracking-wide truncate">
                  {card.title}
                </h2>
                <p className={`text-xl sm:text-2xl md:text-4xl font-bold mt-1 sm:mt-2 ${card.textColor}`}>
                  {card.value.toLocaleString()}
                </p>
              </div>
              <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r ${card.color} flex items-center justify-center flex-shrink-0 ml-2 sm:ml-3`}>
                <i className={`fa-solid ${card.icon} text-white text-sm sm:text-lg md:text-xl`}></i>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Today's Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {todayStatCards.map((card, index) => (
          <div key={index} className={`${card.bgColor} rounded-lg shadow-lg p-4 sm:p-6 border border-gray-200 hover:shadow-xl transition-shadow`}>
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <h2 className="text-gray-600 font-semibold text-xs sm:text-sm uppercase tracking-wide truncate">
                  {card.title}
                </h2>
                <p className={`text-xl sm:text-2xl md:text-4xl font-bold mt-1 sm:mt-2 ${card.textColor}`}>
                  {card.value.toLocaleString()}
                </p>
              </div>
              <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r ${card.color} flex items-center justify-center flex-shrink-0 ml-2 sm:ml-3`}>
                <i className={`fa-solid ${card.icon} text-white text-sm sm:text-lg md:text-xl`}></i>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Bookings */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-bold text-[#2e2b41]">
                <i className="fa-solid fa-calendar-check mr-2 sm:mr-3 text-[#AB8841]"></i>
                Recent Bookings
              </h3>
              <button
                onClick={() => setActiveTab("Schedule")}
                className="text-[#AB8841] hover:text-[#8B6B21] text-sm sm:text-base font-medium transition-colors"
              >
                View All
              </button>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            {stats.recentBookings && stats.recentBookings.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {stats.recentBookings.slice(0, 5).map((booking, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm sm:text-base text-[#2e2b41] truncate">
                        {booking.visitor_name || `${booking.firstName} ${booking.lastName}`}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        {new Date(booking.date).toLocaleDateString()} at {booking.time}
                      </p>
                    </div>
                    <span className="text-xs sm:text-sm text-gray-500 ml-2">
                      {formatTimeAgo(booking.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <i className="fa-solid fa-calendar-times text-3xl sm:text-4xl text-gray-300 mb-3 sm:mb-4"></i>
                <p className="text-gray-500 text-sm sm:text-base">No recent bookings</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Donations */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg sm:text-xl font-bold text-[#2e2b41]">
                <i className="fa-solid fa-hand-holding-dollar mr-2 sm:mr-3 text-[#AB8841]"></i>
                Recent Donations
              </h3>
              <button
                onClick={() => setActiveTab("Donation")}
                className="text-[#AB8841] hover:text-[#8B6B21] text-sm sm:text-base font-medium transition-colors"
              >
                View All
              </button>
            </div>
          </div>
          <div className="p-4 sm:p-6">
            {stats.recentDonations && stats.recentDonations.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {stats.recentDonations.slice(0, 5).map((donation, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm sm:text-base text-[#2e2b41] truncate">
                        {donation.donor_name || `${donation.firstName} ${donation.lastName}`}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600">
                        ₱{donation.amount?.toLocaleString() || '0'} - {donation.type}
                      </p>
                    </div>
                    <span className="text-xs sm:text-sm text-gray-500 ml-2">
                      {formatTimeAgo(donation.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8">
                <i className="fa-solid fa-hand-holding-dollar text-3xl sm:text-4xl text-gray-300 mb-3 sm:mb-4"></i>
                <p className="text-gray-500 text-sm sm:text-base">No recent donations</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold text-[#2e2b41] mb-4 sm:mb-6">
          <i className="fa-solid fa-bolt mr-2 sm:mr-3 text-[#AB8841]"></i>
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <button
            onClick={() => setActiveTab("Schedule")}
            className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
          >
            <i className="fa-solid fa-calendar-plus text-blue-600 text-lg sm:text-xl group-hover:scale-110 transition-transform"></i>
            <span className="font-medium text-sm sm:text-base text-blue-700">Add Booking</span>
          </button>
          <button
            onClick={() => setActiveTab("Event")}
            className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
          >
            <i className="fa-solid fa-calendar-week text-purple-600 text-lg sm:text-xl group-hover:scale-110 transition-transform"></i>
            <span className="font-medium text-sm sm:text-base text-purple-700">Create Event</span>
          </button>
          <button
            onClick={() => setActiveTab("Exhibit")}
            className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors group"
          >
            <i className="fa-solid fa-eye text-pink-600 text-lg sm:text-xl group-hover:scale-110 transition-transform"></i>
            <span className="font-medium text-sm sm:text-base text-pink-700">Add Exhibit</span>
          </button>
          <button
            onClick={() => setActiveTab("AddUser")}
            className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
          >
            <i className="fa-solid fa-user-plus text-green-600 text-lg sm:text-xl group-hover:scale-110 transition-transform"></i>
            <span className="font-medium text-sm sm:text-base text-green-700">Add User</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
