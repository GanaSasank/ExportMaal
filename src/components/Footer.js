import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
    return (
        <footer className="bg-green-900 text-white py-10">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 px-6">
            <div>
              <h2 className="font-bold text-lg mb-4">About</h2>
              <ul className="space-y-2 text-sm text-gray-200">
                <li><Link to="/about" className="hover:underline">Our Mission</Link></li>
                <li><Link to="/team" className="hover:underline">Team</Link></li>
                <li><Link to="/contact" className="hover:underline">Contact Us</Link></li>
               </ul>
            </div>
            <div>
              <h2 className="font-bold text-lg mb-4">Privacy</h2>
              <ul className="space-y-2 text-sm">
                <li><Link to="/privacy" className="hover:underline">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:underline">Terms of Use</Link></li>
                <li><Link to="/data-protection" className="hover:underline">Data Protection</Link></li>
              </ul>
            </div>
            <div>
              <h2 className="font-bold text-lg mb-4">Product</h2>
              <ul className="space-y-2 text-sm">
                <li><Link to="/how-it-works" className="hover:underline">How It Works</Link></li>
                <li><Link to="/dashboard/farmer" className="hover:underline">Farmer Dashboard</Link></li>
                <li><Link to="/login/buyer" className="hover:underline">Buyer Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h2 className="font-bold text-lg mb-4">Careers</h2>
              <ul className="space-y-2 text-sm">
                <li><Link to="/careers" className="hover:underline">Join Us</Link></li>
                <li><Link to="/internships" className="hover:underline">Internships</Link></li>
                <li><Link to="/partnerships" className="hover:underline">Partner with Us</Link></li>
              </ul>
            </div>
          </div>
          <p className="text-center text-xs mt-10 text-gray-300">
            &copy; {new Date().getFullYear()} export-maal. All rights reserved.
          </p>
        </footer>
      );
};
export default Footer;