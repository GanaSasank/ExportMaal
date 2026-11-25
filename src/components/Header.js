import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

const Header = ({
  user,
  farmerProfile,
  buyerProfile,
  profileType,
  profileLoading,
  profileError,
  authLoading
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState("");
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!menuOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    setError("");
    try {
      await signOut(auth);
      setMenuOpen(false);
      navigate("/", { replace: true });
    } catch (logoutError) {
      setError("Unable to log out. Please try again.");
    }
  };

  const closeMenu = () => {
    setMenuOpen(false);
    setError("");
  };
  const accountProfile = profileType === "buyer" ? buyerProfile : farmerProfile;
  const homePath = profileType === "buyer" ? "/dashboard/buyer" : "/dashboard/farmer";

  return (
    <header className="relative z-40 bg-green-900 text-white shadow-md">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4"
        aria-label="Main navigation"
      >
        <Link
          to={user ? homePath : "/"}
          className="text-2xl font-bold tracking-tight hover:text-green-100"
        >
          Export-Maal
        </Link>

        <div className="relative" ref={menuRef}>
          <button
            id="account-menu-button"
            type="button"
            aria-label="Account options"
            aria-expanded={menuOpen}
            aria-controls="account-menu"
            disabled={authLoading}
            onClick={() => {
              setError("");
              setMenuOpen((open) => !open);
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-green-200 text-white transition hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-white disabled:cursor-wait disabled:opacity-60"
          >
            <svg
              aria-hidden="true"
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5 20a7 7 0 0 1 14 0" />
            </svg>
          </button>

          {menuOpen && (
            <div
              id="account-menu"
              aria-labelledby="account-menu-button"
              className="absolute right-0 mt-2 w-64 rounded-xl bg-white p-3 text-gray-800 shadow-xl ring-1 ring-black/10"
            >
              {user ? (
                <>
                  <p className="truncate px-3 py-2 text-sm text-gray-600">
                    {accountProfile?.name
                      ? `Signed in as ${accountProfile.name}`
                      : user.email}
                  </p>
                  {accountProfile ? (
                    <Link
                      to="/profile"
                      onClick={closeMenu}
                      className="block rounded-lg px-3 py-2 font-medium hover:bg-green-50 hover:text-green-900"
                    >
                      My Profile
                    </Link>
                  ) : (
                    <p className="px-3 py-2 text-sm text-gray-600" role={profileError ? "alert" : undefined}>
                      {profileLoading
                        ? `Loading your ${profileType || "account"} profile...`
                        : profileError || `No ${profileType || "account"} profile is linked to this account.`}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-1 w-full rounded-lg px-3 py-2 text-left font-medium text-red-700 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <p className="px-3 py-2 text-sm text-gray-600">
                    Log in to your account
                  </p>
                  <Link
                    to="/login/farmer"
                    onClick={closeMenu}
                    className="block rounded-lg px-3 py-2 font-medium hover:bg-green-50 hover:text-green-900"
                  >
                    Login as Farmer
                  </Link>
                  <Link
                    to="/login/buyer"
                    onClick={closeMenu}
                    className="block rounded-lg px-3 py-2 font-medium hover:bg-green-50 hover:text-green-900"
                  >
                    Login as Buyer
                  </Link>
                </>
              )}
              {error && (
                <p className="px-3 py-2 text-sm text-red-700" role="alert">
                  {error}
                </p>
              )}
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
