// src/pages/BuyerLogin.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const BuyerLogin = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-100 p-6">
      <h1 className="text-3xl font-bold text-blue-900 mb-4">
        Welcome Buyer 🛒
      </h1>
      <p className="mb-6 text-gray-700">
        Discover fresh, bulk produce directly from farmers on <strong>export-maal</strong>
      </p>
      <button
        onClick={() => navigate("/")} // Later link to buyer dashboard
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl shadow-lg"
      >
        Back to Home
      </button>
    </div>
  );
};

export default BuyerLogin;
