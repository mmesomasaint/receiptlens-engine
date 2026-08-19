// src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient, SubscriptionTier } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { googleService } from '../services/google.service';
import { encryptionService } from '../services/encryption.service';
import { config } from '../config';
import { AppError } from '../errors/app-error';

const prisma = new PrismaClient();

interface GoogleUserProfile {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

export class AuthController {
  /**
   * Generates Google OAuth 2.0 redirection URL.
   */
  public getGoogleAuthUrl(req: Request, res: Response) {
    const oauthClient = googleService.getOAuthClient();
    const url = oauthClient.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: config.google.scopes,
    });
    res.status(200).json({ status: 'success', data: { authorizationUrl: url } });
  }

  /**
   * Handles Google OAuth callback, persists encrypted token, and signs user JWT.
   */
  public async handleGoogleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code } = req.query;
      if (!code || typeof code !== 'string') {
        throw new AppError('Missing OAuth authorization code.', 400);
      }

      const oauthClient = googleService.getOAuthClient();
      const { tokens } = await oauthClient.getToken(code);
      oauthClient.setCredentials(tokens);

      if (!tokens.refresh_token) {
        throw new AppError('Google did not return a refresh token. Re-consent required.', 400);
      }

      // Fetch Google Profile Info
      const resProfile = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const profile = (await resProfile.json()) as GoogleUserProfile;

      if (!profile.id || !profile.email) {
        throw new AppError('Failed to retrieve user profile details from Google.', 400);
      }

      const encryptedRefreshToken = encryptionService.encrypt(tokens.refresh_token);

      const user = await prisma.user.upsert({
        where: { googleId: profile.id },
        update: {
          email: profile.email,
          fullName: profile.name,
          googleAccessToken: tokens.access_token,
          googleRefreshToken: encryptedRefreshToken,
          tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        },
        create: {
          email: profile.email,
          fullName: profile.name,
          googleId: profile.id,
          googleAccessToken: tokens.access_token,
          googleRefreshToken: encryptedRefreshToken,
          tier: SubscriptionTier.FREE_90_DAYS,
        },
      });

      const token = jwt.sign({ userId: user.id, email: user.email, tier: user.tier }, config.jwtSecret, {
        expiresIn: '7d',
      });

      res.status(200).json({
        status: 'success',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            tier: user.tier,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
