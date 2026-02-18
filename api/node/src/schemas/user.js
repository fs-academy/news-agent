/**
 * User schema definitions for authentication and profile management.
 * @see ADR-002 for MongoDB schema design
 */

import { objectIdSchema, responseSchema } from './common.js';

/**
 * User settings sub-schema
 */
export const userSettingsSchema = {
  type: 'object',
  properties: {
    // Appearance settings
    theme: {
      type: 'string',
      enum: ['light', 'dark', 'system'],
      default: 'system',
      description: 'UI theme preference'
    },
    fontSize: {
      type: 'integer',
      minimum: 0,
      maximum: 100,
      default: 50,
      description: 'Font size preference (0-100 scale)'
    },
    compactMode: {
      type: 'boolean',
      default: false,
      description: 'Enable compact mode for feed lists'
    },
    articlesPerPage: {
      type: 'integer',
      minimum: 5,
      maximum: 100,
      default: 20,
      description: 'Number of articles per page'
    },
    // AI settings
    aiModel: {
      type: 'string',
      default: 'Mistral (7B)',
      description: 'Selected AI model for summarization'
    },
    rankingSensitivity: {
      type: 'integer',
      minimum: 0,
      maximum: 100,
      default: 50,
      description: 'Ranking sensitivity (0=conservative, 100=aggressive)'
    },
    summaryLength: {
      type: 'string',
      enum: ['short', 'medium', 'detailed'],
      default: 'medium',
      description: 'Preferred summary length'
    }
  },
  additionalProperties: false
};

/**
 * Core user entity schema (database representation)
 */
export const userSchema = {
  $id: 'user',
  type: 'object',
  properties: {
    _id: objectIdSchema,
    email: {
      type: 'string',
      format: 'email',
      maxLength: 255,
      description: 'User email address (unique)'
    },
    passwordHash: {
      type: 'string',
      description: 'Bcrypt hashed password'
    },
    fullName: {
      type: 'string',
      minLength: 1,
      maxLength: 100,
      description: 'User full name'
    },
    role: {
      type: 'string',
      enum: ['research_analyst', 'product_manager', 'software_engineer', 'journalist', 'business_consultant', 'other'],
      description: 'User role/profession'
    },
    interests: {
      type: 'array',
      items: { type: 'string', maxLength: 50 },
      maxItems: 20,
      default: [],
      description: 'User interest topics'
    },
    onboardingComplete: {
      type: 'boolean',
      default: false,
      description: 'Whether user has completed onboarding'
    },
    avatarUrl: {
      type: 'string',
      maxLength: 2097152,
      description: 'Base64 encoded avatar image (~2MB max)'
    },
    savedArticles: {
      type: 'array',
      items: objectIdSchema,
      default: [],
      description: 'Article IDs saved for Read Later'
    },
    favouriteArticles: {
      type: 'array',
      items: objectIdSchema,
      default: [],
      description: 'Article IDs marked as Favourite'
    },
    createdAt: {
      type: 'string',
      format: 'date-time',
      description: 'Account creation timestamp'
    },
    settings: userSettingsSchema
  },
  required: ['email', 'passwordHash', 'fullName', 'createdAt']
};

/**
 * Signup request body schema
 */
export const signupBodySchema = {
  type: 'object',
  properties: {
    email: {
      type: 'string',
      format: 'email',
      maxLength: 255
    },
    password: {
      type: 'string',
      minLength: 8,
      maxLength: 128,
      description: 'Password (min 8 characters)'
    },
    fullName: {
      type: 'string',
      minLength: 1,
      maxLength: 100
    }
  },
  required: ['email', 'password', 'fullName'],
  additionalProperties: false
};

/**
 * Login request body schema
 */
export const loginBodySchema = {
  type: 'object',
  properties: {
    email: {
      type: 'string',
      format: 'email',
      maxLength: 255
    },
    password: {
      type: 'string',
      minLength: 1,
      maxLength: 128
    }
  },
  required: ['email', 'password'],
  additionalProperties: false
};

/**
 * User response schema (safe for client, no passwordHash)
 */
export const userResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    token: { type: 'string' },
    user: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string', format: 'email' },
        fullName: { type: 'string' },
        role: { type: 'string' },
        interests: { type: 'array', items: { type: 'string' } },
        onboardingComplete: { type: 'boolean' },
        savedArticles: { type: 'array', items: { type: 'string' } },
        favouriteArticles: { type: 'array', items: { type: 'string' } },
        settings: userSettingsSchema,
        avatarUrl: { type: 'string', description: 'Base64 encoded avatar image' }
      }
    }
  }
};

/**
 * Update user profile request schema
 */
export const updateProfileBodySchema = {
  type: 'object',
  properties: {
    fullName: {
      type: 'string',
      minLength: 1,
      maxLength: 100
    },
    email: {
      type: 'string',
      format: 'email',
      maxLength: 255,
      description: 'User email address'
    },
    role: {
      type: 'string',
      enum: ['research_analyst', 'product_manager', 'software_engineer', 'journalist', 'business_consultant', 'other']
    },
    interests: {
      type: 'array',
      items: { type: 'string', maxLength: 50 },
      maxItems: 20
    },
    avatarUrl: {
      type: 'string',
      maxLength: 2097152, // ~2MB base64 string
      description: 'Base64 encoded avatar image'
    },
    settings: userSettingsSchema
  },
  additionalProperties: false
};

export default {
  userSchema,
  userSettingsSchema,
  signupBodySchema,
  loginBodySchema,
  userResponseSchema,
  updateProfileBodySchema
};
