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
import BuyerRegister from "./pages/BuyerRegister";
import FarmerDashboard from "./pages/FarmerDashboard";
import BuyerDashboard from "./pages/BuyerDashboard";
import BuyerProfileSetup from "./pages/BuyerProfileSetup";
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
  accountProfile,
  accountType,
  profileType,
  profileOwnerUid,
  user,
  loginPath,
  onBuyerProfileCreated,
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
  if (profileType && profileType !== accountType) {
    return (
      <main className="min-h-screen bg-green-50 p-8">
        <p className="mx-auto max-w-2xl rounded-lg bg-white p-5 text-red-700" role="alert">
          This account is registered as a {profileType}. Sign in with a separate
          {` ${accountType}`} account to continue.
        </p>
      </main>
    );
  }
  if (!accountProfile && accountType === "buyer" && !profileType) {
    return <BuyerProfileSetup onProfileCreated={onBuyerProfileCreated} />;
  }
  if (!accountProfile) {
    const roleLabel = accountType
      ? `${accountType[0].toUpperCase()}${accountType.slice(1)}`
      : "User";
    const missingProfileMessage = accountType === "farmer"
      ? "We could not find the farmer profile saved for this verified email. Your registration details have not been requested again. Please sign in with the email used to register or contact support if this continues."
      : `We could not find a ${roleLabel} profile linked to this verified account. Please sign in with the email used to register or contact support.`;
    return (
      <main className="min-h-screen bg-green-50 p-8">
        <p className="mx-auto max-w-2xl rounded-lg bg-white p-5 text-red-700" role="alert">
          {missingProfileMessage}
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
  const [buyerProfile, setBuyerProfile] = useState(null);
  const [profileType, setProfileType] = useState(null);
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
      setBuyerProfile(null);
      setProfileType(null);
      setProfileOwnerUid(null);
      setProfileLoading(false);
      setProfileError("");
      return undefined;
    }

    let active = true;
    setFarmerProfile(null);
    setBuyerProfile(null);
    setProfileType(null);
    setProfileOwnerUid(null);
    setProfileLoading(true);
    setProfileError("");

    const loadAccountProfile = async () => {
      try {
        const token = await user.getIdToken(true);
        const headers = { Authorization: `Bearer ${token}` };
        try {
          const response = await axios.get(`${API_URL}/api/buyer/me`, { headers });
          if (active) {
            setBuyerProfile(response.data);
            setProfileType("buyer");
          }
        } catch (buyerError) {
          if (buyerError.response?.status !== 404) throw buyerError;

          try {
            const response = await axios.get(
              `${API_URL}/api/farmer/${encodeURIComponent(user.uid)}`,
              { headers }
            );
            if (active) {
              setFarmerProfile(response.data);
              setProfileType("farmer");
            }
          } catch (farmerError) {
            if (farmerError.response?.status !== 404) throw farmerError;
          }
        }
      } catch (error) {
        if (active) {
          setProfileError(
            error.response?.data?.message ||
              "Unable to load your account profile. Check the API connection and try again."
          );
        }
      } finally {
        if (active) {
          setProfileOwnerUid(user.uid);
          setProfileLoading(false);
        }
      }
    };

    loadAccountProfile();
    return () => {
      active = false;
    };
  }, [user]);

  return (
    <Router>
      <Header
        user={authLoading ? null : user}
        farmerProfile={profileOwnerUid === user?.uid ? farmerProfile : null}
        buyerProfile={profileOwnerUid === user?.uid ? buyerProfile : null}
        profileType={profileOwnerUid === user?.uid ? profileType : null}
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
        <Route path="/register/buyer" element={<BuyerRegister />} />
        <Route
          path="/dashboard/farmer"
          element={
            <ProtectedRoute
              authLoading={authLoading}
              authError={authError}
              profileLoading={profileLoading}
              profileError={profileError}
              accountProfile={farmerProfile}
              accountType="farmer"
              profileType={profileType}
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
          element={
            <ProtectedRoute
              authLoading={authLoading}
              authError={authError}
              profileLoading={profileLoading}
              profileError={profileError}
              accountProfile={buyerProfile}
              accountType="buyer"
              profileType={profileType}
              profileOwnerUid={profileOwnerUid}
              user={user}
              loginPath="/login/buyer"
              onBuyerProfileCreated={(profile) => {
                setBuyerProfile(profile);
                setProfileType("buyer");
              }}
            >
              <BuyerDashboard buyerProfile={buyerProfile} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute
              authLoading={authLoading}
              authError={authError}
              profileLoading={profileLoading}
              profileError={profileError}
              accountProfile={profileType === "buyer" ? buyerProfile : farmerProfile}
              accountType={profileType}
              profileType={profileType}
              profileOwnerUid={profileOwnerUid}
              user={user}
              loginPath={profileType === "buyer" ? "/login/buyer" : "/login/farmer"}
            >
              <ProfilePage accountType={profileType} />
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
