import request from 'supertest';
import { createTestApp } from './helpers/testApp';
import { cleanupTestData } from './helpers/database';
import { createTestUser } from './helpers/testUtils';

const app = createTestApp();

describe('Auth Endpoints', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  // =====================================================
  // POST /api/v1/auth/signup
  // =====================================================
  describe('POST /api/v1/auth/signup', () => {
    const validSignupData = {
      email: 'test@example.com',
      password: 'TestPass123!',
      display_name: 'Test User',
    };

    it('should sign up a new user with valid data', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(validSignupData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        email: validSignupData.email,
        display_name: validSignupData.display_name,
      });
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.password_hash).toBeUndefined();
    });

    it('should fail when email already exists', async () => {
      // First create a user
      await request(app).post('/api/v1/auth/signup').send(validSignupData);

      // Try to sign up with same email
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send(validSignupData);

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('ConflictError');
      expect(response.body.message).toContain('already exists');
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          ...validSignupData,
          email: 'not-an-email',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('ValidationError');
    });

    it('should fail with weak password (no uppercase)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          ...validSignupData,
          password: 'testpass123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('ValidationError');
      const details = response.body.details || [];
      const hasUppercaseError = details.some(
        (d: any) => d.message?.includes('uppercase')
      );
      expect(hasUppercaseError).toBe(true);
    });

    it('should fail with weak password (no lowercase)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          ...validSignupData,
          password: 'TESTPASS123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('ValidationError');
      const details = response.body.details || [];
      const hasLowercaseError = details.some(
        (d: any) => d.message?.includes('lowercase')
      );
      expect(hasLowercaseError).toBe(true);
    });

    it('should fail with weak password (no digit)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          ...validSignupData,
          password: 'TestPassWord!',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('ValidationError');
      const details = response.body.details || [];
      const hasDigitError = details.some(
        (d: any) => d.message?.includes('digit')
      );
      expect(hasDigitError).toBe(true);
    });

    it('should fail when password is too short (< 8 chars)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          ...validSignupData,
          password: 'T1!t',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('ValidationError');
    });

    it('should fail when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          email: 'test@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('ValidationError');
    });
  });

  // =====================================================
  // POST /api/v1/auth/login
  // =====================================================
  describe('POST /api/v1/auth/login', () => {
    const rawPassword = 'TestPass123!';

    beforeEach(async () => {
      await createTestUser({ email: 'login@test.com', display_name: 'Login Test', password_hash: rawPassword });
    });

    it('should log in a user with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@test.com',
          password: rawPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('login@test.com');
    });

    it('should fail with wrong password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@test.com',
          password: 'WrongPass123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('AuthenticationError');
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: rawPassword,
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('AuthenticationError');
    });

    it('should return an access token in the response', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@test.com',
          password: rawPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.tokens).toBeDefined();
      expect(response.body.data.tokens.access_token).toBeDefined();
      expect(response.body.data.tokens.token_type).toBe('Bearer');
      expect(typeof response.body.data.tokens.expires_in).toBe('number');
    });
  });

  // =====================================================
  // POST /api/v1/auth/logout
  // =====================================================
  describe('POST /api/v1/auth/logout', () => {
    it('should succeed with a valid token', async () => {
      const { token } = await createTestUser({ email: 'logout@test.com', display_name: 'Logout Test' });

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(204);
    });

    it('should fail when no token is provided (401)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('AuthenticationError');
    });
  });
});
