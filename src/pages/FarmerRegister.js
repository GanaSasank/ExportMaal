// src/pages/FarmerRegister.js
import React, { useState } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth } from "../firebase"; // Updated import - only import 'auth'
import Footer from "../components/Footer";

const FarmerRegister = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      await sendEmailVerification(userCredential.user);

      setMessage("✅ Verification email sent! Please check your inbox.");
      
      // Optionally clear form fields
      setFormData({
        fullName: "",
        phone: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

    } catch (error) {
      console.error("Registration error:", error);
      setMessage(error.message);
    }
  };

  return (
    <>
      <div className="min-h-screen flex flex-col justify-center items-center bg-green-50 p-6">
        <h2 className="text-3xl font-bold mb-4 text-green-800">Farmer Registration</h2>
        <form onSubmit={handleRegister} className="bg-white shadow-md p-8 rounded-lg w-full max-w-md space-y-4">
          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleChange}
            required
            className="w-full border rounded px-4 py-2"
          />
          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            required
            className="w-full border rounded px-4 py-2"
          />
          <input
            type="email"
            name="email"
            placeholder="Email (e.g. example@gmail.com)"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full border rounded px-4 py-2"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full border rounded px-4 py-2"
          />
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className="w-full border rounded px-4 py-2"
          />

          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white w-full py-2 rounded-lg"
          >
            Register
          </button>

          {message && <p className="text-center text-sm text-red-600">{message}</p>}
        </form>
      </div>
      <Footer />
    </>
  );
};

export default FarmerRegister;
