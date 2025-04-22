import React from "react";

const Footer = () => {
    return (
        <footer className="bg-green-900 text-white py-10 mt-16">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 px-6">
            <div>
              <h2 className="font-bold text-lg mb-4">About</h2>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:underline">Our Mission</a></li>
                <li><a href="#" className="hover:underline">Team</a></li>
                <li><a href="#" className="hover:underline">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h2 className="font-bold text-lg mb-4">Privacy</h2>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:underline">Privacy Policy</a></li>
                <li><a href="#" className="hover:underline">Terms of Use</a></li>
                <li><a href="#" className="hover:underline">Data Protection</a></li>
              </ul>
            </div>
            <div>
              <h2 className="font-bold text-lg mb-4">Product</h2>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:underline">How It Works</a></li>
                <li><a href="#" className="hover:underline">Farmer Dashboard</a></li>
                <li><a href="#" className="hover:underline">Buyer Dashboard</a></li>
              </ul>
            </div>
            <div>
              <h2 className="font-bold text-lg mb-4">Careers</h2>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:underline">Join Us</a></li>
                <li><a href="#" className="hover:underline">Internships</a></li>
                <li><a href="#" className="hover:underline">Partner with Us</a></li>
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