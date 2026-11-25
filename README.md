# Export Maal

Export Maal is an early-stage marketplace project intended to connect farmers
directly with buyers and exporters. The goal is to reduce unnecessary
intermediaries, give farmers a place to present their produce, and make direct
trade easier to explore.

## Current status

The project currently contains a React web app and an Express/MongoDB API.
Firebase Authentication is used for email/password sign-in.

Implemented:

- Public landing, mission, team, contact, and product information pages.
- A site-wide green header with the Export-Maal brand and account menu.
- Signed-out account menu links for farmer and buyer login; signed-in menu links
  to My Profile and provides logout.
- Shared footer navigation on all application routes.
- A short loading animation during in-app route changes.
- Farmer account registration with Firebase email verification and a MongoDB
  farmer profile.
- A protected farmer dashboard and farmer-only profile page showing the
  registered name, email, phone number, and email verification status.
- Farmer profile editing for name and phone. Changing the email sends a Firebase
  verification link; Firebase keeps the previous address until that link is
  completed, then the profile syncs the verified address to MongoDB.
- Farmer product cards with add, edit, and confirmed delete actions. Product
  details are saved in MongoDB and scoped to the signed-in farmer.
- Product quantity units (kg, quintal, tonne), INR price per kg or tonne, and a
  calculated total value.
- Buyer registration with the same name, phone, email, and password fields as
  Farmer registration, plus a required genuine-buyer declaration.
- Buyer profile records in MongoDB, including the declaration acceptance and
  server-recorded timestamp. Registration sends Firebase email verification.
- Buyer sign-in, a protected product catalogue with product/location/price
  filters, and farmer contact details on each listing.
- Buyer login includes Firebase password reset and profile completion for a
  verified Buyer account whose MongoDB profile is missing.
- Buyer profile editing and logout using the shared account menu.
- Firebase ID-token protected API endpoints for farmer profiles and products.
- Farmer registration directs duplicate Firebase emails to Farmer sign-in.
  Buyer registration requires an email not currently assigned to a Firebase
  account; an old Farmer database record alone does not reserve it.

Still planned:

- Product image uploads (the dashboard currently labels this as coming soon).
- Orders, payments, and delivery features.

The farmer dashboard supports product listing management. Photo uploads,
orders, payments, and delivery workflows are not implemented yet.

## Authentication notes

Farmer and Buyer are separate account types with separate MongoDB collections.
Firebase Email/Password sign-in permits one active account per email. Buyer
registration creates a distinct Firebase account and profile; it is blocked if
that Firebase UID already has a Farmer profile. An old Farmer record in MongoDB
does not by itself mean Firebase still has that email or prevent a distinct
Buyer account from registering. Registration sends an email-verification
message and saves the Buyer profile and declaration acceptance to MongoDB.

A Buyer profile requires the applicant to confirm that they are a genuine
buyer. The API independently enforces this confirmation and stores its
acceptance timestamp and declaration version. A verified email is required to
access protected account features. Farmer profile retrieval uses the verified
account UID and may reconnect an older Farmer record by email when the UID is
not already registered as a Buyer.

The backend verifies Firebase ID tokens with the Firebase Admin SDK. Profile
reads and edits require a verified email, and profile creation only accepts
details matching the signed-in Firebase account. Configure Firebase Admin
credentials and the MongoDB Atlas connection string for the backend before
using registration.

## Pages and routes

| Route | Page |
| --- | --- |
| `/` | Landing page |
| `/login/farmer` | Farmer sign-in |
| `/register/farmer` | Farmer registration |
| `/dashboard/farmer` | Protected farmer dashboard |
| `/login/buyer` | Buyer sign-in |
| `/register/buyer` | Buyer registration and declaration |
| `/dashboard/buyer` | Protected Buyer product catalogue |
| `/profile` | Protected Farmer or Buyer profile with view/edit controls |
| `/about` | Mission |
| `/how-it-works` | Farmer product listing flow |
| `/team` | Founder profile |
| `/contact` | Contact information |
| `/privacy` | Prototype privacy overview |
| `/terms` | Preliminary terms of use |
| `/data-protection` | Prototype data overview |
| `/careers` | Careers information |
| `/internships` | Internship information |
| `/partnerships` | Partnership information |

The privacy, terms, and data-protection pages are preliminary product
information, not finalized legal policies.

## Tech stack

### Frontend

- React 19 and Create React App (`react-scripts`)
- React Router 7
- Firebase Authentication
- Axios
- Tailwind CSS

### Backend

- Node.js and Express 5
- MongoDB with Mongoose
- `dotenv` for environment variables
- CORS enabled for API requests

## Run locally

### 1. Configure Firebase

Set the Firebase web app configuration in [`src/firebase.js`](src/firebase.js)
to values from your Firebase project. Enable Email/Password sign-in in Firebase
Authentication.

### 2. Start the frontend

From the project root:

```bash
npm install
npm start
```

The app runs at [http://localhost:3000](http://localhost:3000).

The frontend uses `http://localhost:5000` as its default API URL. To use another
backend URL, set `REACT_APP_API_URL` in a local root `.env.local` file, for
example:

```text
REACT_APP_API_URL=http://localhost:5000
```

### 3. Start the backend

In another terminal:

```bash
cd server
npm install
```

Provide a MongoDB connection string and, optionally, a port. You can export
environment variables in the terminal. Firebase Admin also needs Application
Default Credentials; for local development, set `GOOGLE_APPLICATION_CREDENTIALS`
to a Firebase service-account JSON file stored outside the repository:

```bash
export MONGO_URI="your-mongodb-connection-string"
export PORT=5000
export FIREBASE_PROJECT_ID="export-maal"
export GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/to/service-account.json"
node server.js
```

The API listens on port `5000` by default. Alternatively, `dotenv` loads
variables from a local `server/.env` file. Never commit real connection strings
or service-account credentials.

The service-account file must belong to the Firebase project used by the
frontend (`export-maal` by default). Keep it outside the repository and grant
it only the access required for Firebase Admin Authentication. Set
`FIREBASE_PROJECT_ID` to the same project ID as `src/firebase.js`.

## API

The backend mounts farmer routes at `/api/farmer`.

### Create a farmer profile

`POST /api/farmer`

Requires an `Authorization: Bearer <Firebase-ID-token>` header. During initial
registration, the profile UID and email must match the authenticated Firebase
user. This endpoint allows an unverified account to create its initial profile;
email verification is required before reading or editing it.

Required JSON fields:

```json
{
  "uid": "firebase-user-id",
  "name": "Farmer name",
  "email": "farmer@example.com",
  "phone": "phone-number"
}
```

Returns the created profile with HTTP `201`. Missing required values return
`400`; duplicate UID/email returns `409`.

### Retrieve the signed-in farmer profile

`GET /api/farmer/me`

Requires a valid Firebase token and a verified email. Returns the signed-in
farmer's profile, or `404` when no profile exists.

### Update a farmer profile

`PUT /api/farmer/me`

Requires a valid Firebase token and a verified email. The request body accepts
`name` and `phone`; the email is taken from the verified Firebase token rather
than trusted from the request body. The frontend sends an email verification
link before requesting an email change. Firebase retains the previous address
until the link is completed; after confirmation, the profile page refreshes
Firebase and synchronizes the new address to MongoDB.

`PUT /api/farmer/:uid` is the frontend's UID-based update route and accepts
only the authenticated farmer's own UID. `GET /api/farmer/:uid` is also
available for that verified farmer; requests for another UID are rejected.

### Farmer products

The following endpoints require a valid Firebase token, a verified email, and
an existing farmer profile:

- `GET /api/products/me` — list the signed-in farmer's products.
- `POST /api/products` — add a product.
- `PUT /api/products/:productId` — edit the signed-in farmer's product.
- `DELETE /api/products/:productId` — delete the signed-in farmer's product.

Products support Mosambi, Banana, Chilli, and Brinjal. Each record stores the
expected quantity (kg, quintal, or tonne), location details, pincode, INR price
per kg or tonne, and a server-calculated total. A quintal is treated as 100 kg
and a tonne as 1,000 kg. Product ownership is associated with the verified
farmer email and Firebase UID. Image uploads are not yet available.

Product requests accept `productName`, `quantity`, `quantityUnit`, `location`,
`village`, `town`, `district`, `state`, `country`, `pincode`, `price`, and
`priceUnit`. The API derives ownership from the verified Firebase token and
calculates `totalPrice`; clients cannot assign a product to another farmer.

### Buyer registration

`POST /api/buyer` creates a Buyer profile in the same MongoDB database
configured by `MONGO_URI`. It requires a Firebase ID token and accepts `uid`,
`name`, `email`, `phone`, and `genuineBuyerConfirmed: true`. The UID and email
must match the Firebase token. The API rejects missing declaration acceptance,
duplicate profiles and Firebase UIDs already registered as Farmers.
MongoDB stores `genuineBuyerConfirmed`, `genuineBuyerConfirmedAt`, and a
declaration-version identifier alongside the Buyer contact details. Email
verification is sent by Firebase during registration; the profile is saved
before the user completes verification, as with Farmer registration.

Buyer profile and marketplace endpoints require a valid Firebase token, a
verified email, and a Buyer profile for the signed-in UID:

- `GET /api/buyer/me` — retrieve the signed-in Buyer profile.
- `PUT /api/buyer/me` — update the Buyer name and phone; email comes from the
  verified Firebase token.
- `GET /api/buyer/products` — list Farmer product listings without exposing
  farmer contact details in the catalogue response.
- `GET /api/buyer/products/:productId` — retrieve a listing with the Farmer's
  name and phone number.

## Tests and production build

Run the frontend tests once:

```bash
CI=true npm test -- --watchAll=false --runInBand
```

Create an optimized frontend build:

```bash
npm run build
```

The backend package does not currently have an implemented test suite.

## Project layout

```text
public/                  Static HTML, manifest, favicon, and robots file
server/
  middleware/firebaseAuth.js  Firebase ID-token and email verification
  models/Buyer.js       MongoDB buyer profile and declaration schema
  models/Farmer.js       MongoDB farmer profile schema
  models/Product.js      MongoDB farmer product schema
  routes/buyer.js        Buyer registration, profile, and marketplace APIs
  routes/farmer.js       Farmer profile API routes
  routes/product.js      Farmer product API routes
  utils/findBuyerForUser.js  Looks up Buyer by UID or verified email
  utils/findFarmerForUser.js  Looks up farmer by Firebase UID or verified email
  utils/productPricing.js     Converts listed quantity to total price
  server.js              Express app, middleware, MongoDB connection
src/
  App.js                 Routes, authentication guards, shared footer, loader
  pages/BuyerDashboard.js    Buyer marketplace and product filters
  pages/BuyerLogin.js        Buyer sign-in and password reset
  pages/BuyerProfileSetup.js Recover a missing Buyer profile
  firebase.js            Firebase app and Authentication setup
  components/
    Footer.js            Site-wide footer navigation
    Header.js            Site-wide brand and account menu
    PageLoading.js       Loading indicator for routing/auth checks
    ProductFormModal.js  Add/edit product form
  pages/                 Landing, farmer auth, dashboards, profile, and info pages
  index.js               React application entry point
```

## Deployment notes

The root `package.json` includes `predeploy` and `deploy` scripts for publishing
the frontend build with `gh-pages`. Configure the production API URL, Firebase
project settings, Firebase authorized domains, and backend CORS for the
deployment environment. Because the app uses `BrowserRouter`, the production
host should serve `index.html` as a fallback for application routes.
