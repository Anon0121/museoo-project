import React from "react";
import { FaHouse, FaCalendar, FaUsers, FaEye, FaCalendarWeek, FaBoxArchive, FaHandHoldingDollar, FaGear, FaUserPlus, FaRightFromBracket } from "react-icons/fa6";

const Sidebar = ({ isOpen, onNavigate, onLogout }) => {
  const menuItems = [
    { name: "Dashboard", icon: <FaHouse />, key: "dashboard" },
    { name: "Schedule", icon: <FaCalendar />, key: "schedule" },
    { name: "Visitors", icon: <FaUsers />, key: "visitors" },
    { name: "Exhibit", icon: <FaEye />, key: "exhibit" },
    { name: "Events", icon: <FaCalendarWeek />, key: "events" },
    { name: "Archive", icon: <FaBoxArchive />, key: "archive" },
    { name: "Donation", icon: <FaHandHoldingDollar />, key: "donation" },
    { name: "Settings", icon: <FaGear />, key: "settings" },
    { name: "Add User", icon: <FaUserPlus />, key: "addUser" },
  ];

  return (
    <aside className={`bg-[#2c3e50] text-white h-screen p-5 transition-all duration-300 ${isOpen ? "w-64" : "w-0 overflow-hidden"}`}>
      <h2 className="text-xl font-bold mb-6">MuseoSmart</h2>
      <ul className="space-y-3">
        {menuItems.map(item => (
          <li
            key={item.key}
            onClick={() => onNavigate(item.key)}
            className="flex items-center gap-3 p-2 cursor-pointer hover:bg-[#34495e] rounded"
          >
            {item.icon}
            <span>{item.name}</span>
          </li>
        ))}
        <li
          onClick={onLogout}
          className="flex items-center gap-3 p-2 cursor-pointer hover:bg-red-500 rounded mt-4"
        >
          <FaRightFromBracket />
          <span>Logout</span>
        </li>
      </ul>
    </aside>
  );
};

export default Sidebar;
