// src/pages/FarmerLogin.jsx
// import React from "react";
// import { useNavigate } from "react-router-dom";

// const FarmerLogin = () => {
//   const navigate = useNavigate();

//   return (
//     <div className="min-h-screen flex flex-col items-center justify-center bg-yellow-100 p-6">
//       <h1 className="text-3xl font-bold text-green-800 mb-4">
//         Welcome Farmer 👨‍🌾
//       </h1>
//       <p className="mb-6 text-gray-700">
//         Please log in to showcase your harvest on <strong>export-maal</strong>
//       </p>
//       <button
//         onClick={() => navigate("/")} // You can link to dashboard later
//         className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl shadow-lg"
//       >
//         Back to Home
//       </button>
//     </div>
//   );
// };

// export default FarmerLogin;

// src/pages/FarmerLogin.jsx
// src/pages/FarmerLogin.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";

const FarmerLogin = () => {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Placeholder: Add real login logic here
    alert("Logged in as Farmer");
  };

  return (
    <div className="flex flex-col min-h-screen bg-green-50">
      <div className="flex-grow flex items-center justify-center">
        <div className="bg-white shadow-md rounded-2xl p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6 text-center text-green-800">
          Welcome Farmer 👨‍🌾
          </h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Password</label>
              <input
                type="password"
                required
                className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter your password"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
            >
              Login
            </button>
          </form>

          <div className="flex justify-between items-center mt-4 text-sm text-green-700">
            <button
              onClick={() => alert("Forgot password feature coming soon!")}
              className="hover:underline"
            >
              Forgot Password?
            </button>
            <button
              onClick={() => navigate("/register/farmer")}
              className="hover:underline"
            >
              New Registration
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default FarmerLogin;

