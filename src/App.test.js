import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within
} from "@testing-library/react";
import App from "./App";

jest.mock("./firebase", () => ({
  auth: { currentUser: null },
}));

jest.mock("firebase/auth", () => ({
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  sendEmailVerification: jest.fn(),
  reload: jest.fn(),
  verifyBeforeUpdateEmail: jest.fn(),
}));

jest.mock("axios", () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));

const { auth } = require("./firebase");
const {
  onAuthStateChanged,
  signOut,
  reload,
  verifyBeforeUpdateEmail,
  createUserWithEmailAndPassword
} = require("firebase/auth");
const axios = require("axios");
let authListener;

beforeEach(() => {
  jest.clearAllMocks();
  auth.currentUser = null;
  const farmerProfile = {
    uid: "farmer-uid",
    name: "Farmer Name",
    email: "signed-in@example.com",
    phone: "1234567890"
  };
  axios.get.mockImplementation((url) => Promise.resolve({
    data: url.includes("/api/products/me") ? [] : farmerProfile
  }));
  axios.put.mockResolvedValue({
    data: {
      uid: "farmer-uid",
      name: "Farmer Name",
      email: "signed-in@example.com",
      phone: "1234567890"
    }
  });
  reload.mockResolvedValue(undefined);
  onAuthStateChanged.mockImplementation((firebaseAuth, onUser) => {
    authListener = onUser;
    onUser(firebaseAuth.currentUser);
    return jest.fn();
  });
  signOut.mockImplementation(async (firebaseAuth) => {
    firebaseAuth.currentUser = null;
    authListener?.(null);
  });
});

test("renders the landing page and shared footer", async () => {
  render(<App />);

  expect(
    await screen.findByRole("heading", { name: /welcome to export maal/i })
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Export-Maal" })).toHaveAttribute(
    "href",
    "/"
  );
  expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute(
    "href",
    "/privacy"
  );
});

test("shows farmer and buyer login options in the signed-out account menu", async () => {
  render(<App />);
  const accountButton = await screen.findByRole("button", {
    name: "Account options",
  });
  await waitFor(() => expect(accountButton).toBeEnabled());
  fireEvent.click(accountButton);

  expect(screen.getByRole("link", { name: "Login as Farmer" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Login as Buyer" })).toBeInTheDocument();
});

test("directs duplicate farmer emails to sign in instead of creating another account", async () => {
  const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
  createUserWithEmailAndPassword.mockRejectedValueOnce({
    code: "auth/email-already-in-use"
  });
  window.history.pushState({}, "", "/register/farmer");
  render(<App />);

  fireEvent.change(screen.getByPlaceholderText("Enter your name"), {
    target: { value: "Farmer Name" }
  });
  fireEvent.change(screen.getByPlaceholderText("Enter your phone number"), {
    target: { value: "1234567890" }
  });
  fireEvent.change(screen.getByPlaceholderText("Enter your email"), {
    target: { value: "signed-in@example.com" }
  });
  fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
    target: { value: "password123" }
  });
  fireEvent.change(screen.getByPlaceholderText("Confirm your password"), {
    target: { value: "password123" }
  });
  fireEvent.click(screen.getByRole("button", { name: "Register" }));

  expect(
    await screen.findByText(/a farmer account with this email already exists/i)
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Go to Farmer Login" })).toBeInTheDocument();
  expect(axios.post).not.toHaveBeenCalled();
  consoleError.mockRestore();
});

test.each([
  ["/dashboard/farmer", /welcome farmer/i],
  ["/dashboard/buyer", /buyer accounts are coming soon/i],
])("redirects unauthenticated visits to %s to the matching page", async (path, loginHeading) => {
  window.history.pushState({}, "", path);
  render(<App />);

  expect(await screen.findByRole("heading", { name: loginHeading })).toBeInTheDocument();
});

test("renders the farmer dashboard for a verified farmer profile", async () => {
  auth.currentUser = {
    uid: "farmer-uid",
    email: "signed-in@example.com",
    emailVerified: true,
    getIdToken: jest.fn().mockResolvedValue("test-token")
  };
  window.history.pushState({}, "", "/dashboard/farmer");
  render(<App />);

  expect(
    await screen.findByRole("heading", { name: /welcome, farmer!/i })
  ).toBeInTheDocument();
  expect(screen.getByText("Signed in as Farmer Name")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("link", { name: "Export-Maal" }));
  expect(
    await screen.findByRole("heading", { name: /welcome, farmer!/i })
  ).toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: /welcome to export maal/i }))
    .not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Export-Maal" })).toHaveAttribute(
    "href",
    "/dashboard/farmer"
  );
  await waitFor(() => {
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining("/api/farmer/farmer-uid"),
      expect.objectContaining({
        headers: { Authorization: "Bearer test-token" }
      })
    );
  });
});

test("keeps a farmer profile when its saved Firebase UID differs but email matches", async () => {
  auth.currentUser = {
    uid: "current-firebase-uid",
    email: "signed-in@example.com",
    emailVerified: true,
    getIdToken: jest.fn().mockResolvedValue("test-token")
  };
  axios.get.mockImplementation((url) => Promise.resolve({
    data: url.includes("/api/products/me")
      ? []
      : {
          uid: "legacy-firebase-uid",
          name: "Farmer Name",
          email: "signed-in@example.com",
          phone: "1234567890"
        }
  }));
  window.history.pushState({}, "", "/dashboard/farmer");
  render(<App />);

  expect(
    await screen.findByRole("heading", { name: /welcome, farmer!/i })
  ).toBeInTheDocument();
  fireEvent.click(await screen.findByRole("button", { name: "Account options" }));
  expect(screen.getByRole("link", { name: "My Profile" })).toBeInTheDocument();
});

test("does not ask farmers to re-enter registration details when a profile is missing", async () => {
  const user = {
    uid: "farmer-uid",
    email: "signed-in@example.com",
    emailVerified: true,
    getIdToken: jest.fn().mockResolvedValue("test-token")
  };
  auth.currentUser = user;
  axios.get.mockImplementation((url) => (
    url.includes("/api/products/me")
      ? Promise.resolve({ data: [] })
      : Promise.reject({
          response: { status: 404, data: { message: "Farmer profile not found" } }
        })
  ));
  window.history.pushState({}, "", "/dashboard/farmer");
  render(<App />);

  expect(
    await screen.findByRole("alert")
  ).toHaveTextContent(/registration details have not been requested again/i);
  expect(screen.queryByLabelText("Full Name")).not.toBeInTheDocument();
});

test("creates a product and calculates total price from quantity and price units", async () => {
  const user = {
    uid: "farmer-uid",
    email: "signed-in@example.com",
    emailVerified: true,
    getIdToken: jest.fn().mockResolvedValue("test-token")
  };
  const product = {
    _id: "product-1",
    productName: "Banana",
    quantity: 2,
    quantityUnit: "quintal",
    location: "Farm",
    village: "Village",
    town: "Town",
    district: "District",
    state: "State",
    country: "India",
    pincode: "123456",
    price: 50,
    priceUnit: "tonne",
    totalPrice: 10
  };
  auth.currentUser = user;
  axios.post.mockResolvedValueOnce({ data: product });
  window.history.pushState({}, "", "/dashboard/farmer");
  render(<App />);

  expect(await screen.findByText("No products added yet")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Add Product" }));
  expect(screen.getByRole("dialog")).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Product name"), {
    target: { value: "Banana" }
  });
  fireEvent.change(screen.getByLabelText("Expected quantity"), {
    target: { value: "2" }
  });
  fireEvent.change(screen.getByLabelText("Quantity unit"), {
    target: { value: "quintal" }
  });
  for (const [label, value] of [
    ["Location", "Farm"],
    ["Village", "Village"],
    ["Town", "Town"],
    ["District", "District"],
    ["State", "State"],
    ["Country", "India"],
    ["Pincode", "123456"]
  ]) {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  }
  fireEvent.change(screen.getByLabelText("Price (INR)"), {
    target: { value: "50" }
  });
  fireEvent.change(screen.getByLabelText("Price per"), {
    target: { value: "tonne" }
  });
  expect(screen.getByText("Estimated total: ₹10.00")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Submit" }));

  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(screen.getByRole("heading", { name: "Banana" })).toBeInTheDocument();
  expect(axios.post).toHaveBeenCalledWith(
    expect.stringContaining("/api/products"),
    expect.objectContaining({
      quantity: 2,
      quantityUnit: "quintal",
      price: 50,
      priceUnit: "tonne"
    }),
    expect.objectContaining({
      headers: { Authorization: "Bearer test-token" }
    })
  );

  const updatedProduct = {
    ...product,
    price: 60,
    priceUnit: "kg",
    totalPrice: 12000
  };
  axios.put.mockResolvedValueOnce({ data: updatedProduct });
  fireEvent.click(screen.getByRole("button", { name: "Edit" }));
  fireEvent.change(screen.getByLabelText("Price (INR)"), {
    target: { value: "60" }
  });
  fireEvent.change(screen.getByLabelText("Price per"), {
    target: { value: "kg" }
  });
  fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
  expect(await screen.findByText("₹12,000.00")).toBeInTheDocument();

  const confirmation = jest.spyOn(window, "confirm").mockReturnValue(true);
  axios.delete.mockResolvedValueOnce({});
  fireEvent.click(screen.getByRole("button", { name: "Delete" }));
  expect(confirmation).toHaveBeenCalledWith(
    "Are you sure you want to delete Banana?"
  );
  await waitFor(() => expect(screen.queryByText("Banana")).not.toBeInTheDocument());
  confirmation.mockRestore();
});

test("does not allow farmer accounts to open the buyer dashboard", async () => {
  auth.currentUser = {
    uid: "farmer-uid",
    email: "signed-in@example.com",
    emailVerified: true,
    getIdToken: jest.fn().mockResolvedValue("test-token")
  };
  window.history.pushState({}, "", "/dashboard/buyer");
  render(<App />);

  expect(
    await screen.findByRole("heading", { name: /buyer accounts are coming soon/i })
  ).toBeInTheDocument();
});

test("shows profile and logout options for a signed-in user", async () => {
  auth.currentUser = {
    uid: "farmer-uid",
    email: "signed-in@example.com",
    emailVerified: true,
    getIdToken: jest.fn().mockResolvedValue("test-token")
  };
  render(<App />);
  const accountButton = await screen.findByRole("button", {
    name: "Account options",
  });
  await waitFor(() => expect(accountButton).toBeEnabled());
  fireEvent.click(accountButton);

  fireEvent.click(screen.getByRole("link", { name: "My Profile" }));
  expect(
    await screen.findByRole("heading", { name: "My Farmer Profile" })
  ).toBeInTheDocument();
  expect(screen.getByText("signed-in@example.com")).toBeInTheDocument();
  expect(
    within(screen.getByRole("main")).queryByRole("link", { name: "Buyer Dashboard" })
  ).not.toBeInTheDocument();

  fireEvent.click(accountButton);
  await act(async () => {
    fireEvent.click(screen.getByRole("button", { name: "Logout" }));
  });
  expect(signOut).toHaveBeenCalled();
});

test("farmer email changes require verification before saving", async () => {
  auth.currentUser = {
    uid: "farmer-uid",
    email: "signed-in@example.com",
    emailVerified: true,
    getIdToken: jest.fn().mockResolvedValue("test-token")
  };
  window.history.pushState({}, "", "/profile");
  render(<App />);

  fireEvent.click(await screen.findByRole("button", { name: "Edit Profile" }));
  fireEvent.change(screen.getByLabelText("Full Name"), {
    target: { value: "Updated Farmer" }
  });
  fireEvent.change(screen.getByLabelText("Phone Number"), {
    target: { value: "0987654321" }
  });
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "new@example.com" }
  });
  fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

  expect(await screen.findByText(/verify the link sent to new@example\.com/i))
    .toBeInTheDocument();
  expect(verifyBeforeUpdateEmail).toHaveBeenCalled();
  expect(axios.put).toHaveBeenCalledWith(
    expect.stringContaining("/api/farmer/farmer-uid"),
    { name: "Updated Farmer", phone: "0987654321" },
    expect.objectContaining({
      headers: { Authorization: "Bearer test-token" }
    })
  );
});
test("shows the transition loader when navigating between pages", async () => {
  render(<App />);
  fireEvent.click(screen.getByRole("link", { name: "How It Works" }));

  expect(
    await screen.findByRole("heading", { name: "How It Works" })
  ).toBeInTheDocument();
  expect(screen.getByRole("status")).toBeInTheDocument();
  await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
});
