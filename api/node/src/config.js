import 'dotenv/config';

// Validate required environment variables in production
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  const required = ['JWT_SECRET', 'MONGODB_URI', 'NEWSAPI_KEY'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error(`FATAL: Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
  
  // Warn about using default secrets in production
  if (process.env.JWT_SECRET === 'newsagent-dev-secret-change-in-production') {
    console.error('FATAL: JWT_SECRET must be changed in production');
    process.exit(1);
  }
}

export const config = {
  port: Number(process.env.PORT) || '3001',
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  corsOrigin: process.env.CORS_ORIGIN || '',
  mongoDbName: process.env.MONGODB_DB_NAME || 'newsagent',
  mongoUri: process.env.MONGODB_URI || 'mongodb+srv://jbharathi_db_user:DBuser123@cluster0.lm1o8lp.mongodb.net/?appName=Cluster0',
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  jwtSecret: process.env.JWT_SECRET || 'newsagent-dev-secret-change-in-production',
  
  // Hugging Face Configuration (for AI summarization)
  huggingface: {
    apiToken: process.env.HF_API_TOKEN || '',  // Optional but recommended to avoid rate limits
    model: process.env.HF_SUMMARIZATION_MODEL || 'Falconsai/text_summarization',
    timeout: parseInt(process.env.HF_TIMEOUT || '15000', 10),  // 15s default timeout
  },
  
  // News API Configuration (Primary: NewsAPI.org, Fallback: GNews.io)
  newsApi: {
    primary: {
      baseUrl: 'https://newsapi.org/v2',
      apiKey: process.env.NEWSAPI_KEY || '9656f829208c4947a8ce6b1199a1fa45',
    },
    fallback: {
      baseUrl: 'https://gnews.io/api/v4',
      apiKey: process.env.GNEWS_API_KEY || '',
    },
  },
  
  // OAuth Configuration
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      callbackUri: process.env.GOOGLE_CALLBACK_URI || 'http://localhost:3001/api/auth/google/callback',
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      callbackUri: process.env.GITHUB_CALLBACK_URI || 'http://localhost:3001/api/auth/github/callback',
    },
    frontendUrl: process.env.FRONTEND_URL || '',
  },
  
  // Email Configuration
  email: {
    from: process.env.EMAIL_FROM || '"NewsAgent" <noreply@newsagent.com>',
    smtp: {
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  },
  
  // Password Reset Configuration
  passwordReset: {
    tokenExpiryHours: parseInt(process.env.PASSWORD_RESET_EXPIRY_HOURS || '1', 10),
  },
  
  // Rate Limiting Configuration
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10), // requests per window
    timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10), // 1 minute
    // Stricter limits for auth endpoints
    auth: {
      max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '10', 10),
      timeWindow: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW || '60000', 10),
    },
  },
  
  // CORS Configuration
  // Allow all origins in development, or specific origins in production
  corsOptions: {
    origin: process.env.NODE_ENV === 'production' 
      ? (process.env.CORS_ORIGIN || '').split(',').filter(Boolean)
      : true,  // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  },
};
