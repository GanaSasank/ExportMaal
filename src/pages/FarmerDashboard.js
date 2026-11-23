import React from "react";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const FarmerDashboard = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login/farmer");
  };

  return (
    <div className="min-h-screen bg-green-100 flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold text-green-800 mb-4">Welcome, Farmer!</h1>

      {user?.emailVerified ? (
        <p className="text-lg text-green-700 mb-6">
          ✅ You are logged in with <strong>{user.email}</strong>
        </p>
      ) : (
        <p className="text-lg text-red-600 mb-6">
          ⚠️ Your email is not verified. Please check your inbox to verify your email.
        </p>
      )}

      <button
        onClick={handleLogout}
        className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg"
      >
        Logout
      </button>
    </div>
  );
};

export default FarmerDashboard;
