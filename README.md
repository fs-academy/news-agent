# FSA-Newsagent-fe
NewsAgent frontend is a Next.js 14+ app with React 18, Tailwind CSS, and SWR for fast, privacy-first news aggregation. It features robust topic search, AI-powered ranking, and secure authentication. Optimized for Docker deployment, it delivers responsive UX and local-first processing for research professionals.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 20.0.0 (for backend)
- **Node.js** >= 18.0.0 (for frontend)
- **MongoDB** (local instance or MongoDB Atlas connection string)
- **npm** or **yarn** package manager

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd news-agent
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd api/node
npm install
cd ../..
```

## Environment Variables

### Backend Configuration

Create a `.env` file in the `api/node` directory with the following variables:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB_NAME=newsagent

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production

# News API Configuration
NEWSAPI_KEY=your_newsapi_key
GNEWS_API_KEY=your_gnews_api_key (optional)

# Hugging Face Configuration (optional)
HF_API_TOKEN=your_huggingface_token
HF_SUMMARIZATION_MODEL=Falconsai/text_summarization

# OAuth Configuration (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URI=http://localhost:3001/api/auth/google/callback

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URI=http://localhost:3001/api/auth/github/callback

FRONTEND_URL=http://localhost:3000

# Email Configuration (optional)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
EMAIL_FROM="NewsAgent" <noreply@newsagent.com>

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

**Note:** The backend has default values for development, but you should set `MONGODB_URI`, `JWT_SECRET`, and `NEWSAPI_KEY` at minimum.

## Running the Application

### Start Backend Server

From the `api/node` directory:

```bash
cd api/node
npm run dev
```

The backend server will start on `http://localhost:3001`

**Production mode:**
```bash
npm start
```

### Start Frontend Application

From the root directory:

```bash
npm run dev
```

The frontend application will start on `http://localhost:3000`

**Production mode:**
```bash
npm run build
npm start
```

## Development Workflow

1. Start MongoDB (if using local instance) or ensure MongoDB Atlas connection is configured
2. Start the backend server first (`cd api/node && npm run dev`)
3. Start the frontend application (`npm run dev`)
4. Open `http://localhost:3000` in your browser

## Troubleshooting

### Port Already in Use

If you encounter `EADDRINUSE` error:
- **Backend (port 3001):** Kill the process using port 3001:
  ```bash
  lsof -ti:3001 | xargs kill -9
  ```
- **Frontend (port 3000):** Kill the process using port 3000:
  ```bash
  lsof -ti:3000 | xargs kill -9
  ```

### MongoDB Connection Issues

Ensure your MongoDB URI is correct and accessible. For MongoDB Atlas, check your IP whitelist settings.

## Available Scripts

### Frontend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests

### Backend Scripts
- `npm run dev` - Start development server with watch mode
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint

env reference - https://docs.google.com/document/d/16LX65Y0BYl_mSQRV_atNgNogblrw5fYhlGMV8P6tLCA/edit?usp=sharing 
