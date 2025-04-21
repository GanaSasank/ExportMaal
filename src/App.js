// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import FarmerLogin from "./pages/FarmerLogin";
import BuyerLogin from "./pages/BuyerLogin";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login/farmer" element={<FarmerLogin />} />
        <Route path="/login/buyer" element={<BuyerLogin />} />
      </Routes>
    </Router>
  );
}

export default App;
