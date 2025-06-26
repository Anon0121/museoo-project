import React, { useEffect, useState } from "react";

const Visitors = () => {
  const [visitors, setVisitors] = useState([]);

  useEffect(() => {
    const data = localStorage.getItem("visitors");
    if (data) {
      setVisitors(JSON.parse(data));
    }
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Visitor Records</h1>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm text-left border-separate border-spacing-y-2">
          <thead className="bg-gray-100 text-gray-700 font-medium">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Nationality</th>
              <th className="p-3">Gender</th>
              <th className="p-3">Address</th>
              <th className="p-3">Purpose</th>
              <th className="p-3">Visit Type</th>
              <th className="p-3">Date</th>
              <th className="p-3">Time</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {visitors.length === 0 ? (
              <tr><td colSpan="9" className="text-center py-4 text-gray-500">No visitor records</td></tr>
            ) : (
              visitors.map((v) => (
                <tr key={v.id} className="bg-white hover:bg-gray-50">
                  <td className="p-3">{v.firstName} {v.lastName}</td>
                  <td className="p-3">{v.nationality}</td>
                  <td className="p-3">{v.gender}</td>
                  <td className="p-3">{v.address}</td>
                  <td className="p-3">{v.purpose}</td>
                  <td className="p-3">{v.visitType}</td>
                  <td className="p-3">{v.visitDate}</td>
                  <td className="p-3">{v.visitTime}</td>
                  <td className="p-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      v.status === "Approved" ? "bg-green-100 text-green-700" :
                      v.status === "Cancelled" ? "bg-red-100 text-red-600" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {v.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Visitors;
