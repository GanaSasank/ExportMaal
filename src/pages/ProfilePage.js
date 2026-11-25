import React, { useEffect, useState } from "react";
import axios from "axios";
import { reload, verifyBeforeUpdateEmail } from "firebase/auth";
import { auth } from "../firebase";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const user = auth.currentUser;
        if (!user?.emailVerified) {
          throw new Error("Sign in with a verified farmer account to view this profile.");
        }

        await reload(user);
        const token = await user.getIdToken(true);
        const headers = { Authorization: `Bearer ${token}` };
        let response = await axios.get(
          `${API_URL}/api/farmer/${encodeURIComponent(user.uid)}`,
          { headers }
        );
        let farmer = response.data;

        if (user.email && user.email !== farmer.email) {
          response = await axios.put(
            `${API_URL}/api/farmer/${encodeURIComponent(user.uid)}`,
            { name: farmer.name, phone: farmer.phone },
            { headers: { Authorization: `Bearer ${await user.getIdToken(true)}` } }
          );
          farmer = response.data;
        }

        if (!active) return;
        setProfile(farmer);
        setFormData({
          name: farmer.name || "",
          phone: farmer.phone || "",
          email: farmer.email || ""
        });
        setPendingEmail("");
      } catch (loadError) {
        if (active) {
          setError(
            loadError.response?.data?.message ||
              loadError.message ||
              "Unable to load your farmer profile."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      active = false;
    };
  }, []);

  const handleChange = (event) => {
    setFormData((previous) => ({
      ...previous,
      [event.target.name]: event.target.value
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    const user = auth.currentUser;
    if (!user || !profile) {
      setSaving(false);
      setError("Your signed-in farmer profile could not be found.");
      return;
    }

    const newEmail = formData.email.trim();
    const emailChanged = newEmail.toLowerCase() !== profile.email.toLowerCase();
    let verificationSent = false;

    try {
      if (emailChanged) {
        await verifyBeforeUpdateEmail(user, newEmail, {
          url: `${window.location.origin}/profile`
        });
        verificationSent = true;
        setPendingEmail(newEmail);
      }

      const token = await user.getIdToken(true);
      const response = await axios.put(
        `${API_URL}/api/farmer/${encodeURIComponent(user.uid)}`,
        {
          name: formData.name.trim(),
          phone: formData.phone.trim()
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProfile(response.data);
      setFormData({
        name: response.data.name || "",
        phone: response.data.phone || "",
        email: response.data.email || ""
      });
      setEditing(false);
      setMessage(
        verificationSent
          ? `Profile saved. Verify the link sent to ${newEmail} to finish changing your email address.`
          : "Your profile has been updated."
      );
    } catch (saveError) {
      const details =
        saveError.response?.data?.message ||
        (saveError.response?.status === 404
          ? "The farmer profile update route was not found. Restart the backend server and try again."
          : "") ||
        saveError.message ||
        "Please try again.";
      setError(
        verificationSent
          ? `A verification email was sent, but the other profile changes could not be saved: ${details}`
          : details
      );
    } finally {
      setSaving(false);
    }
  };

  const cancelEditing = () => {
    setFormData({
      name: profile.name || "",
      phone: profile.phone || "",
      email: profile.email || ""
    });
    setEditing(false);
    setError("");
    setMessage("");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-green-50 p-8 text-center text-green-900">
        Loading your profile...
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-green-50 p-8">
        <p className="mx-auto max-w-2xl rounded-lg bg-white p-5 text-red-700" role="alert">
          {error || "Farmer profile not found."}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-green-50 p-6 sm:p-10">
      <section className="mx-auto max-w-2xl rounded-2xl bg-white p-8 shadow-md">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-green-900">My Farmer Profile</h1>
          {!editing && (
            <button
              type="button"
              onClick={() => {
                setError("");
                setMessage("");
                setEditing(true);
              }}
              className="rounded-lg bg-green-700 px-4 py-2 text-white hover:bg-green-800"
            >
              Edit Profile
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor="farmer-name" className="mb-1 block font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="farmer-name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label htmlFor="farmer-phone" className="mb-1 block font-medium text-gray-700">
                Phone Number
              </label>
              <input
                id="farmer-phone"
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label htmlFor="farmer-email" className="mb-1 block font-medium text-gray-700">
                Email
              </label>
              <input
                id="farmer-email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Email changes take effect only after you verify the email link.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-green-700 px-5 py-2 text-white hover:bg-green-800 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={cancelEditing}
                disabled={saving}
                className="rounded-lg border border-gray-300 px-5 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <dl className="space-y-5 text-gray-700">
            <div>
              <dt className="font-semibold text-green-900">Full Name</dt>
              <dd>{profile.name}</dd>
            </div>
            <div>
              <dt className="font-semibold text-green-900">Email</dt>
              <dd>{profile.email}</dd>
            </div>
            <div>
              <dt className="font-semibold text-green-900">Phone Number</dt>
              <dd>{profile.phone}</dd>
            </div>
            <div>
              <dt className="font-semibold text-green-900">Email Status</dt>
              <dd>{auth.currentUser?.emailVerified ? "Verified" : "Not verified"}</dd>
            </div>
          </dl>
        )}

        {pendingEmail && (
          <p className="mt-5 text-sm text-amber-800" role="status">
            Email change pending verification for {pendingEmail}.
          </p>
        )}
        {message && (
          <p className="mt-5 text-sm text-green-800" role="status">
            {message}
          </p>
        )}
        {error && (
          <p className="mt-5 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
      </section>
    </main>
  );
};

export default ProfilePage;
