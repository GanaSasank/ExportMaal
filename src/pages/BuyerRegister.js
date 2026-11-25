import React, { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { auth } from "../firebase";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const BuyerRegister = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    genuineBuyerConfirmed: false
  });
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [formVisible, setFormVisible] = useState(true);
  const [existingAccount, setExistingAccount] = useState(false);
  const navigate = useNavigate();

  const handleChange = (event) => {
    setExistingAccount(false);
    setFormData((previous) => ({
      ...previous,
      [event.target.name]: event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value
    }));
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setMessage("");
    setIsError(false);
    setExistingAccount(false);

    if (formData.password !== formData.confirmPassword) {
      setIsError(true);
      setMessage("Passwords do not match.");
      return;
    }
    if (!formData.genuineBuyerConfirmed) {
      setIsError(true);
      setMessage("Confirm the genuine buyer declaration before registering.");
      return;
    }

    setLoading(true);
    let firebaseUser = null;
    let cleanupFailed = false;

    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      firebaseUser = credential.user;
      await sendEmailVerification(firebaseUser);

      const idToken = await firebaseUser.getIdToken(true);
      await axios.post(
        `${API_URL}/api/buyer`,
        {
          uid: firebaseUser.uid,
          name: formData.fullName.trim(),
          phone: formData.phone.trim(),
          email: firebaseUser.email,
          genuineBuyerConfirmed: true
        },
        { headers: { Authorization: `Bearer ${idToken}` } }
      );

      setMessage("Registered successfully. Please verify your email using the link we sent.");
      setFormVisible(false);
      setFormData({
        fullName: "",
        phone: "",
        email: "",
        password: "",
        confirmPassword: "",
        genuineBuyerConfirmed: false
      });
      setCountdown(10);
    } catch (error) {
      console.error("Buyer registration error:", error.response?.data || error);
      if (firebaseUser) {
        try {
          await firebaseUser.delete();
        } catch (cleanupError) {
          cleanupFailed = true;
          console.error("Could not remove the incomplete Firebase account:", cleanupError);
        }
      }

      setIsError(true);
      if (error.code === "auth/email-already-in-use") {
        setExistingAccount(true);
        setMessage(
          "This email is already linked to a Firebase account. If this is your previous Farmer email, it remains reserved until you verify the new-email link from your Farmer profile. Farmer and Buyer registrations are separate."
        );
      } else if (error.response?.status === 404) {
        setMessage(
          "The Buyer registration API returned 404. Restart the backend so it loads /api/buyer, then try again."
        );
      } else if (error.code === "ERR_NETWORK") {
        setMessage("Cannot reach the server. Check that the backend is running on port 5000.");
      } else {
        setMessage(error.response?.data?.message || error.message || "Unable to register. Please try again.");
      }
      if (cleanupFailed) {
        setMessage((previous) => (
          `${previous} The incomplete Firebase account could not be removed; contact support before retrying with this email.`
        ));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (countdown === null) return undefined;
    if (countdown === 0) {
      navigate("/login/buyer", { replace: true });
      return undefined;
    }
    const timer = setTimeout(() => setCountdown((previous) => previous - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, navigate]);

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-blue-50 p-6">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-blue-900">
          Register as a Buyer
        </h1>
        {formVisible && (
          <form onSubmit={handleRegister} className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Full Name
              <input
                type="text"
                name="fullName"
                required
                autoComplete="name"
                value={formData.fullName}
                onChange={handleChange}
                className={`${inputClass} mt-1`}
                placeholder="Enter your name"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Phone Number
              <input
                type="tel"
                name="phone"
                required
                autoComplete="tel"
                value={formData.phone}
                onChange={handleChange}
                className={`${inputClass} mt-1`}
                placeholder="Enter your phone number"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Email
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                className={`${inputClass} mt-1`}
                placeholder="Enter your email"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Password
              <input
                type="password"
                name="password"
                required
                minLength="6"
                autoComplete="new-password"
                value={formData.password}
                onChange={handleChange}
                className={`${inputClass} mt-1`}
                placeholder="Enter your password"
              />
            </label>
            <label className="block text-sm font-medium text-gray-700">
              Confirm Password
              <input
                type="password"
                name="confirmPassword"
                required
                minLength="6"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`${inputClass} mt-1`}
                placeholder="Confirm your password"
              />
            </label>
            <label className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-gray-800">
              <input
                type="checkbox"
                name="genuineBuyerConfirmed"
                required
                checked={formData.genuineBuyerConfirmed}
                onChange={handleChange}
                className="mt-1 h-4 w-4 accent-blue-700"
              />
              <span>
                I confirm that I am a genuine buyer and that the information I
                provide is accurate. I understand that false or misleading
                information may make me legally liable under applicable law.
              </span>
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-700 py-2 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </form>
        )}

        {message && (
          <div className="mt-4 text-center">
            <p className={`text-sm ${isError ? "text-red-700" : "text-green-700"}`} role={isError ? "alert" : "status"}>
              {message}
            </p>
            {existingAccount && (
              <button
                type="button"
                onClick={() => navigate("/login/buyer")}
                className="mt-2 font-semibold text-blue-800 hover:underline"
              >
                Go to Buyer Login
              </button>
            )}
            {countdown !== null && (
              <p className="mt-1 text-sm text-gray-600">
                Redirecting to Buyer access in {countdown} second{countdown !== 1 ? "s" : ""}...
              </p>
            )}
          </div>
        )}
        <p className="mt-4 text-center text-sm text-gray-600">
          Already registered?{" "}
          <button
            type="button"
            onClick={() => navigate("/login/buyer")}
            className="font-semibold text-blue-800 hover:underline"
          >
            Buyer Login
          </button>
        </p>
      </section>
    </main>
  );
};

export default BuyerRegister;
