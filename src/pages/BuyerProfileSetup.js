import React, { useState } from "react";
import axios from "axios";
import { auth } from "../firebase";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const BuyerProfileSetup = ({ onProfileCreated }) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [genuineBuyerConfirmed, setGenuineBuyerConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const user = auth.currentUser;
    if (!user?.emailVerified) {
      setError("Sign in with a verified email before completing your Buyer profile.");
      return;
    }
    if (!genuineBuyerConfirmed) {
      setError("Confirm the genuine Buyer declaration before continuing.");
      return;
    }

    setLoading(true);
    try {
      const token = await user.getIdToken(true);
      const response = await axios.post(
        `${API_URL}/api/buyer`,
        {
          uid: user.uid,
          name: name.trim(),
          phone: phone.trim(),
          email: user.email,
          genuineBuyerConfirmed: true
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onProfileCreated(response.data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          (requestError.response?.status === 404
            ? "The Buyer profile API was not found. Restart the backend and try again."
            : "") ||
          requestError.message ||
          "Unable to complete your Buyer profile. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-blue-50 p-6 sm:p-10">
      <section className="mx-auto max-w-xl rounded-2xl bg-white p-8 shadow-md">
        <h1 className="text-2xl font-bold text-blue-900">Complete your Buyer profile</h1>
        <p className="mt-2 text-sm text-gray-600">
          Your verified Firebase login is active, but no Buyer profile was found
          for it. Add your profile details to continue. Your email is managed by
          Firebase and cannot be changed here.
        </p>
        <p className="mt-3 text-sm text-gray-700">
          Signed in as <strong>{auth.currentUser?.email}</strong>
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Full Name
            <input
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Phone Number
            <input
              type="tel"
              required
              autoComplete="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <label className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-gray-800">
            <input
              type="checkbox"
              required
              checked={genuineBuyerConfirmed}
              onChange={(event) => setGenuineBuyerConfirmed(event.target.checked)}
              className="mt-1 h-4 w-4 accent-blue-700"
            />
            <span>
              I confirm that I am a genuine buyer and that the information I
              provide is accurate. I understand that false or misleading
              information may make me legally liable under applicable law.
            </span>
          </label>
          {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-700 py-2 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
          >
            {loading ? "Saving profile..." : "Complete Buyer Profile"}
          </button>
        </form>
      </section>
    </main>
  );
};

export default BuyerProfileSetup;
