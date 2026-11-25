import React, { useState, useEffect } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { auth } from "../firebase";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const FarmerRegister = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [formVisible, setFormVisible] = useState(true);
  const [existingAccount, setExistingAccount] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setExistingAccount(false);
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);
    setExistingAccount(false);

    if (formData.password !== formData.confirmPassword) {
      setIsError(true);
      setMessage("❌ Passwords do not match.");
      return;
    }

    setLoading(true);
    let firebaseUser = null;

    try {
      // 1. Create Firebase account (for login)
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      firebaseUser = userCredential.user;
      const idToken = await firebaseUser.getIdToken(true);

      // 2. Send verification email
      await sendEmailVerification(firebaseUser);

      // 3. Save farmer profile to MongoDB
      await axios.post(`${API_URL}/api/farmer`, {
        uid: firebaseUser.uid,
        name: formData.fullName,
        phone: formData.phone,
        email: formData.email,
      }, {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      setMessage("✅ Registered! Verification email sent. Please check your inbox.");
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
      console.error("Registration error:", error.response?.data || error);
      const accountAlreadyExists =
        error.code === "auth/email-already-in-use" ||
        error.response?.status === 409;

      // If MongoDB save failed, remove the Firebase account so you can retry
      if (firebaseUser) {
        try {
          await firebaseUser.delete();
        } catch (cleanupError) {
          console.error("Could not remove the incomplete Firebase account:", cleanupError);
        }
      }

      setIsError(true);
      if (accountAlreadyExists) {
        setExistingAccount(true);
        setMessage(
          "A farmer account with this email already exists. Please sign in instead."
        );
      } else if (error.code === "ERR_NETWORK") {
        setMessage("❌ Cannot reach the server. Is the backend running on port 5000?");
      } else {
        setMessage(`❌ ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setLoading(false);
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

  const inputClass =
    "w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500";

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
                  className={inputClass}
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
                  className={inputClass}
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
                  className={inputClass}
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
                  className={inputClass}
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
                  className={inputClass}
                  placeholder="Confirm your password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-60"
              >
                {loading ? "Registering..." : "Register"}
              </button>
            </form>
          )}

          {message && (
            <div className="mt-4 text-center">
              <p className={`text-sm ${isError ? "text-red-600" : "text-green-700"}`}>
                {message}
              </p>
              {existingAccount && (
                <button
                  type="button"
                  onClick={() => navigate("/login/farmer")}
                  className="mt-2 font-semibold text-green-800 hover:underline"
                >
                  Go to Farmer Login
                </button>
              )}
              {countdown !== null && (
                <p className="text-sm text-gray-600 mt-1">
                  Redirecting to login in {countdown} second{countdown !== 1 ? "s" : ""}...
                </p>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default FarmerRegister;