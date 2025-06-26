import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars, faXmark, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import citymus from "../../assets/citymus.jpg";
import logo from "../../assets/logo.png";


const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 200);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      id="home"
      className="relative w-full min-h-screen bg-cover bg-center text-white"
      style={{
        backgroundImage: `linear-gradient(rgba(4,9,30,0.7), rgba(4,9,30,0.7)), url(${citymus})`,
      }}
    >
      {/* Navigation */}
      <nav className="flex justify-between items-center px-4 md:px-16 py-4 relative z-20">
        {/* Logo with responsive top margin */}
        <Link to="/login" className="mt-0 md:mt-4">
          <img src={logo} alt="Logo" className="w-20" />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-8 text-xl font-semibold">
          <a href="#home" className="nav-link-animated hover:text-[#f7f786de]">HOME</a>
          <a href="#about" className="nav-link-animated hover:text-[#f7f786de]">ABOUT</a>
          <a href="#exhibit" className="nav-link-animated hover:text-[#f7f786de]">EXHIBITS</a>
          <a href="#event" className="nav-link-animated hover:text-[#f7f786de]">EVENTS</a>
          <a href="#contact" className="nav-link-animated hover:text-[#f7f786de]">CONTACT US</a>
        </div>

        {/* Mobile Menu Icon */}
        <div className="md:hidden text-white text-2xl cursor-pointer z-30">
          <FontAwesomeIcon icon={faBars} onClick={() => setIsMenuOpen(true)} />
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-60 bg-[#AB8841] text-white p-6 z-50 transform transition-transform duration-300 ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        } md:hidden`}
      >
        <div className="flex justify-end mb-6">
          <FontAwesomeIcon
            icon={faXmark}
            className="text-2xl cursor-pointer"
            onClick={() => setIsMenuOpen(false)}
          />
        </div>
        <ul className="space-y-4 text-lg font-semibold">
          <li><a href="#home" onClick={() => setIsMenuOpen(false)}>HOME</a></li>
          <li><a href="#about" onClick={() => setIsMenuOpen(false)}>ABOUT</a></li>
          <li><a href="#exhibit" onClick={() => setIsMenuOpen(false)}>EXHIBITS</a></li>
          <li><a href="#event" onClick={() => setIsMenuOpen(false)}>EVENTS</a></li>
          <li><a href="#contact" onClick={() => setIsMenuOpen(false)}>CONTACT US</a></li>
        </ul>
      </div>

      {/* Hero Content */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center px-6 text-white max-w-3xl">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Cagayan De Oro City Museum
        </h1>
        <p className="text-sm md:text-base mb-6">
          The construction of the water tower began in 1919 and was completed in 1922.
          <br className="hidden md:inline" />
          On December 1, 2008, the city government turned the Water Tower into the City Museum of
          Cagayan de Oro and Heritage Studies Center.
        </p>
        <Link
          to="/schedule"
          className="inline-block border border-white text-white px-8 py-4 text-base md:text-lg hover:bg-[#f7f786de] transition duration-300"
        >
          Visit Us to Know More
        </Link>
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <a
          href="#home"
          className="fixed bottom-6 right-6 bg-[#94b60e] text-white p-3 rounded-full shadow-lg text-xl hover:bg-black transition z-50"
        >
          <FontAwesomeIcon icon={faArrowUp} />
        </a>
      )}
    </section>
  );
};

export default Header;
