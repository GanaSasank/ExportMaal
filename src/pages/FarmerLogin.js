// src/pages/FarmerLogin.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const FarmerLogin = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-yellow-100 p-6">
      <h1 className="text-3xl font-bold text-green-800 mb-4">
        Welcome Farmer 👨‍🌾
      </h1>
      <p className="mb-6 text-gray-700">
        Please log in to showcase your harvest on <strong>export-maal</strong>
      </p>
      <button
        onClick={() => navigate("/")} // You can link to dashboard later
        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl shadow-lg"
      >
        Back to Home
      </button>
    </div>
  );
};

export default FarmerLogin;
