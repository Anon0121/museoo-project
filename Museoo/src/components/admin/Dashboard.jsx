import React from "react";

const Dashboard = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white shadow p-6 rounded">
          <h2 className="text-gray-600 font-semibold">Today's Visitors</h2>
          <p className="text-3xl font-bold mt-2 text-blue-600">123</p>
        </div>
        <div className="bg-white shadow p-6 rounded">
          <h2 className="text-gray-600 font-semibold">Scheduled Tours</h2>
          <p className="text-3xl font-bold mt-2 text-green-600">25</p>
        </div>
        <div className="bg-white shadow p-6 rounded">
          <h2 className="text-gray-600 font-semibold">Total Donations</h2>
          <p className="text-3xl font-bold mt-2 text-yellow-600">₱10,500</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
