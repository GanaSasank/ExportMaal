import React, { useMemo, useState } from "react";

const quantityUnits = [
  { value: "kg", label: "Kilograms (kg)" },
  { value: "quintal", label: "Quintals" },
  { value: "tonne", label: "Tonnes" }
];

const quantityToKg = { kg: 1, quintal: 100, tonne: 1000 };
const priceToKg = { kg: 1, tonne: 1000 };

const emptyProduct = {
  productName: "Mosambi",
  quantity: "",
  quantityUnit: "kg",
  location: "",
  village: "",
  town: "",
  district: "",
  state: "",
  country: "",
  pincode: "",
  price: "",
  priceUnit: "kg"
};

const addressFields = [
  ["location", "Location"],
  ["village", "Village"],
  ["town", "Town"],
  ["district", "District"],
  ["state", "State"],
  ["country", "Country"],
  ["pincode", "Pincode"]
];

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2
});

const ProductFormModal = ({ product, saving, error, onClose, onSave }) => {
  const [formData, setFormData] = useState(() => (
    product
      ? {
          ...emptyProduct,
          ...product,
          quantity: String(product.quantity),
          price: String(product.price)
        }
      : emptyProduct
  ));

  const totalPrice = useMemo(() => {
    const quantity = Number(formData.quantity);
    const price = Number(formData.price);
    if (!quantity || !price || quantity <= 0 || price <= 0) return null;
    return (
      price *
      quantity *
      quantityToKg[formData.quantityUnit] /
      priceToKg[formData.priceUnit]
    );
  }, [formData]);

  const handleChange = (event) => {
    setFormData((previous) => ({
      ...previous,
      [event.target.name]: event.target.value
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave({
      ...formData,
      quantity: Number(formData.quantity),
      price: Number(formData.price)
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2 id="product-modal-title" className="text-2xl font-bold text-green-900">
            {product ? "Edit Product" : "Add Product"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close product form"
            className="rounded-lg px-3 py-1 text-2xl leading-none text-gray-500 hover:bg-gray-100 hover:text-gray-800"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="product-name" className="mb-1 block font-medium text-gray-700">
                Product name
              </label>
              <select
                id="product-name"
                name="productName"
                required
                value={formData.productName}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {["Mosambi", "Banana", "Chilli", "Brinjal"].map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="product-quantity" className="mb-1 block font-medium text-gray-700">
                Expected quantity
              </label>
              <div className="flex gap-2">
                <input
                  id="product-quantity"
                  name="quantity"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={formData.quantity}
                  onChange={handleChange}
                  className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <select
                  aria-label="Quantity unit"
                  name="quantityUnit"
                  value={formData.quantityUnit}
                  onChange={handleChange}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {quantityUnits.map((unit) => (
                    <option key={unit.value} value={unit.value}>{unit.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <fieldset>
            <legend className="mb-2 font-semibold text-green-900">Product location</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              {addressFields.map(([name, label]) => (
                <div key={name}>
                  <label htmlFor={`product-${name}`} className="mb-1 block font-medium text-gray-700">
                    {label}
                  </label>
                  <input
                    id={`product-${name}`}
                    name={name}
                    type="text"
                    required
                    value={formData[name]}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="product-price" className="mb-1 block font-medium text-gray-700">
                Price (INR)
              </label>
              <input
                id="product-price"
                name="price"
                type="number"
                min="0.01"
                step="0.01"
                required
                value={formData.price}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label htmlFor="product-price-unit" className="mb-1 block font-medium text-gray-700">
                Price per
              </label>
              <select
                id="product-price-unit"
                name="priceUnit"
                value={formData.priceUnit}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="kg">Kilogram (kg)</option>
                <option value="tonne">Tonne (1,000 kg)</option>
              </select>
            </div>
          </div>

          {totalPrice !== null && (
            <p className="rounded-lg bg-green-50 p-3 font-semibold text-green-900" aria-live="polite">
              Estimated total: {currency.format(totalPrice)}
            </p>
          )}

          <div>
            <p className="mb-2 font-medium text-gray-700">Product images</p>
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-lg border border-dashed border-gray-300 px-4 py-3 text-left text-gray-500"
            >
              Upload images <span className="ml-2 font-semibold text-amber-700">Coming soon</span>
            </button>
          </div>

          {error && <p className="text-sm text-red-700" role="alert">{error}</p>}

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-gray-300 px-5 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-green-700 px-5 py-2 text-white hover:bg-green-800 disabled:opacity-60"
            >
              {saving ? "Saving..." : product ? "Save Changes" : "Submit"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default ProductFormModal;
