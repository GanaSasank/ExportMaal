import React from "react";
import { Link } from "react-router-dom";

const email = "ganasasankforit@gmail.com";

const pages = {
  "how-it-works": {
    title: "How It Works",
    sections: [
      {
        title: "A direct route from farm to buyer",
        text: "Export Maal is being built to help farmers present their produce directly to buyers and exporters, reducing reliance on multiple intermediaries and making the available offer easier to understand.",
      },
      {
        title: "Farmers share what they grow",
        text: "Signed-in farmers can add as many Mosambi, Banana, Chilli, or Brinjal listings as they need. Each listing includes expected quantity, location details, and an INR price per kg or tonne, and can be edited or deleted from the farmer dashboard.",
      },
      {
        title: "Buyers discover and connect",
        text: "Verified Buyers can browse Farmer listings, filter by product, estimated total, and location, then open a listing to view the Farmer's name and phone number. Product image uploads are coming soon.",
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    notice: "This page describes the current prototype and is not a substitute for a complete legal privacy policy.",
    sections: [
      {
        title: "Information collected today",
        text: "Farmer and Buyer registration ask for a name, email address, and phone number. Buyer registration also stores the genuine-buyer declaration. The app uses Firebase Authentication to create and sign in accounts, and saves each role's profile in its separate MongoDB collection.",
      },
      {
        title: "Product information",
        text: "Farmers can save product names, quantities, expected prices, and location details in MongoDB. Product image upload is not yet available.",
      },
      {
        title: "Questions or requests",
        text: `For privacy questions or requests concerning your information, contact ${email}.`,
      },
    ],
  },
  terms: {
    title: "Terms of Use",
    notice: "These are preliminary terms for an early-stage prototype. Complete terms should be reviewed and published before commercial use.",
    sections: [
      {
        title: "Prototype service",
        text: "Export Maal is under development. Features, availability, and information shown in the app may change. Farmers can create and manage product listings, and verified Buyers can browse them and contact Farmers. Orders, payments, and delivery arrangements are not yet available.",
      },
      {
        title: "Account information",
        text: "Users are responsible for providing accurate information when creating an account and for keeping their sign-in credentials private. Do not submit confidential or sensitive information through prototype features.",
      },
      {
        title: "Direct discussions",
        text: "Farmers and Buyers are responsible for verifying product details and agreeing on prices, quantities, delivery, and payment directly. Export Maal does not currently process transactions.",
      },
    ],
  },
  "data-protection": {
    title: "Data Protection",
    notice: "This overview reflects the current prototype and will need to be expanded as the product and its data practices evolve.",
    sections: [
      {
        title: "Account and profile data",
        text: "Firebase Authentication handles account credentials. The app sends the Firebase user ID, name, email, and phone number to the backend for the farmer profile. The backend currently stores these profile fields in MongoDB.",
      },
      {
        title: "Use only the current features",
        text: "Product names, quantities, prices, and location details are saved for farmer listings. Product photos are not collected because image uploads are not yet available. Avoid entering sensitive information into the app.",
      },
      {
        title: "Contact",
        text: `For questions about your information, email ${email}.`,
      },
    ],
  },
  careers: {
    title: "Join Us",
    sections: [
      {
        title: "Help build a more direct marketplace",
        text: "Export Maal is an early-stage project focused on connecting farmers with buyers and exporters. We welcome conversations with people interested in agriculture, product development, design, operations, and logistics.",
      },
      {
        title: "Current opportunities",
        text: "There are no specific job openings listed at this time. To introduce yourself, share your area of interest and relevant experience by email.",
      },
    ],
  },
  internships: {
    title: "Internships",
    sections: [
      {
        title: "Learn by contributing",
        text: "As the project develops, internship work may involve web development, user experience, agriculture research, or marketplace operations.",
      },
      {
        title: "Availability",
        text: "No internship positions are currently open. Students interested in future opportunities can email a short introduction, their area of interest, and availability.",
      },
    ],
  },
  partnerships: {
    title: "Partner with Us",
    sections: [
      {
        title: "Who we hope to work with",
        text: "We are interested in connecting with farmers, farmer groups, buyers, exporters, and organizations working in agriculture and supply chains.",
      },
      {
        title: "Start a conversation",
        text: "If you would like to explore how a more direct connection between producers and buyers could work for your organization, email us with a brief description of your work and the kind of partnership you have in mind.",
      },
    ],
  },
};

const FooterInfoPage = ({ page }) => {
  const content = pages[page];

  if (!content) {
    return (
      <main className="min-h-screen bg-green-50 p-10">
        <h1 className="text-3xl font-bold text-green-900">Page not found</h1>
        <Link to="/" className="mt-4 inline-block text-green-800 underline">
          Return home
        </Link>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-green-50">
      <main className="mx-auto w-full max-w-4xl flex-grow p-10">
        <h1 className="mb-6 text-3xl font-bold text-green-900">{content.title}</h1>
        {content.notice && (
          <p className="mb-6 rounded-lg border border-green-200 bg-white p-4 text-sm text-gray-700">
            {content.notice}
          </p>
        )}
        <div className="space-y-6 text-gray-700">
          {content.sections.map((section) => (
            <section key={section.title}>
              <h2 className="mb-2 text-xl font-semibold text-green-900">
                {section.title}
              </h2>
              <p>{section.text}</p>
            </section>
          ))}
        </div>
        <p className="mt-8 text-gray-700">
          Questions?{" "}
          <Link to="/contact" className="text-green-800 underline">
            Contact us
          </Link>
          .
        </p>
      </main>
    </div>
  );
};

export default FooterInfoPage;
