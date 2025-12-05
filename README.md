# Crime Lens - Emergency Detection & Alert Interface

A Next.js application for visualizing crime data and sending automatic safety alerts when users enter high-risk zones.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **pnpm** (or npm/yarn)
- **MongoDB** database (local or MongoDB Atlas)

### Installation & Setup

1. **Clone the repository and navigate to the project:**
```bash
cd crime_lens
```

2. **Install dependencies:**
```bash
pnpm install
```

3. **Create environment file:**

Create a `.env.local` file in the `crime_lens` directory with the following format:

```env
# MongoDB Configuration (Required)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB_NAME=crime_lens

# Twilio Configuration (Optional - for SMS OTP and SOS alerts)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_VERIFY_SERVICE_SID=your_twilio_verify_service_sid
TWILIO_PHONE_NUMBER=+1234567890

# Demo Mode (set to 'false' to disable demo mode)
DEMO_MODE=true
```

4. **Run the development server:**
```bash
pnpm dev
```

5. **Open your browser:**
Navigate to [http://localhost:3000](http://localhost:3000)

## 📋 Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_DB_NAME` | Database name | `crime_lens` |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID for SMS | - |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | - |
| `TWILIO_VERIFY_SERVICE_SID` | Twilio Verify Service SID | - |
| `TWILIO_PHONE_NUMBER` | Twilio phone number for sending SMS | - |
| `DEMO_MODE` | Enable/disable demo mode | `true` |

## 🗄️ MongoDB Setup

### Option 1: MongoDB Atlas (Cloud - Recommended)

1. Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user with read/write permissions
4. Whitelist your IP address (or use `0.0.0.0/0` for development)
5. Get your connection string:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
6. Add the connection string to `.env.local` as `MONGODB_URI`

**Example:**
```env
MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

### Option 2: Local MongoDB

1. Install MongoDB locally ([Download](https://www.mongodb.com/try/download/community))
2. Start MongoDB service:
   ```bash
   # macOS (using Homebrew)
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   
   # Windows
   # MongoDB starts automatically as a service
   ```
3. Use connection string in `.env.local`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/crime_lens
   ```

## 📦 Database Collections

The application automatically creates the following collections:

- **`otps`** - Stores OTP codes with expiration times (auto-cleaned)
- **`users`** - Stores user information (phone, username, email, guardian phone, etc.)

## 🔧 Configuration

### Twilio Setup (Optional - for SMS features)

1. Sign up at [Twilio](https://www.twilio.com/)
2. Get your Account SID and Auth Token from the dashboard
3. Create a Verify Service (for OTP) or use Messaging Service (for SOS)
4. Get a phone number from Twilio
5. Add credentials to `.env.local`

**Note:** Without Twilio, the app runs in demo mode and shows OTP/SOS messages in the UI instead of sending SMS.

## 🎮 Usage

### Running the Application

```bash
# Development mode
pnpm dev

# Production build
pnpm build
pnpm start
```

### Accessing the Application

- **Login Page:** http://localhost:3000/login
- **Dashboard:** http://localhost:3000/dashboard

### Demo Mode

In demo mode (default):
- OTP codes are displayed in the UI
- SOS alerts show messages but don't send SMS
- No Twilio configuration required
- Perfect for testing and development

To disable demo mode:
```env
DEMO_MODE=false
```

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

## 🚀 Deploy on Vercel

### Prerequisites

1. Push your code to GitHub/GitLab/Bitbucket
2. Have a Vercel account ([Sign up](https://vercel.com/signup))

### Deployment Steps

1. **Import your project to Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your repository

2. **Configure Environment Variables:**

   **CRITICAL:** Add all environment variables in Vercel's project settings:
   
   - Go to your project → Settings → Environment Variables
   - Add the following variables:

   ```env
   # Required
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
   
   # Optional but recommended
   MONGODB_DB_NAME=crime_lens
   
   # For SMS features (SOS alerts and OTP)
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_VERIFY_SERVICE_SID=your_twilio_verify_service_sid
   TWILIO_PHONE_NUMBER=+1234567890
   
   # IMPORTANT: Set to 'false' to enable SMS sending
   DEMO_MODE=false
   ```

3. **Important Notes for Vercel:**
   - **DEMO_MODE**: Must be set to `false` (as a string) to send real SMS. If not set or set to anything else, it defaults to `true` and SMS won't be sent.
   - **Environment Variables**: Must be added in Vercel dashboard - `.env.local` files are NOT used in production
   - **MongoDB Atlas**: Make sure your MongoDB Atlas IP whitelist includes Vercel's IP ranges (or use `0.0.0.0/0` for all IPs)

4. **Deploy:**
   - Vercel will automatically deploy on every push to your main branch
   - Or click "Deploy" in the dashboard

### Troubleshooting SMS on Vercel

If SMS works locally but not on Vercel:

1. **Check Environment Variables:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Verify all Twilio variables are set:
     - `TWILIO_ACCOUNT_SID`
     - `TWILIO_AUTH_TOKEN`
     - `TWILIO_PHONE_NUMBER`
   - **Most Important:** Set `DEMO_MODE=false` (must be the string `"false"`)

2. **Check Vercel Logs:**
   - Go to Vercel Dashboard → Your Project → Deployments → Click on latest deployment → Functions tab
   - Look for logs showing:
     - `Twilio Config Check` - Should show all variables as `true`
     - `Twilio Status` - Should show `willSendSMS: true`

3. **Verify Twilio Configuration:**
   - Make sure your Twilio phone number is verified and can send SMS
   - Check Twilio console for any errors or restrictions

4. **Redeploy After Changes:**
   - After adding/updating environment variables, you must redeploy
   - Go to Deployments → Click "..." → Redeploy

### Common Issues

**Issue:** SMS not sending, but works locally
- **Solution:** Check `DEMO_MODE` is set to `false` in Vercel (not `true` or missing)

**Issue:** "Twilio not configured" error
- **Solution:** Verify all three Twilio environment variables are set in Vercel

**Issue:** MongoDB connection errors
- **Solution:** Add Vercel IP ranges to MongoDB Atlas whitelist, or use `0.0.0.0/0`

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
