# 🌾 Famora Backend API

Robust, scalable Node.js + Express + TypeScript backend designed specifically for **Famora** (Direct Farm-to-Market mobile & web platform).

---

## ⚡ Features

- **TypeScript Strict Mode**: Fully typed end-to-end.
- **Role-Based Authentication**: Supports Famora's 5 user roles: `farmer`, `buyer`, `restaurant`, `supermarket`, `exporter`.
- **JWT & Password Security**: Industry-standard `bcryptjs` hashing and `jsonwebtoken` token validation.
- **Mobile OTP Simulation/Verification**: Ready for SMS gateway integration (Dialog Ideamart / Mobitel / Twilio).
- **High-Performance Image Handling**:
  - `Multer` with automatic MIME-type validation (`JPEG`, `PNG`, `WEBP`, `HEIC`, `HEIF`).
  - Categorized disk/cloud storage: `avatars/`, `produce/`, `documents/`.
  - Configurable upload limits (default 5MB).
  - Pluggable storage adapter supporting Local Disk, Cloudinary, AWS S3, or Cloudflare R2.
- **Produce / Crop Marketplace CRUD**: Search by keyword, filter by category (`vegetables`, `fruits`, `grains`, `spices`, `tea`), district, price range.
- **Mobile-First CORS & CORP**: Pre-configured Helmet and CORS headers to ensure Expo Native Image / React Native Web can display uploaded media without header conflicts.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` (already done by default):
```bash
cp .env.example .env
```

### 3. Run Development Server
```bash
npm run dev
```

The server will automatically detect your machine's LAN IP:
```
======================================================
🌾 Famora Backend API is running!
🚀 Local URL:        http://localhost:5001
📱 LAN / Mobile URL: http://192.168.1.50:5001
🩺 Health check:     http://localhost:5001/api/health
📁 Uploads dir:      http://localhost:5001/uploads
📦 Storage provider: local
======================================================
```

> **Note for Mobile Testing**: When testing with Expo Go on a physical phone, replace `localhost` with your machine's **LAN / Mobile URL** (e.g., `http://192.168.1.50:5001/api`).

---

## 🖼️ Image Handling Architecture

Famora features heavy image interactions (farmers photographing fresh harvest, profile avatars, farm registration certificates).

### 1. Upload Endpoints

| Endpoint | Method | Content-Type | Query/Param | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/api/upload/single` | `POST` | `multipart/form-data` | `?folder=produce` (or `avatars`, `documents`) | Upload single image (field: `image` or `file`) |
| `/api/upload/multiple` | `POST` | `multipart/form-data` | `?folder=produce` | Upload up to 8 images (field: `images` or `files`) |
| `/api/upload/:folder/:filename` | `DELETE` | - | Authenticated | Delete uploaded media |
| `/api/users/profile/avatar` | `POST` | `multipart/form-data` | Authenticated | Directly uploads and sets user profile avatar |

### 2. Supported Image Formats
- `image/jpeg` (`.jpg`, `.jpeg`)
- `image/png` (`.png`)
- `image/webp` (`.webp`)
- `image/heic`, `image/heif` (modern iPhone/Android camera formats)
- File size limit: **5 MB** per image (configurable in `.env`)

### 3. Image URLs
Uploaded files are instantly accessible over HTTP:
```
http://localhost:5001/uploads/produce/<timestamp>-<filename>.jpg
```

---

## 📡 API Reference

### Health Check
- `GET /api/health` - Check API and storage service status.

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Create new user account.
  ```json
  {
    "fullName": "Sunil Bandara",
    "mobileNumber": "0771234567",
    "email": "sunil@farmora.lk",
    "password": "Farmora@2026Password",
    "accountType": "farmer",
    "district": "Nuwara Eliya",
    "address": "Welimada Road"
  }
  ```
- `POST /api/auth/login` - Login with `identifier` (mobile or email) and `password`.
- `POST /api/auth/request-otp` - Request 6-digit verification code.
- `POST /api/auth/verify-otp` - Verify code.
- `POST /api/auth/reset-password` - Reset password with verified OTP.
- `GET /api/auth/me` - Get profile of authenticated user (`Authorization: Bearer <token>`).

### Produce Marketplace (`/api/produce`)
- `GET /api/produce` - List produce listings with query filters:
  - `?category=vegetables`
  - `?district=Nuwara Eliya`
  - `?search=carrot`
  - `?minPrice=100&maxPrice=500`
- `GET /api/produce/item/:id` - Get specific produce details.
- `GET /api/produce/farmer/my-listings` - Farmer's listings (`Bearer <token>`).
- `POST /api/produce` - Create new listing (Requires role: `farmer`).
- `PUT /api/produce/:id` - Edit listing (Farmer owner only).
- `DELETE /api/produce/:id` - Delete listing (Farmer owner only).

### User Profile (`/api/users`)
- `GET /api/users/:id` - Public profile details.
- `PATCH /api/users/profile` - Update bio, address, district.
- `POST /api/users/profile/avatar` - Upload and set user avatar.

---

## 🌐 Production Build
```bash
npm run build
npm start
```
