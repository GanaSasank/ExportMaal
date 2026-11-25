import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import ProductFormModal from "../components/ProductFormModal";
import { auth } from "../firebase";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const formatRupees = (amount) => `₹${Number(amount).toLocaleString("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})}`;

const FarmerDashboard = ({ farmerProfile }) => {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const loadProducts = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setError("Sign in to load your farmer products.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const token = await user.getIdToken(true);
      const response = await axios.get(`${API_URL}/api/products/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to load your products. Check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const openNewProductForm = () => {
    setEditingProduct(null);
    setModalError("");
    setModalOpen(true);
  };

  const openEditProductForm = (product) => {
    setEditingProduct(product);
    setModalError("");
    setModalOpen(true);
  };

  const closeProductForm = () => {
    if (saving) return;
    setModalOpen(false);
    setEditingProduct(null);
    setModalError("");
  };

  const saveProduct = async (productData) => {
    setSaving(true);
    setModalError("");
    try {
      const token = await user.getIdToken(true);
      const headers = { Authorization: `Bearer ${token}` };
      const response = editingProduct
        ? await axios.put(
            `${API_URL}/api/products/${editingProduct._id}`,
            productData,
            { headers }
          )
        : await axios.post(`${API_URL}/api/products`, productData, { headers });

      setProducts((currentProducts) => (
        editingProduct
          ? currentProducts.map((item) => (
              item._id === response.data._id ? response.data : item
            ))
          : [response.data, ...currentProducts]
      ));
      setModalOpen(false);
      setEditingProduct(null);
    } catch (requestError) {
      setModalError(
        requestError.response?.data?.message ||
          "Unable to save this product. Check your connection and try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (product) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${product.productName}?`
    );
    if (!confirmed) return;

    setError("");
    try {
      const token = await user.getIdToken(true);
      await axios.delete(`${API_URL}/api/products/${product._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts((currentProducts) => (
        currentProducts.filter((item) => item._id !== product._id)
      ));
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Unable to delete this product. Please try again."
      );
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login/farmer");
  };

  return (
    <main className="min-h-screen bg-green-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-green-900">Welcome, Farmer!</h1>
            <p className="mt-1 text-gray-700">
              {farmerProfile?.name
                ? `Signed in as ${farmerProfile.name}`
                : "Manage your products"}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openNewProductForm}
              className="rounded-lg bg-green-700 px-5 py-2.5 font-semibold text-white shadow hover:bg-green-800"
            >
              Add Product
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-red-300 bg-white px-5 py-2.5 font-semibold text-red-700 hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-red-50 p-4 text-red-800" role="alert">
            <p>{error}</p>
            <button
              type="button"
              onClick={loadProducts}
              className="font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <p className="rounded-xl bg-white p-8 text-center text-gray-600 shadow-sm" role="status">
            Loading your products...
          </p>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-green-300 bg-white px-6 py-16 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-green-900">No products added yet</h2>
            <p className="mt-2 text-gray-600">
              Use the Add Product button to add your product.
            </p>
          </div>
        ) : (
          <section aria-label="Your products" className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <article
                key={product._id}
                className="flex flex-col rounded-2xl border border-green-100 bg-white p-5 shadow-md"
              >
                <div className="mb-4 border-b border-green-100 pb-3">
                  <h2 className="text-xl font-bold text-green-900">{product.productName}</h2>
                  <p className="mt-1 text-sm text-gray-600">
                    {product.quantity} {product.quantityUnit} available
                  </p>
                </div>
                <dl className="flex-1 space-y-3 text-sm text-gray-700">
                  <div>
                    <dt className="font-semibold text-gray-900">Location</dt>
                    <dd>
                      {[product.location, product.village, product.town, product.district,
                        product.state, product.country, product.pincode]
                        .filter(Boolean)
                        .join(", ")}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-gray-900">Expected price</dt>
                    <dd>{formatRupees(product.price)} per {product.priceUnit}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-gray-900">Estimated total</dt>
                    <dd className="text-base font-bold text-green-800">
                      {formatRupees(product.totalPrice)}
                    </dd>
                  </div>
                </dl>
                <div className="mt-5 flex gap-3 border-t border-gray-100 pt-4">
                  <button
                    type="button"
                    onClick={() => openEditProductForm(product)}
                    className="flex-1 rounded-lg border border-green-700 px-4 py-2 font-medium text-green-800 hover:bg-green-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteProduct(product)}
                    className="flex-1 rounded-lg border border-red-300 px-4 py-2 font-medium text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>

      {modalOpen && (
        <ProductFormModal
          key={editingProduct?._id || "new-product"}
          product={editingProduct}
          saving={saving}
          error={modalError}
          onClose={closeProductForm}
          onSave={saveProduct}
        />
      )}
    </main>
  );
};

export default FarmerDashboard;
