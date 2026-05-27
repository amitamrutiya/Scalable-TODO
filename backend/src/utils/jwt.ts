import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface JWTPayload {
  sub: string; // user_id
  iat: number;
  exp: number;
}

export function generateToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, env.JWT_SECRET) as JWTPayload;
}
