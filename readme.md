# KRAY: E-Commerce Clothing Platform

KRAY is a full-stack clothing e-commerce web application focused on a clean shopping experience and straightforward product discovery. The project combines a React storefront with a Node.js/Express API and MongoDB-backed data.

> **Project status:** Under active development. Some integrations and flows may require configuration or further testing before production use.

## Highlights

- Browse clothing products and view individual product details
- Explore collections and new arrivals
- Search, filter, and sort product listings
- Ask the Gemini-powered KRAY shopping assistant for product and outfit suggestions
- Upload a photo for AI-generated clothing and color-coordination suggestions
- Manage a shopping cart and proceed through checkout
- Register, sign in, and access protected account pages
- View order history and order details
- Admin interfaces for managing products, users, and orders
- Store product images using Cloudinary
- Backend payment routes for Razorpay integration
- Responsive React interface with Redux Toolkit for shared application state

_Feature availability depends on the current configuration and implementation. Payment processing, deployment, and admin permissions should be tested in the target environment before real-world use._

## Tech Stack

| Area                    | Technologies                    |
| ----------------------- | ------------------------------- |
| Frontend                | React, Vite, React Router       |
| Styling                 | Tailwind CSS                    |
| State management        | Redux Toolkit, React Redux      |
| API requests            | Axios                           |
| Notifications and icons | Sonner, React Icons             |
| Backend                 | Node.js, Express                |
| Database                | MongoDB, Mongoose               |
| AI shopping assistant   | Google Gemini API, `@google/genai` |
| Photo uploads           | Multer in-memory processing     |
| Authentication          | JSON Web Tokens (JWT), bcryptjs |
| Image storage           | Cloudinary, Multer              |
| Payments                | Razorpay (backend integration)  |

## Repository Structure

```text
KRAY/
├── frontend/
│   ├── src/components/Common/ShoppingAssistant.jsx  # Chat UI, product cards, photo upload
│   ├── src/pages/                                   # Storefront and account pages
│   ├── src/redux/                                   # Shared application state
│   ├── .env.example                                 # Public API URL example
│   └── vercel.json                                  # Vite build and SPA routing
└── backend/
    ├── routes/shoppingAssistantRoutes.js             # Gemini assistant API
    ├── models/Product.js                             # Product catalog for recommendations
    ├── config/db.js                                   # Cached MongoDB connection
    ├── .env.example                                   # Server configuration template
    └── vercel.json                                    # Express deployment configuration
```

The frontend contains pages, reusable UI components, Redux slices, and utilities. The backend contains API routes, authentication middleware, database configuration, and Mongoose models.

## AI Shopping Assistant

The floating **Ask KRAY** chat helps shoppers find products using natural-language requests about style, occasion, budget, colors, and available items. The backend fetches in-stock products from MongoDB and gives Gemini current catalog details, so recommendations can include product cards that link to KRAY product pages.

Shoppers can attach a JPG, PNG, or WebP photo (up to 5 MB before browser compression) and ask for outfit or color-coordination suggestions. The browser resizes the image, and the API accepts a compressed upload up to 3 MB. KRAY processes the photo in memory and sends it to Gemini with the message; KRAY does not save the uploaded photo. The assistant is a style helper, not a sizing or body-measurement service.

The integration uses Google's `@google/genai` SDK on the server. Set `GEMINI_API_KEY` in `backend/.env`; optional `GEMINI_MODEL`, `GEMINI_FALLBACK_MODEL`, and `GEMINI_LAST_RESORT_MODEL` values control the model fallback chain. Keep the key on the server and out of all `VITE_` variables.

## Getting Started

### Requirements

- Node.js and npm
- A MongoDB database (local MongoDB or MongoDB Atlas)
- Cloudinary credentials if image upload is required
- Razorpay test credentials if testing the payment flow

### 1. Clone the repository

```bash
git clone https://github.com/devanshu1513/KRAY.git
cd KRAY
```

### 2. Configure the backend

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:

```env
PORT=9000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=replace_with_a_long_random_secret
CORS_ORIGINS=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_SECRET=your_razorpay_secret
GEMINI_API_KEY=your_google_ai_studio_api_key
# Optional; defaults to gemini-3.5-flash-lite
GEMINI_MODEL=gemini-3.5-flash-lite
# Used automatically if the primary model is busy or rate limited
GEMINI_FALLBACK_MODEL=gemini-3.7-flash
# Final fallback for temporary model capacity errors
GEMINI_LAST_RESORT_MODEL=gemini-3.8-flash
```

Use your own credentials. Never commit `.env` files, database credentials, API secrets, or live payment keys to GitHub.

Start the backend development server:

```bash
npm run dev
```

The API uses port `9000` by default when `PORT` is set to `9000`.

### 3. Configure the frontend

Open a second terminal from the repository root:

```bash
cd frontend
npm install
```

Create `frontend/.env` (or `frontend/.env.local`) and set the API base URL, including `/api`:

```env
VITE_BACKEND_URL=http://localhost:9000/api
```

Only public configuration belongs in variables prefixed with `VITE_`. Do not put database passwords, JWT secrets, Cloudinary secrets, or Razorpay secret keys in the frontend environment.

Start the frontend:

```bash
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## Deploying on Vercel

KRAY is a monorepo with a static React storefront and an Express API. Deploy it as two Vercel projects from the same GitHub repository:

1. Create the API project with **Root Directory** set to `backend`. Vercel detects the Express app from `server.js`.
2. Add the backend environment variables from `backend/.env.example` in the Vercel project settings. `MONGO_URI` and `JWT_SECRET` are required. Add Gemini, Razorpay, and Cloudinary values for those features.
3. Deploy the API and copy its deployment origin, for example `https://kray-api.example.vercel.app`.
4. Create the storefront project from the same repository with **Root Directory** set to `frontend`.
5. Set `VITE_BACKEND_URL` in the storefront project's Vercel environment variables to the API origin followed by `/api`, for example `https://kray-api.example.vercel.app/api`, then deploy.
6. Set the backend variable `CORS_ORIGINS` to the exact storefront origin, such as `https://kray.example.vercel.app`. Include comma-separated preview origins if needed, then redeploy the API.

The frontend Vercel configuration builds `dist` and serves client-side routes through `index.html`. The backend exports its Express app for Vercel Functions and waits for MongoDB before handling API requests. Both projects require Node.js 24.x. Keep server secrets only in the backend project's environment settings; `VITE_` variables are public in the browser bundle.

## Useful Commands

### Frontend (`frontend/`)

```bash
npm run dev       # Start the Vite development server
npm run build     # Create a production build
npm run preview   # Preview the production build locally
npm run lint      # Run ESLint
```

### Backend (`backend/`)

```bash
npm run dev       # Start the API with Nodemon
npm start         # Start the API with Node.js
npm run seed       # Run the database seeder, if the required seed data is configured
```

## Main API Areas

The backend exposes route groups for the following areas:

| Base path             | Purpose                                    |
| --------------------- | ------------------------------------------ |
| `/api/users`          | User authentication and account operations |
| `/api/products`       | Product browsing                           |
| `/api/cart`           | Cart operations                            |
| `/api/checkout`       | Checkout operations                        |
| `/api/orders`         | Customer order operations                  |
| `/api/payment`        | Payment-related operations                 |
| `/api/upload`         | Image upload operations                    |
| `/api/assistant/chat` | Gemini shopping assistant; accepts a message and optional photo |
| `/api/admin/users`    | Admin user management                      |
| `/api/admin/products` | Admin product management                   |
| `/api/admin/orders`   | Admin order management                     |

Refer to the route implementation for the exact request methods, payloads, and authorization requirements.

## Security Notes

- Keep all secrets in environment variables and out of source control.
- Use Razorpay test mode while developing and testing checkout.
- Validate payment signatures on the server before treating an order as paid.
- Restrict admin endpoints to authorized admin accounts.
- Review CORS settings, input validation, error handling, and deployment configuration before production release.

## Roadmap

- Polish the KRAY visual identity and responsive storefront
- Improve product filtering and selection interactions
- Complete and thoroughly test the checkout and payment flow
- Improve empty, loading, and error states across product pages
- Add deployment documentation and verified live-demo links
- Add genuine project screenshots to this README

## Acknowledgements

KRAY is a clothing storefront developed for this project. Third-party libraries and assets remain subject to their respective licenses.

## Author

**Devanshu Kumar**

- GitHub: [@devanshu1513](https://github.com/devanshu1513)
- LinkedIn: <YOUR_LINKEDIN_PROFILE_URL>

---

If you find a bug or have a suggestion, feel free to open an issue in the repository.
