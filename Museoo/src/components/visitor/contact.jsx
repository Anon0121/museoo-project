import React from "react";
import contactBg from "../../assets/image2.jpg";

const Contact = () => {
  return (
    <section
      id="contact"
      className="w-[90%] mx-auto my-24 p-10 bg-cover bg-center rounded-lg shadow-lg"
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${contactBg})`,
      }}
    >
      <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-10">
        CONTACT US
      </h1>

      <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
        {/* Google Map */}
        <div className="w-full md:w-1/2 rounded-lg overflow-hidden">
          <div className="relative w-full aspect-[16/9]">
            <iframe
              title="Google Maps - CDO Museum"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3946.2528687580652!2d124.6422405!3d8.474774499999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x32fff2d5e2fc9e2d%3A0x11e18344b68beb41!2sCity%20Museum%20of%20Cagayan%20de%20Oro%20and%20Heritage%20Studies%20Center!5e0!3m2!1sen!2sph!4v1749752734496!5m2!1sen!2sph"
              className="absolute top-0 left-0 w-full h-full"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              style={{ border: 0 }}
            ></iframe>
          </div>
        </div>

        {/* Contact Links */}
        <div className="w-full md:w-1/2 flex flex-col gap-6">
          <a
            href="https://www.facebook.com/CDOCityMuseumHeritageStudiesCenter"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-md w-full text-lg md:text-xl transition"
          >
            <i className="fab fa-facebook text-2xl md:text-3xl mr-4"></i>
            FACEBOOK
          </a>

          <a
            href="mailto:cdopedia@gmail.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-6 py-4 rounded-md w-full text-lg md:text-xl transition"
          >
            <i className="fa-solid fa-envelope text-2xl md:text-3xl mr-4"></i>
            GMAIL
          </a>
        </div>
      </div>
    </section>
  );
};

export default Contact;
