import React, { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";
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
  const [countdown, setCountdown] = useState(null);
  const [formVisible, setFormVisible] = useState(true);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setMessage("❌ Passwords do not match.");
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
      setFormVisible(false);

      setFormData({
        fullName: "",
        phone: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      setCountdown(10);
    } catch (error) {
      console.error("Registration error:", error);
      setMessage(`❌ ${error.message}`);
    }
  };

  useEffect(() => {
    if (countdown === null) return;

    if (countdown === 0) {
      navigate("/login/farmer");
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, navigate]);

  return (
    <div className="flex flex-col min-h-screen bg-green-50">
      <div className="flex-grow flex items-center justify-center">
        <div className="bg-white shadow-md rounded-2xl p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center text-green-800">
            Register as a Farmer 👨‍🌾
          </h2>

          {formVisible && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter your phone number"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter your password"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Confirm your password"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
              >
                Register
              </button>
            </form>
          )}

          {message && (
            <div className="mt-4 text-center">
              <p className="text-sm text-red-600">{message}</p>
              {countdown !== null && (
                <p className="text-sm text-gray-600 mt-1">
                  Redirecting to login in {countdown} second{countdown !== 1 ? "s" : ""}...
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default FarmerRegister;
