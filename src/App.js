// src/App.jsx
import React, { useEffect, useRef, useState } from "react";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import axios from "axios";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import LandingPage from "./pages/LandingPage";
import FarmerLogin from "./pages/FarmerLogin";
import BuyerLogin from "./pages/BuyerLogin";
import AboutPage from "./pages/AboutPage";
import TeamPage from "./pages/TeamPage";
import ContactPage from "./pages/ContactPage";
import FarmerRegister from "./pages/FarmerRegister";
import FarmerDashboard from "./pages/FarmerDashboard";
import ProfilePage from "./pages/ProfilePage";
import FooterInfoPage from "./pages/FooterInfoPage";
import Header from "./components/Header";
import Footer from "./components/Footer";
import PageLoading from "./components/PageLoading";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const ProtectedRoute = ({
  authLoading,
  authError,
  profileLoading,
  profileError,
  farmerProfile,
  profileOwnerUid,
  user,
  loginPath,
  children
}) => {
  const location = useLocation();

  if (authLoading) return <PageLoading />;
  if (authError) {
    return (
      <p className="p-8 text-center text-red-700" role="alert">
        Unable to verify your sign-in status. Please refresh and try again.
      </p>
    );
  }
  if (!auth.currentUser?.emailVerified) {
    return (
      <Navigate
        to={loginPath}
        replace
        state={{ from: location.pathname }}
      />
    );
  }
  if (auth.currentUser.uid !== user?.uid) return <PageLoading />;
  if (profileLoading || profileOwnerUid !== user.uid) return <PageLoading />;
  if (profileError) {
    return (
      <p className="p-8 text-center text-red-700" role="alert">
        {profileError}
      </p>
    );
  }
  if (!farmerProfile) {
    return (
      <main className="min-h-screen bg-green-50 p-8">
        <p className="mx-auto max-w-2xl rounded-lg bg-white p-5 text-red-700" role="alert">
          We could not find the farmer profile saved for this verified email.
          Your registration details have not been requested again. Please sign
          in with the email used to register or contact support if this continues.
        </p>
      </main>
    );
  }

  return children;
};

const RouteTransitionLoader = () => {
  const location = useLocation();
  const route = `${location.pathname}${location.search}${location.hash}`;
  const previousRoute = useRef(route);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (previousRoute.current === route) return undefined;

    previousRoute.current = route;
    setLoading(true);
    const timer = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(timer);
  }, [route]);

  return loading ? <PageLoading overlay /> : null;
};

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [farmerProfile, setFarmerProfile] = useState(null);
  const [profileOwnerUid, setProfileOwnerUid] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setAuthLoading(false);
        setAuthError("");
      },
      (error) => {
        setAuthError(error.message);
        setAuthLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user?.emailVerified) {
      setFarmerProfile(null);
      setProfileOwnerUid(null);
      setProfileLoading(false);
      setProfileError("");
      return undefined;
    }

    let active = true;
    setProfileLoading(true);
    setProfileError("");

    const loadFarmerProfile = async () => {
      try {
        const token = await user.getIdToken(true);
        const response = await axios.get(
          `${API_URL}/api/farmer/${encodeURIComponent(user.uid)}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        if (active) setFarmerProfile(response.data);
      } catch (error) {
        if (!active) return;
        if (error.response?.status === 404) {
          setFarmerProfile(null);
        } else {
          setFarmerProfile(null);
          setProfileError(
            error.response?.data?.message ||
              "Unable to load your farmer profile. Check the API connection and try again."
          );
        }
      } finally {
        if (active) {
          setProfileOwnerUid(user.uid);
          setProfileLoading(false);
        }
      }
    };

    loadFarmerProfile();
    return () => {
      active = false;
    };
  }, [user]);

  return (
    <Router>
      <Header
        user={authLoading ? null : user}
        farmerProfile={profileOwnerUid === user?.uid ? farmerProfile : null}
        profileLoading={profileLoading}
        profileError={profileError}
        authLoading={authLoading}
      />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login/farmer" element={<FarmerLogin />} />
        <Route path="/login/buyer" element={<BuyerLogin />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/register/farmer" element={<FarmerRegister />} />
        <Route
          path="/dashboard/farmer"
          element={
            <ProtectedRoute
              authLoading={authLoading}
              authError={authError}
              profileLoading={profileLoading}
              profileError={profileError}
              farmerProfile={farmerProfile}
              profileOwnerUid={profileOwnerUid}
              user={user}
              loginPath="/login/farmer"
            >
              <FarmerDashboard farmerProfile={farmerProfile} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/buyer"
          element={<Navigate to="/login/buyer" replace />}
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute
              authLoading={authLoading}
              authError={authError}
              profileLoading={profileLoading}
              profileError={profileError}
              farmerProfile={farmerProfile}
              profileOwnerUid={profileOwnerUid}
              user={user}
              loginPath="/login/farmer"
            >
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="/how-it-works" element={<FooterInfoPage page="how-it-works" />} />
        <Route path="/privacy" element={<FooterInfoPage page="privacy" />} />
        <Route path="/terms" element={<FooterInfoPage page="terms" />} />
        <Route path="/data-protection" element={<FooterInfoPage page="data-protection" />} />
        <Route path="/careers" element={<FooterInfoPage page="careers" />} />
        <Route path="/internships" element={<FooterInfoPage page="internships" />} />
        <Route path="/partnerships" element={<FooterInfoPage page="partnerships" />} />
      </Routes>
      <Footer />
      <RouteTransitionLoader />
    </Router>
  );
}

export default App;
