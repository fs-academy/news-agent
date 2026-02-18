import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { signupBodySchema, loginBodySchema, userResponseSchema, updateProfileBodySchema } from '../schemas/index.js';
import { sendPasswordResetEmail } from '../services/email.js';
import { config } from '../config.js';

export default async function authRoutes(fastify) {
  fastify.post('/signup', {
    schema: {
      body: signupBodySchema,
      response: { 200: userResponseSchema }
    }
  }, async (request, reply) => {
    const { email, password, fullName } = request.body;

    const existing = await fastify.collections.users.findOne({ email });
    if (existing) return reply.conflict('Email already registered');

    const passwordHash = await bcrypt.hash(password, 12);
    const user = {
      _id: new ObjectId(),
      email,
      passwordHash,
      fullName,
      interests: [],
      onboardingComplete: false,
      createdAt: new Date(),
      settings: { theme: 'system', articlesPerPage: 20 }
    };

    await fastify.collections.users.insertOne(user);

    const token = fastify.jwt.sign({ id: user._id.toString(), email: user.email });

    return {
      success: true,
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        interests: user.interests,
        onboardingComplete: user.onboardingComplete
      }
    };
  });

  fastify.post('/login', {
    schema: {
      body: loginBodySchema,
      response: { 200: userResponseSchema }
    }
  }, async (request, reply) => {
    const { email, password } = request.body;

    const user = await fastify.collections.users.findOne({ email });
    if (!user) return reply.unauthorized('Invalid credentials');

    // Check if user signed up via OAuth (no password set)
    if (!user.passwordHash) {
      // Determine which OAuth provider they used
      const provider = user.googleId ? 'Google' : user.githubId ? 'GitHub' : 'social login';
      return reply.badRequest(`This account was created using ${provider}. Please use the "${provider === 'Google' ? 'Continue with Google' : provider === 'GitHub' ? 'Continue with GitHub' : 'social login'}" button to sign in.`);
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return reply.unauthorized('Invalid credentials');

    const token = fastify.jwt.sign({ id: user._id.toString(), email: user.email });

    return {
      success: true,
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        interests: user.interests,
        onboardingComplete: user.onboardingComplete,
        settings: user.settings,
        avatarUrl: user.avatarUrl
      }
    };
  });

  // Get current user profile (protected)
  fastify.get('/me', {
    onRequest: [fastify.authenticate]
  }, async (request, reply) => {
    const user = await fastify.collections.users.findOne({ _id: new ObjectId(request.user.id) });
    if (!user) return reply.notFound('User not found');

    return {
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        interests: user.interests,
        onboardingComplete: user.onboardingComplete,
        settings: user.settings,
        avatarUrl: user.avatarUrl
      }
    };
  });

  // Update user profile (protected)
  fastify.patch('/me', {
    onRequest: [fastify.authenticate],
    schema: {
      body: updateProfileBodySchema
    }
  }, async (request, reply) => {
    const { fullName, email, role, interests, settings, avatarUrl } = request.body;

    // First, get the current user to merge settings
    const currentUser = await fastify.collections.users.findOne({ _id: new ObjectId(request.user.id) });
    if (!currentUser) return reply.notFound('User not found');

    // If email is being changed, check if it's already taken by another user
    if (email !== undefined && email !== currentUser.email) {
      const existingUser = await fastify.collections.users.findOne({ email });
      if (existingUser) {
        return reply.conflict('Email already in use by another account');
      }
    }

    const updateFields = {};
    if (fullName !== undefined) updateFields.fullName = fullName;
    if (email !== undefined) updateFields.email = email;
    if (role !== undefined) updateFields.role = role;
    if (interests !== undefined) updateFields.interests = interests;
    if (avatarUrl !== undefined) updateFields.avatarUrl = avatarUrl;
    
    // Merge settings with existing settings (don't replace entirely)
    if (settings !== undefined) {
      updateFields.settings = {
        ...(currentUser.settings || {}),
        ...settings
      };
    }

    // Mark onboarding complete if role and interests are set
    if (role && interests?.length >= 3) {
      updateFields.onboardingComplete = true;
    }

    const result = await fastify.collections.users.findOneAndUpdate(
      { _id: new ObjectId(request.user.id) },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!result) return reply.notFound('User not found');

    return {
      success: true,
      user: {
        id: result._id.toString(),
        email: result.email,
        fullName: result.fullName,
        role: result.role,
        interests: result.interests,
        onboardingComplete: result.onboardingComplete,
        settings: result.settings,
        avatarUrl: result.avatarUrl
      }
    };
  });

  // ============================================
  // Password Reset Routes
  // ============================================

  /**
   * Request password reset
   * Sends an email with reset link if email exists
   * Always returns success to prevent email enumeration attacks
   */
  fastify.post('/forgot-password', {
    schema: {
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email' }
        }
      }
    }
  }, async (request, reply) => {
    const { email } = request.body;

    try {
      // Find user by email
      const user = await fastify.collections.users.findOne({ email: email.toLowerCase() });
      
      // If user exists, generate reset token and send email
      if (user) {
        // Check if this is an OAuth-only account (no password set)
        if (!user.passwordHash) {
          const provider = user.googleId ? 'Google' : user.githubId ? 'GitHub' : 'social login';
          // Return a helpful message for OAuth users
          // Note: We still return success to avoid email enumeration, but with a hint
          return {
            success: true,
            message: `This account uses ${provider} for sign-in. Please use the "${provider === 'Google' ? 'Continue with Google' : provider === 'GitHub' ? 'Continue with GitHub' : 'social login'}" button on the login page. If you want to set a password, you can still use the reset link that will be sent to your email.`
          };
        }

        // Generate secure random token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
        
        // Set expiry time (1 hour from now)
        const expiryHours = config.passwordReset?.tokenExpiryHours || 1;
        const resetTokenExpiry = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

        // Save hashed token and expiry to user document
        await fastify.collections.users.updateOne(
          { _id: user._id },
          {
            $set: {
              passwordResetToken: resetTokenHash,
              passwordResetExpiry: resetTokenExpiry,
            }
          }
        );

        fastify.log.info(`Password reset requested for: ${user.email}`);

        // Send reset email
        try {
          const result = await sendPasswordResetEmail(
            user.email,
            resetToken,
            user.fullName || 'User'
          );
          
          if (result.success) {
            fastify.log.info(`Password reset email sent to: ${user.email}`);
            if (result.previewUrl) {
              fastify.log.info(`Email preview URL: ${result.previewUrl}`);
            }
          } else {
            fastify.log.error(`Failed to send password reset email: ${result.error}`);
          }
        } catch (err) {
          fastify.log.error('Error sending password reset email:', err);
        }
      }

      // Always return success to prevent email enumeration
      return {
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.'
      };
    } catch (error) {
      fastify.log.error('Password reset request error:', error);
      // Still return success to prevent information leakage
      return {
        success: true,
        message: 'If an account exists with this email, you will receive a password reset link.'
      };
    }
  });

  /**
   * Verify password reset token
   * Checks if token is valid and not expired
   */
  fastify.post('/verify-reset-token', {
    schema: {
      body: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string', minLength: 1 }
        }
      }
    }
  }, async (request, reply) => {
    const { token } = request.body;

    try {
      // Hash the provided token to match stored hash
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Find user with matching token that hasn't expired
      const user = await fastify.collections.users.findOne({
        passwordResetToken: tokenHash,
        passwordResetExpiry: { $gt: new Date() }
      });

      if (!user) {
        return reply.code(400).send({
          success: false,
          valid: false,
          message: 'Invalid or expired reset token'
        });
      }

      return {
        success: true,
        valid: true,
        message: 'Token is valid'
      };
    } catch (error) {
      fastify.log.error('Token verification error:', error);
      return reply.code(500).send({
        success: false,
        valid: false,
        message: 'Failed to verify token'
      });
    }
  });

  /**
   * Reset password using token
   * Updates user password and clears reset token
   */
  fastify.post('/reset-password', {
    schema: {
      body: {
        type: 'object',
        required: ['token', 'password'],
        properties: {
          token: { type: 'string', minLength: 1 },
          password: { type: 'string', minLength: 8 }
        }
      }
    }
  }, async (request, reply) => {
    const { token, password } = request.body;

    try {
      // Hash the provided token to match stored hash
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      // Find user with matching token that hasn't expired
      const user = await fastify.collections.users.findOne({
        passwordResetToken: tokenHash,
        passwordResetExpiry: { $gt: new Date() }
      });

      if (!user) {
        return reply.code(400).send({
          success: false,
          message: 'Invalid or expired reset token. Please request a new password reset.'
        });
      }

      // Hash the new password
      const passwordHash = await bcrypt.hash(password, 12);

      // Update password and clear reset token
      await fastify.collections.users.updateOne(
        { _id: user._id },
        {
          $set: { passwordHash },
          $unset: {
            passwordResetToken: '',
            passwordResetExpiry: ''
          }
        }
      );

      fastify.log.info(`Password reset successful for user: ${user.email}`);

      return {
        success: true,
        message: 'Password has been reset successfully. You can now sign in with your new password.'
      };
    } catch (error) {
      fastify.log.error('Password reset error:', error);
      return reply.code(500).send({
        success: false,
        message: 'Failed to reset password. Please try again.'
      });
    }
  });
}
