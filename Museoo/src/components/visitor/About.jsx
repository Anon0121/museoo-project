import React from "react";
import oldMuseumImage from "../../assets/oldmuseo.png";

const About = () => {
  return (
    <section id="about" className="w-[90%] max-w-7xl mx-auto pt-24 text-center">
      <h1 className="text-3xl md:text-4xl font-semibold mb-10 text-[#2f2f2f]">
        ABOUT
      </h1>

      <div className="flex flex-col md:flex-row items-stretch gap-10">
        {/* Vision & Mission */}
        <div className="w-full md:w-1/2 bg-[#8dc24489] rounded-lg p-8 text-left flex flex-col justify-between">
          <div>
            <h3 className="text-2xl md:text-3xl font-semibold border-b-2 border-green-700 inline-block mb-3">
              Vision
            </h3>
            <p className="text-base md:text-lg text-green-700 leading-relaxed mb-8">
              Your vision text goes here...
            </p>

            <h3 className="text-2xl md:text-3xl font-semibold border-b-2 border-green-700 inline-block mb-3">
              Mission
            </h3>
            <p className="text-base md:text-lg text-green-700 leading-relaxed">
              Your mission text goes here...
            </p>
          </div>
        </div>

        {/* History Text + Image */}
        <div className="w-full md:w-1/2 flex flex-col justify-between text-left">
          <p className="text-lg md:text-xl font-medium text-gray-700 leading-relaxed mb-6 text-justify">
            City Museum of Cagayan de Oro, once a water reservoir built in 1922, is
            the oldest public structure in the city. Located beside Gaston Park, it was
            transformed into a museum in 2008 to preserve and showcase the city's cultural
            and historical heritage. Today, it features photographs, artifacts, and exhibits
            that reflect the rich history and identity of Cagayan de Oro.
          </p>
          <img
            src={oldMuseumImage}
            alt="City Museum of Cagayan de Oro"
            className="w-full rounded-xl shadow-2xl max-h-[400px] object-contain"
          />
        </div>
      </div>
    </section>
  );
};

export default About;
