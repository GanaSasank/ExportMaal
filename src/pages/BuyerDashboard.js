import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const productNames = ["Mosambi", "Banana", "Chilli", "Brinjal"];
const locationFields = [
  ["village", "Village"],
  ["town", "Town"],
  ["district", "District"],
  ["state", "State"],
  ["country", "Country"],
  ["pincode", "Pincode"]
];

const formatRupees = (amount) => `₹${Number(amount).toLocaleString("en-IN", {
  maximumFractionDigits: 2
})}`;

const formatLocation = (product) => [
  product.location,
  product.village,
  product.town,
  product.district,
  product.state,
  product.country,
  product.pincode
].filter(Boolean).join(", ");

const BuyerDashboard = ({ buyerProfile }) => {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [logoutError, setLogoutError] = useState("");
  const [filters, setFilters] = useState({
    productName: "",
    village: "",
    town: "",
    district: "",
    state: "",
    country: "",
    pincode: ""
  });
  const [priceRange, setPriceRange] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);

  const loadProducts = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setError("Sign in as a Buyer to browse available products.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const token = await user.getIdToken(true);
      const response = await axios.get(`${API_URL}/api/buyer/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data);
      setPriceRange(null);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to load available products. Check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const availablePriceRange = useMemo(() => {
    const totals = products
      .map((product) => Number(product.totalPrice))
      .filter(Number.isFinite);
    if (!totals.length) return { min: 0, max: 0 };
    return {
      min: Math.floor(Math.min(...totals)),
      max: Math.ceil(Math.max(...totals))
    };
  }, [products]);

  const selectedPriceRange = priceRange || availablePriceRange;

  const filteredProducts = useMemo(() => products.filter((product) => {
    const totalPrice = Number(product.totalPrice);
    if (totalPrice < selectedPriceRange.min || totalPrice > selectedPriceRange.max) {
      return false;
    }
    if (filters.productName && product.productName !== filters.productName) {
      return false;
    }
    return locationFields.every(([field]) => (
      !filters[field] ||
      String(product[field] || "").toLowerCase().includes(filters[field].trim().toLowerCase())
    ));
  }), [filters, products, selectedPriceRange]);

  const updateFilter = (event) => {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const resetFilters = () => {
    setFilters({
      productName: "",
      village: "",
      town: "",
      district: "",
      state: "",
      country: "",
      pincode: ""
    });
    setPriceRange(null);
  };

  const openProductDetails = async (product) => {
    setDetailsOpen(true);
    setDetailLoading(true);
    setDetailError("");
    setSelectedProduct(null);
    try {
      const token = await user.getIdToken(true);
      const response = await axios.get(
        `${API_URL}/api/buyer/products/${encodeURIComponent(product._id)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedProduct(response.data);
    } catch (requestError) {
      setDetailError(
        requestError.response?.data?.message ||
          "Unable to load farmer details. Please try again."
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const handleLogout = async () => {
    setLogoutError("");
    try {
      await signOut(auth);
      navigate("/login/buyer", { replace: true });
    } catch (logoutRequestError) {
      setLogoutError(logoutRequestError.message || "Unable to log out. Please try again.");
    }
  };

  const setPriceLimit = (bound, value) => {
    const number = Number(value);
    setPriceRange((current) => {
      const next = current || availablePriceRange;
      if (bound === "min") {
        return { min: Math.min(number, next.max), max: next.max };
      }
      return { min: next.min, max: Math.max(number, next.min) };
    });
  };

  return (
    <main className="min-h-screen bg-blue-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">
              Welcome, {buyerProfile?.name || "Buyer"}!
            </h1>
            <p className="mt-1 text-gray-700">
              {buyerProfile?.name
                ? `Signed in as ${buyerProfile.name}`
                : "Browse products available from farmers"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-red-300 bg-white px-5 py-2.5 font-semibold text-red-700 hover:bg-red-50"
          >
            Logout
          </button>
        </div>

        {logoutError && <p className="mb-4 text-red-700" role="alert">{logoutError}</p>}
        {error && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-red-50 p-4 text-red-800" role="alert">
            <p>{error}</p>
            <button type="button" onClick={loadProducts} className="font-semibold underline">
              Retry
            </button>
          </div>
        )}

        <section className="mb-7 rounded-2xl bg-white p-5 shadow-sm" aria-label="Filter products">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-blue-900">Find products</h2>
            <button
              type="button"
              onClick={resetFilters}
              className="text-sm font-semibold text-blue-800 hover:underline"
            >
              Clear filters
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm font-medium text-gray-700">
              Product
              <select
                name="productName"
                value={filters.productName}
                onChange={updateFilter}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2"
              >
                <option value="">All products</option>
                {productNames.map((name) => <option key={name}>{name}</option>)}
              </select>
            </label>
            {locationFields.map(([field, label]) => (
              <label key={field} className="text-sm font-medium text-gray-700">
                {label}
                <input
                  type="search"
                  name={field}
                  value={filters[field]}
                  onChange={updateFilter}
                  placeholder={`Any ${label.toLowerCase()}`}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                />
              </label>
            ))}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-gray-700">
              Minimum estimated total: {formatRupees(selectedPriceRange.min)}
              <input
                type="range"
                aria-label="Minimum estimated total"
                min={availablePriceRange.min}
                max={availablePriceRange.max}
                step="1"
                value={selectedPriceRange.min}
                onChange={(event) => setPriceLimit("min", event.target.value)}
                disabled={availablePriceRange.min === availablePriceRange.max}
                className="mt-2 w-full accent-blue-700"
              />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Maximum estimated total: {formatRupees(selectedPriceRange.max)}
              <input
                type="range"
                aria-label="Maximum estimated total"
                min={availablePriceRange.min}
                max={availablePriceRange.max}
                step="1"
                value={selectedPriceRange.max}
                onChange={(event) => setPriceLimit("max", event.target.value)}
                disabled={availablePriceRange.min === availablePriceRange.max}
                className="mt-2 w-full accent-blue-700"
              />
            </label>
          </div>
        </section>

        {loading ? (
          <p className="rounded-xl bg-white p-8 text-center text-gray-600 shadow-sm" role="status">
            Loading available products...
          </p>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-blue-300 bg-white px-6 py-16 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-blue-900">No products available yet</h2>
            <p className="mt-2 text-gray-600">Farmer listings will appear here when available.</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center text-gray-600 shadow-sm">
            No products match these filters.
          </div>
        ) : (
          <section aria-label="Available products" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => (
              <article
                key={product._id}
                className="flex flex-col rounded-2xl border border-blue-100 bg-white p-5 shadow-md"
              >
                <div className="mb-4 border-b border-blue-100 pb-3">
                  <h2 className="text-xl font-bold text-blue-900">{product.productName}</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    {product.quantity} {product.quantityUnit} available
                  </p>
                </div>
                <dl className="flex-1 space-y-3 text-sm text-gray-700">
                  <div>
                    <dt className="font-semibold text-gray-900">Location</dt>
                    <dd>{formatLocation(product)}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-gray-900">Expected price</dt>
                    <dd>{formatRupees(product.price)} per {product.priceUnit}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-gray-900">Estimated total</dt>
                    <dd className="text-base font-bold text-blue-800">
                      {formatRupees(product.totalPrice)}
                    </dd>
                  </div>
                </dl>
                <button
                  type="button"
                  onClick={() => openProductDetails(product)}
                  className="mt-5 rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white hover:bg-blue-800"
                >
                  View farmer details
                </button>
              </article>
            ))}
          </section>
        )}
      </div>

      {detailsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="buyer-product-details-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 id="buyer-product-details-title" className="text-2xl font-bold text-blue-900">
                Product details
              </h2>
              <button
                type="button"
                onClick={() => setDetailsOpen(false)}
                aria-label="Close product details"
                className="rounded-lg px-3 py-1 text-2xl text-gray-500 hover:bg-gray-100"
              >
                ×
              </button>
            </div>
            {detailLoading ? (
              <p role="status" className="text-gray-600">Loading farmer details...</p>
            ) : detailError ? (
              <p role="alert" className="text-red-700">{detailError}</p>
            ) : selectedProduct ? (
              <>
                <h3 className="text-lg font-bold text-gray-900">
                  {selectedProduct.productName}
                </h3>
                <dl className="mt-4 space-y-3 text-sm text-gray-700">
                  <div>
                    <dt className="font-semibold text-gray-900">Farmer</dt>
                    <dd>{selectedProduct.farmer.name}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-gray-900">Farmer phone</dt>
                    <dd>
                      <a className="text-blue-800 underline" href={`tel:${selectedProduct.farmer.phone}`}>
                        {selectedProduct.farmer.phone}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-gray-900">Quantity</dt>
                    <dd>{selectedProduct.quantity} {selectedProduct.quantityUnit}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-gray-900">Location</dt>
                    <dd>{formatLocation(selectedProduct)}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-gray-900">Expected price</dt>
                    <dd>{formatRupees(selectedProduct.price)} per {selectedProduct.priceUnit}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-gray-900">Estimated total</dt>
                    <dd>{formatRupees(selectedProduct.totalPrice)}</dd>
                  </div>
                </dl>
              </>
            ) : null}
          </section>
        </div>
      )}
    </main>
  );
};

export default BuyerDashboard;
