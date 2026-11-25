import React, { useState } from "react";
import axios from "axios";
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../firebase";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const BuyerLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");
    setResetMessage("");
    setLoading(true);
    let signedInUser = null;

    try {
      const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
      signedInUser = credential.user;

      if (!signedInUser.emailVerified) {
        await signOut(auth);
        setError("Verify your email address before signing in as a Buyer.");
        return;
      }

      const token = await signedInUser.getIdToken(true);
      await axios.get(`${API_URL}/api/buyer/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate("/dashboard/buyer", { replace: true });
    } catch (loginError) {
      if (loginError.response?.status === 404 && signedInUser?.emailVerified) {
        navigate("/dashboard/buyer", { replace: true });
        return;
      }
      if (signedInUser) {
        try {
          await signOut(auth);
        } catch (logoutError) {
          console.error("Could not sign out an account without Buyer access:", logoutError);
        }
      }
      setError(
        loginError.response?.status === 404
          ? "This account does not have a Buyer profile. Register as a Buyer or sign in through the matching account type."
          : "Unable to sign in as a Buyer. Check your email and password, then try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setError("");
    setResetMessage("");
    if (!email.trim()) {
      setError("Enter your email address above to receive a password reset link.");
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetMessage(`Password reset email sent to ${email.trim()}. Check your inbox and spam folder.`);
    } catch (resetError) {
      setError(
        resetError.code === "auth/user-not-found"
          ? "No Firebase account was found for this email address."
          : resetError.code === "auth/invalid-email"
            ? "Enter a valid email address."
            : resetError.message || "Unable to send a password reset email. Please try again."
      );
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-blue-50 p-6">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-blue-900">
          Buyer Login
        </h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
            />
          </label>
          <label className="block text-sm font-medium text-gray-700">
            Password
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
            />
          </label>
          {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-700 py-2 font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Login"}
          </button>
          <div className="text-center">
            <button
              type="button"
              onClick={handlePasswordReset}
              disabled={resetLoading}
              className="text-sm font-semibold text-blue-800 hover:underline disabled:opacity-60"
            >
              {resetLoading ? "Sending reset link..." : "Forgot password?"}
            </button>
          </div>
        </form>
        {resetMessage && (
          <p className="mt-3 text-center text-sm text-green-700" role="status">
            {resetMessage}
          </p>
        )}
        <p className="mt-5 text-center text-sm text-gray-600">
          New Buyer?{" "}
          <Link to="/register/buyer" className="font-semibold text-blue-800 hover:underline">
            Create a Buyer account
          </Link>
        </p>
      </section>
    </main>
  );
};

export default BuyerLogin;
