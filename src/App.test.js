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
  sendPasswordResetEmail: jest.fn(),
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
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  reload,
  verifyBeforeUpdateEmail,
  createUserWithEmailAndPassword,
  sendEmailVerification
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
  axios.get.mockImplementation((url) => {
    if (url.includes("/api/buyer/me")) {
      return Promise.reject({ response: { status: 404 } });
    }
    if (url.includes("/api/buyer/products")) return Promise.resolve({ data: [] });
    if (url.includes("/api/products/me")) return Promise.resolve({ data: [] });
    return Promise.resolve({ data: farmerProfile });
  });
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

test("registers Buyers with matching farmer fields, required declaration, Mongo profile, and email verification", async () => {
  const buyerUser = {
    uid: "buyer-uid",
    email: "buyer@example.com",
    getIdToken: jest.fn().mockResolvedValue("buyer-token"),
    delete: jest.fn().mockResolvedValue(undefined)
  };
  createUserWithEmailAndPassword.mockResolvedValueOnce({ user: buyerUser });
  sendEmailVerification.mockResolvedValueOnce(undefined);
  axios.post.mockResolvedValueOnce({ data: { uid: "buyer-uid" } });
  window.history.pushState({}, "", "/register/buyer");
  render(<App />);

  fireEvent.change(await screen.findByPlaceholderText("Enter your name"), {
    target: { value: "Buyer Name" }
  });
  fireEvent.change(screen.getByPlaceholderText("Enter your phone number"), {
    target: { value: "1234567890" }
  });
  fireEvent.change(screen.getByPlaceholderText("Enter your email"), {
    target: { value: "buyer@example.com" }
  });
  fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
    target: { value: "password123" }
  });
  fireEvent.change(screen.getByPlaceholderText("Confirm your password"), {
    target: { value: "password123" }
  });

  const declaration = screen.getByRole("checkbox", { name: /genuine buyer/i });
  expect(declaration).toBeRequired();
  fireEvent.click(declaration);
  fireEvent.click(screen.getByRole("button", { name: "Register" }));

  expect(await screen.findByText(/registered successfully/i)).toBeInTheDocument();
  expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
    auth,
    "buyer@example.com",
    "password123"
  );
  expect(sendEmailVerification).toHaveBeenCalledWith(buyerUser);
  expect(axios.post).toHaveBeenCalledWith(
    expect.stringContaining("/api/buyer"),
    expect.objectContaining({
      uid: "buyer-uid",
      name: "Buyer Name",
      phone: "1234567890",
      email: "buyer@example.com",
      genuineBuyerConfirmed: true
    }),
    expect.objectContaining({
      headers: { Authorization: "Bearer buyer-token" }
    })
  );
});

test.each([
  ["/dashboard/farmer", /welcome farmer/i],
  ["/dashboard/buyer", /buyer login/i],
])("redirects unauthenticated visits to %s to the matching page", async (path, loginHeading) => {
  window.history.pushState({}, "", path);
  render(<App />);

  expect(await screen.findByRole("heading", { name: loginHeading })).toBeInTheDocument();
});

test("Buyer login opens the Buyer dashboard and greets the Buyer by name", async () => {
  const buyerProfile = {
    uid: "buyer-uid",
    name: "Buyer Name",
    email: "buyer@example.com",
    phone: "1234567890"
  };
  const buyerUser = {
    uid: "buyer-uid",
    email: "buyer@example.com",
    emailVerified: true,
    getIdToken: jest.fn().mockResolvedValue("buyer-token")
  };
  signInWithEmailAndPassword.mockImplementationOnce(async (firebaseAuth) => {
    firebaseAuth.currentUser = buyerUser;
    authListener(buyerUser);
    return { user: buyerUser };
  });
  axios.get.mockImplementation((url) => {
    if (url.includes("/api/buyer/me")) return Promise.resolve({ data: buyerProfile });
    if (url.includes("/api/buyer/products")) return Promise.resolve({ data: [] });
    return Promise.reject({ response: { status: 404 } });
  });
  window.history.pushState({}, "", "/login/buyer");
  render(<App />);

  fireEvent.change(await screen.findByPlaceholderText("Enter your email"), {
    target: { value: "buyer@example.com" }
  });
  fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
    target: { value: "password123" }
  });
  fireEvent.click(screen.getByRole("button", { name: "Login" }));

  expect(
    await screen.findByRole("heading", { name: "Welcome, Buyer Name!" })
  ).toBeInTheDocument();
  expect(screen.getByText("Signed in as Buyer Name")).toBeInTheDocument();
  expect(axios.get).toHaveBeenCalledWith(
    expect.stringContaining("/api/buyer/products"),
    expect.objectContaining({
      headers: { Authorization: "Bearer buyer-token" }
    })
  );
});

test("Buyer login can complete a missing profile without creating another Firebase account", async () => {
  const buyerProfile = {
    uid: "buyer-uid",
    name: "Buyer Recovery",
    email: "buyer@example.com",
    phone: "1234567890"
  };
  const buyerUser = {
    uid: "buyer-uid",
    email: "buyer@example.com",
    emailVerified: true,
    getIdToken: jest.fn().mockResolvedValue("buyer-token")
  };
  signInWithEmailAndPassword.mockImplementationOnce(async (firebaseAuth) => {
    firebaseAuth.currentUser = buyerUser;
    authListener(buyerUser);
    return { user: buyerUser };
  });
  axios.get.mockImplementation((url) => {
    if (url.includes("/api/buyer/me") || url.includes("/api/farmer/")) {
      return Promise.reject({ response: { status: 404 } });
    }
    if (url.includes("/api/buyer/products")) return Promise.resolve({ data: [] });
    return Promise.reject({ response: { status: 404 } });
  });
  axios.post.mockResolvedValueOnce({ data: buyerProfile });
  window.history.pushState({}, "", "/login/buyer");
  render(<App />);

  fireEvent.change(await screen.findByPlaceholderText("Enter your email"), {
    target: { value: "buyer@example.com" }
  });
  fireEvent.change(screen.getByPlaceholderText("Enter your password"), {
    target: { value: "password123" }
  });
  fireEvent.click(screen.getByRole("button", { name: "Login" }));

  expect(
    await screen.findByRole("heading", { name: "Complete your Buyer profile" })
  ).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Full Name"), {
    target: { value: "Buyer Recovery" }
  });
  fireEvent.change(screen.getByLabelText("Phone Number"), {
    target: { value: "1234567890" }
  });
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Complete Buyer Profile" }));

  expect(
    await screen.findByRole("heading", { name: "Welcome, Buyer Recovery!" })
  ).toBeInTheDocument();
  expect(axios.post).toHaveBeenCalledWith(
    expect.stringContaining("/api/buyer"),
    expect.objectContaining({
      uid: "buyer-uid",
      email: "buyer@example.com",
      name: "Buyer Recovery",
      phone: "1234567890",
      genuineBuyerConfirmed: true
    }),
    expect.objectContaining({
      headers: { Authorization: "Bearer buyer-token" }
    })
  );
});

test("Buyer login sends a Firebase password reset email", async () => {
  sendPasswordResetEmail.mockResolvedValueOnce(undefined);
  window.history.pushState({}, "", "/login/buyer");
  render(<App />);

  fireEvent.change(await screen.findByPlaceholderText("Enter your email"), {
    target: { value: "buyer@example.com" }
  });
  fireEvent.click(screen.getByRole("button", { name: /forgot password/i }));

  expect(
    await screen.findByText(/password reset email sent to buyer@example\.com/i)
  ).toBeInTheDocument();
  expect(sendPasswordResetEmail).toHaveBeenCalledWith(auth, "buyer@example.com");
});

test("Buyer profile uses Buyer details and the Buyer profile API", async () => {
  const buyerProfile = {
    uid: "buyer-uid",
    name: "Buyer Name",
    email: "buyer@example.com",
    phone: "1234567890"
  };
  auth.currentUser = {
    uid: "buyer-uid",
    email: "buyer@example.com",
    emailVerified: true,
    getIdToken: jest.fn().mockResolvedValue("buyer-token")
  };
  axios.get.mockImplementation((url) => (
    url.includes("/api/buyer/me")
      ? Promise.resolve({ data: buyerProfile })
      : Promise.reject({ response: { status: 404 } })
  ));
  axios.put.mockResolvedValueOnce({
    data: { ...buyerProfile, name: "Updated Buyer", phone: "0987654321" }
  });
  window.history.pushState({}, "", "/profile");
  render(<App />);

  expect(
    await screen.findByRole("heading", { name: "My Buyer Profile" })
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Edit Profile" }));
  fireEvent.change(screen.getByLabelText("Full Name"), {
    target: { value: "Updated Buyer" }
  });
  fireEvent.change(screen.getByLabelText("Phone Number"), {
    target: { value: "0987654321" }
  });
  fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

  await waitFor(() => {
    expect(axios.put).toHaveBeenCalledWith(
      expect.stringContaining("/api/buyer/me"),
      { name: "Updated Buyer", phone: "0987654321" },
      expect.objectContaining({
        headers: { Authorization: "Bearer buyer-token" }
      })
    );
  });
});

test("Buyer catalogue filters farmer products and shows farmer contact details", async () => {
  const buyerProfile = {
    uid: "buyer-uid",
    name: "Buyer Name",
    email: "buyer@example.com",
    phone: "1234567890"
  };
  const products = [
    {
      _id: "mosambi-id",
      productName: "Mosambi",
      quantity: 100,
      quantityUnit: "kg",
      location: "Village A",
      village: "Village A",
      town: "Town A",
      district: "District A",
      state: "State A",
      country: "India",
      pincode: "111111",
      price: 120,
      priceUnit: "kg",
      totalPrice: 12000
    },
    {
      _id: "banana-id",
      productName: "Banana",
      quantity: 50,
      quantityUnit: "kg",
      location: "Village B",
      village: "Village B",
      town: "Town B",
      district: "District B",
      state: "State B",
      country: "India",
      pincode: "222222",
      price: 60,
      priceUnit: "kg",
      totalPrice: 3000
    }
  ];
  auth.currentUser = {
    uid: "buyer-uid",
    email: "buyer@example.com",
    emailVerified: true,
    getIdToken: jest.fn().mockResolvedValue("buyer-token")
  };
  axios.get.mockImplementation((url) => {
    if (url.includes("/api/buyer/me")) return Promise.resolve({ data: buyerProfile });
    if (url.includes("/api/buyer/products/banana-id")) {
      return Promise.resolve({
        data: {
          ...products[1],
          farmer: { name: "Farmer Name", phone: "9876543210" }
        }
      });
    }
    if (url.includes("/api/buyer/products")) return Promise.resolve({ data: products });
    return Promise.reject({ response: { status: 404 } });
  });
  window.history.pushState({}, "", "/dashboard/buyer");
  render(<App />);

  expect(await screen.findByRole("heading", { name: "Mosambi" })).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Product"), {
    target: { value: "Banana" }
  });
  expect(screen.queryByRole("heading", { name: "Mosambi" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "View farmer details" }));

  expect(await screen.findByText("Farmer Name")).toBeInTheDocument();
  expect(screen.getByText("9876543210")).toHaveAttribute(
    "href",
    "tel:9876543210"
  );
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
  axios.get.mockImplementation((url) => {
    if (url.includes("/api/buyer/me")) {
      return Promise.reject({ response: { status: 404 } });
    }
    return Promise.resolve({
      data: url.includes("/api/products/me")
        ? []
        : {
            uid: "legacy-firebase-uid",
            name: "Farmer Name",
            email: "signed-in@example.com",
            phone: "1234567890"
          }
    });
  });
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
    url.includes("/api/buyer/me")
      ? Promise.reject({ response: { status: 404 } })
      : url.includes("/api/products/me")
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
    await screen.findByText(/this account is registered as a farmer/i)
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

  fireEvent.click(screen.getByRole("button", { name: /i've verified my new email/i }));
  expect(
    await screen.findByText(/previous email remains linked until then/i)
  ).toBeInTheDocument();
  expect(axios.put).toHaveBeenCalledTimes(1);

  auth.currentUser.email = "new@example.com";
  axios.put.mockResolvedValueOnce({
    data: {
      uid: "farmer-uid",
      name: "Updated Farmer",
      email: "new@example.com",
      phone: "0987654321"
    }
  });
  await waitFor(() => {
    expect(
      screen.getByRole("button", { name: /i've verified my new email/i })
    ).toBeEnabled();
  });
  fireEvent.click(screen.getByRole("button", { name: /i've verified my new email/i }));

  expect(
    await screen.findByText(/updated in firebase and synced to your farmer profile/i)
  ).toBeInTheDocument();
  expect(screen.getByText("new@example.com")).toBeInTheDocument();
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
