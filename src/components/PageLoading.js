import React from "react";

const PageLoading = ({ overlay = false }) => (
  <div
    className={
      overlay
        ? "fixed inset-0 z-50 flex items-center justify-center bg-white/75 backdrop-blur-sm"
        : "flex min-h-screen items-center justify-center bg-green-50"
    }
    role="status"
    aria-live="polite"
  >
    <span
      className="h-12 w-12 animate-spin rounded-full border-4 border-green-200 border-t-green-700"
      aria-hidden="true"
    />
    <span className="sr-only">Loading page</span>
  </div>
);

export default PageLoading;
