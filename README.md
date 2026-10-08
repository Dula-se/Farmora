# Farmora 🌱🌾
> **Direct B2B & B2C Digital Agricultural Marketplace and Supply Chain Platform**

Farmora is a modern mobile platform connecting Sri Lankan farmers directly with wholesale buyers (restaurants, supermarkets, exporters) and individual consumers. By eliminating predatory intermediaries, Farmora guarantees fair prices for agricultural producers and fresh, traceable produce for buyers.

---

## 📌 Table of Contents
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#1-backend-setup)
  - [Mobile App Setup](#2-mobile-app-setup-expo)
- [Environment Variables](#-environment-variables)
- [Payment Integration](#-payment-integration)
- [Order & Delivery Security PIN Workflow](#-order--delivery-security-pin-workflow)
- [Contributing & License](#-contributing--license)

---

## 🚀 Key Features

### 👨‍🌾 For Farmers
- **Produce Listings & Inventory**: List fresh harvests with rich photos, batch quantities, unit pricing (LKR/kg), grade, and location.
- **Harvest Scheduling & Pre-Orders**: Schedule future harvests so commercial buyers can pre-order crops before they are harvested.
- **Live Produce Auctions**: Launch timed auctions for high-demand produce lots with real-time bidding.
- **Order Management & PIN Verification**: Track incoming orders, prepare shipments, and confirm handoff securely using the Buyer's unique 4-digit Delivery PIN.
- **Farmer Analytics & Earnings**: Monitor revenue, active orders, customer reviews, and fulfillment rates.
- **Smart Agriculture Tools**: Crop health insights, regional market price index, and weather forecasts.

### 🛒 For Buyers (Retail, Restaurants, Supermarkets, Exporters)
- **Direct Fresh Market**: Search, filter, and sort produce by Sri Lankan district, category (Vegetables, Fruits, Grains, Spices), and harvest date.
- **Commercial & Wholesale Bulk Orders**: Place large-scale orders with tailored discounts and scheduling.
- **Stripe Card Payments & Escrow**: Instant in-app credit/debit card processing backed by Stripe, plus Cash on Delivery support.
- **Order Tracking & Secure Delivery PIN**: Track live order progression (Pending ➔ Confirmed ➔ Dispatched ➔ Delivered) with instant delivery verification.
- **Direct Communication**: Built-in chat and call interfaces between buyers and growers.
- **Multi-lingual Interface**: Localized experience tailored for Sri Lanka (English, Sinhala, and Tamil).

---

## 🏗️ System Architecture

```text
┌────────────────────────────────────────────────────────┐
│               Farmora Mobile Application               │
│         (Expo SDK 54 / React Native 0.86 / TS)          │
└───────────────────────────┬────────────────────────────┘
                            │ REST API / JSON
                            ▼
┌────────────────────────────────────────────────────────┐
│                 Farmora Express API                    │
│             (Node.js / Express / TypeScript)           │
├─────────────────┬───────────────────┬──────────────────┤
│  MongoDB Atlas  │   Stripe API      │  Cloud Storage   │
│  (Data Models)  │ (Card Processing) │ (Azure / Local)  │
└─────────────────┴───────────────────┴──────────────────┘
```

---

## 🛠️ Tech Stack

### Mobile Frontend
- **Framework**: [Expo SDK 54](https://docs.expo.dev/) / React Native 0.86 (Hermes Engine)
- **Language**: TypeScript
- **Navigation**: Expo Router (File-based navigation)
- **Styling & UI**: React Native StyleSheet, React Native Reanimated, SVG Icons, Linear Gradients
- **Authentication**: JWT, Google Sign-In, Firebase Auth integration
- **State & Storage**: React Context + `@react-native-async-storage/async-storage`

### Backend Services
- **Runtime**: Node.js v18+ / v20+
- **Framework**: Express.js with TypeScript (`tsx` watch server)
- **Database**: MongoDB with Mongoose ODM
- **Payments**: Stripe API SDK (`stripe`)
- **Security**: Helmet, CORS, bcryptjs, JSON Web Tokens (JWT), Zod validations
- **File Uploads**: Multer with Azure Blob Storage / Local Disk Storage fallback

---

## 📁 Project Structure

```text
famora/
├── app/                         # Expo Router application routes
│   ├── (auth)/                  # Authentication route group
│   ├── (tabs)/                  # Main application tab screens
│   ├── buyer/                   # Buyer-specific screens
│   └── farmer/                  # Farmer-specific screens
├── backend/                     # Express.js REST API
│   ├── src/
│   │   ├── config/              # DB connection, Stripe & environment configs
│   │   ├── controllers/         # Auth, Orders, Products, Payments, Chat controllers
│   │   ├── middlewares/         # JWT auth, error handling, file upload middlewares
│   │   ├── models/              # Mongoose schemas (User, Product, Order, Auction, etc.)
│   │   ├── routes/              # Express API route declarations
│   │   └── server.ts            # Entry point for backend HTTP server
│   ├── .env.example             # Example backend environment variables
│   └── package.json
├── src/                         # Shared Mobile Frontend Source
│   ├── components/              # Reusable UI components (Buttons, Inputs, Cards, Modals)
│   ├── context/                 # AuthContext, CartContext, ThemeContext
│   ├── data/                    # Static reference data (districts, crop categories)
│   ├── hooks/                   # Custom hooks (notifications, storage, orders)
│   ├── screens/
│   │   ├── auth/                # Login, Registration, OTP, Forgot Password
│   │   ├── buyer/               # Marketplace, Product Details, Cart, Checkout, Orders
│   │   └── farmer/              # Dashboard, Add Product, Harvests, Farmer Orders
│   ├── services/                # API client, Order service, Stripe service, Harvest service
│   └── types/                   # TypeScript interfaces and contracts
├── app.json                     # Expo configuration manifest
├── package.json                 # Mobile app dependencies and scripts
└── tsconfig.json
```

---

## ⚡ Getting Started

### Prerequisites
Make sure you have installed on your development machine:
- [Node.js](https://nodejs.org/) (v18.x or v20.x LTS)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Git](https://git-scm.com/)
- **For Android Development**: Android Studio, Android SDK, and configured ADB platform tools (or an Android device with USB Debugging enabled).
- **For Quick Testing**: [Expo Go](https://expo.dev/go) app installed on your physical smartphone.

---

### 1. Backend Setup

1. Open a terminal and navigate to the `backend/` directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure your environment variables:
   ```bash
   cp .env.example .env
   ```
   *(On Windows PowerShell: `Copy-Item .env.example .env`)*

   Open `.env` and fill in your MongoDB URI, JWT secret, and Stripe test keys.

4. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend will start and listen on port **5001** (or the port defined in `.env`).

---

### 2. Mobile App Setup (Expo)

1. Open a new terminal at the project root (`famora/`):
   ```bash
   npm install
   ```

2. Ensure your backend connection URL is properly configured in [`src/services/api.ts`](file:///d:/famora/src/services/api.ts) or in a `.env` file:
   - For Android Emulator: `http://10.0.2.2:5001/api`
   - For Physical Device: `http://<YOUR_LOCAL_MACHINE_IP>:5001/api`
   - Hosted Cloud Backend: `https://farmora-ten.vercel.app/api`

3. Run the development build on Android:
   ```bash
   npx expo run:android
   ```
   *Or start the Expo bundler for Expo Go:*
   ```bash
   npm start
   ```

4. Press `a` in the terminal to open on an Android emulator, or scan the QR code with Expo Go.

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | Backend listening port | `5001` |
| `NODE_ENV` | Environment mode | `development` |
| `MONGODB_URI` | MongoDB connection URI | `mongodb+srv://...` |
| `JWT_SECRET` | Secret key used for signing JWT tokens | `your_secure_jwt_secret` |
| `STRIPE_SECRET_KEY` | Stripe secret API key for card charge processing | `sk_test_...` |
| `STORAGE_PROVIDER` | Upload driver (`local`, `azure`, `cloudinary`, `s3`) | `local` |
| `CLIENT_URL` | Allowed frontend origin for CORS | `http://localhost:8081` |

### Frontend (`.env` or `app.json`)

| Variable | Description |
| :--- | :--- |
| `EXPO_PUBLIC_API_BASE_URL` | Base endpoint for the backend API |
| `EXPO_PUBLIC_UPLOADS_BASE_URL` | Base URL for uploaded images |

---

## 💳 Payment Integration

Farmora features an integrated Stripe card payment gateway:
- **Card Input Validation**: Clean custom card inputs (Card Number, Expiry MM/YY, 3-digit CVC, Name on Card) with real-time formatting.
- **Server-Side Tokenization**: Eliminates publishable key tokenization restrictions by directly processing charges securely via backend endpoints.
- **Celebration Feedback**: Displays an interactive animated checkmark with payment confirmation before navigating to the live order summary.
- **Cash on Delivery**: Provides full support for traditional COD fulfillment.

---

## 🔐 Order & Delivery Security PIN Workflow

To prevent delivery fraud and guarantee that produce reaches the correct recipient:
1. When a Buyer completes checkout, a unique 4-digit **Delivery Security PIN** is generated and tied to the order.
2. The PIN is visible on the **Buyer's Order Details** screen.
3. Upon arrival, the delivery person or farmer requests the PIN from the Buyer.
4. The Farmer taps **Track & PIN** on the order screen and submits the 4-digit PIN.
5. The system validates the PIN, unlocks payment disbursement from escrow, and transitions the status to **Delivered**.

---

## 📜 Available Scripts

### Root (Frontend)
- `npm start` – Start the Expo development server.
- `npm run android` / `npx expo run:android` – Compile and launch the native Android development build.
- `npm run ios` – Run on iOS simulator (requires macOS).
- `npm run lint` – Run Expo linter.

### Backend (`backend/`)
- `npm run dev` – Launch TypeScript backend in watch mode with `tsx`.
- `npm run build` – Compile TypeScript into `dist/` directory.
- `npm start` – Run production build from `dist/server.js`.
- `npm run lint` – Run TypeScript type checking.

---

## 👥 Authors & Acknowledgments

- **Farmora Development Team**
- Built for the Sri Lankan agricultural ecosystem to empower rural farmers and simplify wholesale fresh food supply chains.
