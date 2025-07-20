import React from "react";

const Footer = () => {
  return (
    <footer className="w-full bg-gray-900 text-white mt-20 py-6 flex items-center justify-center relative">
      <a
        href="/login"
        className="mr-auto ml-6 opacity-50 w-8 h-8 hover:opacity-80 transition-opacity flex items-center"
        title="Staff Login"
      >
        {/* Person SVG icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-full h-full grayscale"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.5a7.5 7.5 0 1115 0v.75a.75.75 0 01-.75.75h-13.5a.75.75 0 01-.75-.75v-.75z"
          />
        </svg>
      </a>
      <p className="text-center flex-1">Cagayan De Oro City Water Reservoir Museum</p>
    </footer>
  );
};

export default Footer;
