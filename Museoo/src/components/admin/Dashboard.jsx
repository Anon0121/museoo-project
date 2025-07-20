
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [stats, setStats] = useState({
    visitors: 0,
    schedules: 0,
    events: 0,
    exhibits: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("http://localhost:3000/api/stats/summary");
      if (!res.ok) throw new Error("Failed to fetch stats");
      const data = await res.json();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div>Loading dashboard stats...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white shadow p-6 rounded">
          <h2 className="text-gray-600 font-semibold">Total Visitors</h2>
          <p className="text-3xl font-bold mt-2 text-blue-600">{stats.visitors}</p>
        </div>
        <div className="bg-white shadow p-6 rounded">
          <h2 className="text-gray-600 font-semibold">Scheduled Tours</h2>
          <p className="text-3xl font-bold mt-2 text-green-600">{stats.schedules}</p>
        </div>
        <div className="bg-white shadow p-6 rounded">
          <h2 className="text-gray-600 font-semibold">Total Events</h2>
          <p className="text-3xl font-bold mt-2 text-purple-600">{stats.events}</p>
        </div>
        <div className="bg-white shadow p-6 rounded">
          <h2 className="text-gray-600 font-semibold">Total Exhibits</h2>
          <p className="text-3xl font-bold mt-2 text-pink-600">{stats.exhibits}</p>
        </div>
        <div className="bg-white shadow p-6 rounded flex flex-col items-center justify-center">
          <h2 className="text-gray-600 font-semibold mb-2">Visitor Scanner</h2>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-bold text-lg mt-2"
            onClick={() => navigate('/scanner')}
          >
            Visitor Scanner
          </button>
          <p className="text-xs text-gray-400 mt-2">Scan visitor QR codes here</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
