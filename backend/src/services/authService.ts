import { pool } from '../config/database';
import { hashPassword, comparePassword } from '../utils/hash';
import { generateToken } from '../utils/jwt';
import { User, SanitizedUser, AuthTokens } from '../types';
import { ValidationError, ConflictError, AuthenticationError } from '../utils/errors';
import { getLogger } from '../utils/logger';

const logger = getLogger('auth-service');

export interface SignupData {
  email: string;
  password: string;
  display_name: string;
}

export interface LoginData {
  email: string;
  password: string;
}

function sanitizeUser(user: User): SanitizedUser {
  return {
    id: user.id,
    email: user.email,
    display_name: user.display_name,
    created_at: user.created_at,
  };
}

export async function signup(data: SignupData): Promise<{ user: SanitizedUser; tokens: AuthTokens }> {
  const { email, password, display_name } = data;

  try {
    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Insert user
    const result = await pool.query<User>(
      `INSERT INTO users (email, password_hash, display_name) 
       VALUES ($1, $2, $3) 
       RETURNING id, email, password_hash, display_name, created_at, updated_at`,
      [email, passwordHash, display_name.trim()]
    );

    const user = result.rows[0];
    if (!user) {
      throw new Error('Failed to create user');
    }

    // Generate JWT token for immediate login
    const accessToken = generateToken(user.id);

    logger.info('User registered', { userId: user.id, email: user.email });

    return {
      user: sanitizeUser(user),
      tokens: {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 900,
      },
    };
  } catch (error) {
    if (error instanceof ConflictError) throw error;
    logger.error('Signup failed', { error: (error as Error).message });
    throw error;
  }
}

export async function login(data: LoginData): Promise<{ user: SanitizedUser; tokens: AuthTokens }> {
  const { email, password } = data;

  try {
    // Find user by email
    const result = await pool.query<User>(
      'SELECT id, email, password_hash, display_name, created_at, updated_at FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      throw new AuthenticationError('Invalid email or password');
    }

    const user = result.rows[0];
    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);
    if (!isValidPassword) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Generate JWT
    const accessToken = generateToken(user.id);

    logger.info('User logged in', { userId: user.id });

    return {
      user: sanitizeUser(user),
      tokens: {
        access_token: accessToken,
        token_type: 'Bearer',
        expires_in: 900, // 15 minutes in seconds
      },
    };
  } catch (error) {
    if (error instanceof AuthenticationError) throw error;
    logger.error('Login failed', { error: (error as Error).message });
    throw error;
  }
}

export async function logout(_userId: string): Promise<void> {
  // For MVP, we simply acknowledge the logout
  // In production, you might want to blacklist the token or use refresh tokens
  logger.info('User logged out', { userId: _userId });
}
