import jwt, { SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-32-chars-minimum-required';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || 'refresh-secret-32-chars-minimum-required';

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'user' | 'org_admin' | 'super_admin';
  orgId?: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenFamily: string;
  iat?: number;
  exp?: number;
}

/**
 * Generate a new access token (expires in 1 hour by default)
 */
export function generateAccessToken(payload: Omit<TokenPayload, 'iat' | 'exp'>): string {
  const expiresIn = process.env.JWT_EXPIRES_IN ? parseInt(process.env.JWT_EXPIRES_IN, 10) : 3600;
  const options: SignOptions = {
    expiresIn,
    algorithm: 'HS256',
  };
  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Generate a new refresh token (expires in 7 days by default)
 */
export function generateRefreshToken(payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): string {
  const expiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN ? parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN, 10) : 604800;
  const options: SignOptions = {
    expiresIn,
    algorithm: 'HS256',
  };
  return jwt.sign(payload, REFRESH_SECRET, options);
}

/**
 * Verify and decode an access token
 */
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Verify and decode a refresh token
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as RefreshTokenPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token: string): any | null {
  try {
    return jwt.decode(token);
  } catch {
    return null;
  }
}
