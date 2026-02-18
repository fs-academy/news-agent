import { ObjectId } from 'mongodb';
import { config } from '../config.js';

/**
 * OAuth Routes for Google and GitHub authentication
 * Handles OAuth flow initiation and callback handling
 */
export default async function oauthRoutes(fastify) {
  
  // Helper function to find or create user from OAuth data
  async function findOrCreateOAuthUser(provider, profile) {
    const { id: providerId, email, name, avatar } = profile;
    
    // Check if user exists with this OAuth provider
    const existingUserByProvider = await fastify.collections.users.findOne({
      [`oauth.${provider}.id`]: providerId
    });
    
    if (existingUserByProvider) {
      return existingUserByProvider;
    }
    
    // Check if user exists with this email
    if (email) {
      const existingUserByEmail = await fastify.collections.users.findOne({ email });
      
      if (existingUserByEmail) {
        // Link OAuth provider to existing account
        await fastify.collections.users.updateOne(
          { _id: existingUserByEmail._id },
          { 
            $set: { 
              [`oauth.${provider}`]: { id: providerId, email, name, avatar },
              updatedAt: new Date()
            } 
          }
        );
        return fastify.collections.users.findOne({ _id: existingUserByEmail._id });
      }
    }
    
    // Create new user
    const user = {
      _id: new ObjectId(),
      email: email || `${provider}_${providerId}@oauth.local`,
      fullName: name || 'User',
      oauth: {
        [provider]: { id: providerId, email, name, avatar }
      },
      interests: [],
      onboardingComplete: false,
      createdAt: new Date(),
      settings: { theme: 'system', articlesPerPage: 20 }
    };
    
    await fastify.collections.users.insertOne(user);
    return user;
  }

  // Helper function to generate auth response
  function generateAuthResponse(user) {
    const token = fastify.jwt.sign({ id: user._id.toString(), email: user.email });
    return {
      success: true,
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        interests: user.interests,
        onboardingComplete: user.onboardingComplete,
        settings: user.settings
      }
    };
  }

  // ==================== GOOGLE OAuth ====================

  // Initiate Google OAuth flow
  fastify.get('/google', async (request, reply) => {
    if (!config.oauth.google.clientId || !config.oauth.google.clientSecret) {
      return reply.badRequest('Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.');
    }

    const scopes = ['openid', 'email', 'profile'];
    const state = Buffer.from(JSON.stringify({ 
      timestamp: Date.now(),
      nonce: Math.random().toString(36).substring(7)
    })).toString('base64');

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', config.oauth.google.clientId);
    authUrl.searchParams.set('redirect_uri', config.oauth.google.callbackUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes.join(' '));
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent');

    return reply.redirect(authUrl.toString());
  });

  // Google OAuth callback
  fastify.get('/google/callback', async (request, reply) => {
    const { code, error } = request.query;

    if (error) {
      fastify.log.error(`Google OAuth error: ${error}`);
      return reply.redirect(`${config.oauth.frontendUrl}/login?error=oauth_denied`);
    }

    if (!code) {
      return reply.redirect(`${config.oauth.frontendUrl}/login?error=no_code`);
    }

    try {
      // Exchange code for tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: config.oauth.google.clientId,
          client_secret: config.oauth.google.clientSecret,
          redirect_uri: config.oauth.google.callbackUri,
          grant_type: 'authorization_code'
        })
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        fastify.log.error(`Google token exchange failed: ${errorData}`);
        return reply.redirect(`${config.oauth.frontendUrl}/login?error=token_exchange_failed`);
      }

      const tokens = await tokenResponse.json();

      // Get user info from Google
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });

      if (!userInfoResponse.ok) {
        fastify.log.error('Failed to get Google user info');
        return reply.redirect(`${config.oauth.frontendUrl}/login?error=userinfo_failed`);
      }

      const googleUser = await userInfoResponse.json();

      // Find or create user
      const user = await findOrCreateOAuthUser('google', {
        id: googleUser.id,
        email: googleUser.email,
        name: googleUser.name,
        avatar: googleUser.picture
      });

      // Generate JWT and redirect
      const authData = generateAuthResponse(user);
      const redirectUrl = new URL(
        user.onboardingComplete ? '/dashboard' : '/onboarding',
        config.oauth.frontendUrl
      );
      redirectUrl.searchParams.set('token', authData.token);
      redirectUrl.searchParams.set('user', Buffer.from(JSON.stringify(authData.user)).toString('base64'));

      return reply.redirect(redirectUrl.toString());
    } catch (err) {
      fastify.log.error(`Google OAuth callback error: ${err.message}`);
      return reply.redirect(`${config.oauth.frontendUrl}/login?error=oauth_failed`);
    }
  });

  // ==================== GITHUB OAuth ====================

  // Initiate GitHub OAuth flow
  fastify.get('/github', async (request, reply) => {
    if (!config.oauth.github.clientId || !config.oauth.github.clientSecret) {
      return reply.badRequest('GitHub OAuth is not configured. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET environment variables.');
    }

    const scopes = ['read:user', 'user:email'];
    const state = Buffer.from(JSON.stringify({ 
      timestamp: Date.now(),
      nonce: Math.random().toString(36).substring(7)
    })).toString('base64');

    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', config.oauth.github.clientId);
    authUrl.searchParams.set('redirect_uri', config.oauth.github.callbackUri);
    authUrl.searchParams.set('scope', scopes.join(' '));
    authUrl.searchParams.set('state', state);

    return reply.redirect(authUrl.toString());
  });

  // GitHub OAuth callback
  fastify.get('/github/callback', async (request, reply) => {
    const { code, error } = request.query;

    if (error) {
      fastify.log.error(`GitHub OAuth error: ${error}`);
      return reply.redirect(`${config.oauth.frontendUrl}/login?error=oauth_denied`);
    }

    if (!code) {
      return reply.redirect(`${config.oauth.frontendUrl}/login?error=no_code`);
    }

    try {
      // Exchange code for tokens
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          code,
          client_id: config.oauth.github.clientId,
          client_secret: config.oauth.github.clientSecret,
          redirect_uri: config.oauth.github.callbackUri
        })
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.text();
        fastify.log.error(`GitHub token exchange failed: ${errorData}`);
        return reply.redirect(`${config.oauth.frontendUrl}/login?error=token_exchange_failed`);
      }

      const tokens = await tokenResponse.json();

      if (tokens.error) {
        fastify.log.error(`GitHub token error: ${tokens.error_description}`);
        return reply.redirect(`${config.oauth.frontendUrl}/login?error=token_error`);
      }

      // Get user info from GitHub
      const userInfoResponse = await fetch('https://api.github.com/user', {
        headers: { 
          Authorization: `Bearer ${tokens.access_token}`,
          'User-Agent': 'NewsAgent'
        }
      });

      if (!userInfoResponse.ok) {
        fastify.log.error('Failed to get GitHub user info');
        return reply.redirect(`${config.oauth.frontendUrl}/login?error=userinfo_failed`);
      }

      const githubUser = await userInfoResponse.json();

      // Get user email if not public
      let email = githubUser.email;
      if (!email) {
        const emailsResponse = await fetch('https://api.github.com/user/emails', {
          headers: { 
            Authorization: `Bearer ${tokens.access_token}`,
            'User-Agent': 'NewsAgent'
          }
        });
        
        if (emailsResponse.ok) {
          const emails = await emailsResponse.json();
          const primaryEmail = emails.find(e => e.primary && e.verified);
          email = primaryEmail?.email || emails[0]?.email;
        }
      }

      // Find or create user
      const user = await findOrCreateOAuthUser('github', {
        id: githubUser.id.toString(),
        email,
        name: githubUser.name || githubUser.login,
        avatar: githubUser.avatar_url
      });

      // Generate JWT and redirect
      const authData = generateAuthResponse(user);
      const redirectUrl = new URL(
        user.onboardingComplete ? '/dashboard' : '/onboarding',
        config.oauth.frontendUrl
      );
      redirectUrl.searchParams.set('token', authData.token);
      redirectUrl.searchParams.set('user', Buffer.from(JSON.stringify(authData.user)).toString('base64'));

      return reply.redirect(redirectUrl.toString());
    } catch (err) {
      fastify.log.error(`GitHub OAuth callback error: ${err.message}`);
      return reply.redirect(`${config.oauth.frontendUrl}/login?error=oauth_failed`);
    }
  });
}
