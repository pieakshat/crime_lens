This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm (or npm/yarn)
- MongoDB database (local or MongoDB Atlas)

### Setup

1. **Install dependencies:**
```bash
pnpm install
```

2. **Configure Environment Variables:**

Create a `.env.local` file in the root directory with the following variables:

```env
# MongoDB Configuration (Required)
# Get your MongoDB URI from: https://www.mongodb.com/cloud/atlas
# Format: mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority

# Optional: Database name (defaults to 'crime_lens')
MONGODB_DB_NAME=crime_lens

# Twilio Configuration (for SMS OTP and SOS alerts - Optional)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_VERIFY_SERVICE_SID=your_twilio_verify_service_sid
TWILIO_PHONE_NUMBER=+1234567890  # Your Twilio phone number for sending SMS

# Demo Mode (set to 'false' to disable demo mode)
DEMO_MODE=true
```

3. **Run the development server:**
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### MongoDB Setup

#### Option 1: MongoDB Atlas (Cloud - Recommended)
1. Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Get your connection string and add it to `.env.local` as `MONGODB_URI`

#### Option 2: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Use connection string: `mongodb://localhost:27017/crime_lens`

### Database Collections

The application automatically creates two collections:
- `otps` - Stores OTP codes with expiration times
- `users` - Stores user information (phone, email, guardian phone, etc.)

## 🚨 SOS Alert System

### Automatic SOS Alerts

When a user enters a severe zone (via "Simulate Entering Area"), the system automatically:
1. Shows a warning popup
2. **Automatically sends SOS alerts** via SMS to:
   - **User's phone**: Safety alert with city info and common crimes
   - **Guardian's phone** (if configured): Guardian alert with user location and risk level

### Manual SOS Alerts

Users can also manually trigger SOS alerts by:
1. Selecting a city on the map
2. Clicking the "🚨 SOS ALERT" button in the sidebar

### Alert Conditions

A zone is considered "severe" and triggers automatic alerts if:
- `avg_severity >= 2` **OR**
- `intensity_score` is in the **top 50%** of all cities

### Alert Messages

**User Alert:**
```
⚠ SAFETY ALERT — EDAI
You've entered: {CITY}
Severity: {SEVERITY}
Common crimes: {CRIMES}
Location: {MAP_LINK}
```

**Guardian Alert:**
```
🚨 GUARDIAN ALERT — EDAI
Your contact {USER_PHONE} is in {CITY} (Severity {SEVERITY}).
Crimes: {CRIMES}
Location: {MAP_LINK}
```

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
