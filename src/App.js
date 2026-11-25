// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import FarmerLogin from "./pages/FarmerLogin";
import BuyerLogin from "./pages/BuyerLogin";
import AboutPage from "./pages/AboutPage";
import TeamPage from "./pages/TeamPage";
import ContactPage from "./pages/ContactPage";
import FarmerRegister from "./pages/FarmerRegister";
import FarmerDashboard from "./pages/FarmerDashboard";
import FooterInfoPage from "./pages/FooterInfoPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login/farmer" element={<FarmerLogin />} />
        <Route path="/login/buyer" element={<BuyerLogin />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/register/farmer" element={<FarmerRegister />} />
        <Route path="/dashboard/farmer" element={<FarmerDashboard />} />
        <Route path="/how-it-works" element={<FooterInfoPage page="how-it-works" />} />
        <Route path="/privacy" element={<FooterInfoPage page="privacy" />} />
        <Route path="/terms" element={<FooterInfoPage page="terms" />} />
        <Route path="/data-protection" element={<FooterInfoPage page="data-protection" />} />
        <Route path="/careers" element={<FooterInfoPage page="careers" />} />
        <Route path="/internships" element={<FooterInfoPage page="internships" />} />
        <Route path="/partnerships" element={<FooterInfoPage page="partnerships" />} />
      </Routes>
    </Router>
  );
}

export default App;
