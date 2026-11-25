import React from "react";
import { Link } from "react-router-dom";

const BuyerLogin = () => (
  <main className="flex min-h-screen flex-col items-center justify-center bg-blue-50 p-6 text-center">
    <h1 className="mb-4 text-3xl font-bold text-blue-900">
      Buyer accounts are coming soon
    </h1>
    <p className="mb-6 max-w-xl text-gray-700">
      Buyer registration and buyer-only accounts are not available yet. Farmer
      accounts cannot access the buyer dashboard.
    </p>
    <Link
      to="/"
      className="rounded-lg bg-blue-700 px-5 py-2 text-white hover:bg-blue-800"
    >
      Back to Home
    </Link>
  </main>
);

export default BuyerLogin;
