// src/pages/LandingPage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import WorldMap from "../components/WorldMap.svg";


const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <div
  className="absolute inset-0 z-[-0]"
  style={{
    backgroundImage: `url(${WorldMap})`,
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    backgroundPosition: "center",
    opacity: 0.15,
  }}
></div>
      <div className="min-h-screen flex flex-col items-center justify-center bg-green-100 p-6">
        <h1 className="text-4xl font-bold mb-8 text-green-800">
          Welcome to Export Maal 🌿
        </h1>
        <p className="mb-10 text-lg text-gray-700">
          Choose who are you
        </p>
        <div className="flex gap-8">
          <button 
            onClick={() => navigate("/login/farmer")}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl text-lg shadow-lg z-[+1]"
          >
            Login as Farmer
          </button>
          <button
            onClick={() => navigate("/login/buyer")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl text-lg shadow-lg z-[+1]"
          >
            Login as Buyer
          </button>
        </div>
      </div>
    <Footer /></>
  );
};

export default LandingPage;
