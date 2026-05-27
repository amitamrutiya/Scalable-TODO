import request from 'supertest';
import { createTestApp } from './helpers/testApp';
import { cleanupTestData } from './helpers/database';
import { createTestUser, createTestTodo } from './helpers/testUtils';

const app = createTestApp();

describe('User Endpoints', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  // =====================================================
  // GET /api/v1/users/me
  // =====================================================
  describe('GET /api/v1/users/me', () => {
    it('should get own profile', async () => {
      const { user, token } = await createTestUser({
        email: 'me@test.com',
        display_name: 'Myself',
      });

      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('me@test.com');
      expect(response.body.data.display_name).toBe('Myself');
      expect(response.body.data.id).toBe(user.id);
    });

    it('should include todo stats in profile', async () => {
      const { user, token } = await createTestUser({
        email: 'stats@test.com',
        display_name: 'Stats User',
      });

      await createTestTodo(user.id, { title: 'Completed 1', is_completed: true });
      await createTestTodo(user.id, { title: 'Pending 1', is_completed: false });
      await createTestTodo(user.id, { title: 'Pending 2', is_completed: false });

      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.stats).toBeDefined();
      expect(response.body.data.stats.total_todos).toBe(3);
      expect(response.body.data.stats.completed_todos).toBe(1);
      expect(response.body.data.stats.pending_todos).toBe(2);
    });

    it('should return zero stats for user with no todos', async () => {
      const { token } = await createTestUser({
        email: 'notodos@test.com',
        display_name: 'No Todos',
      });

      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.stats.total_todos).toBe(0);
      expect(response.body.data.stats.completed_todos).toBe(0);
      expect(response.body.data.stats.pending_todos).toBe(0);
    });

    it('should fail when unauthorized', async () => {
      const response = await request(app)
        .get('/api/v1/users/me');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('AuthenticationError');
    });
  });

  // =====================================================
  // PATCH /api/v1/users/me
  // =====================================================
  describe('PATCH /api/v1/users/me', () => {
    const originalPassword = 'OriginalPass123!';

    it('should update display name', async () => {
      const { token } = await createTestUser({
        email: 'update@test.com',
        display_name: 'Before Update',
        password_hash: originalPassword,
      });

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          display_name: 'After Update',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.display_name).toBe('After Update');
    });

    it('should update password when current password is provided', async () => {
      const { token } = await createTestUser({
        email: 'password@test.com',
        display_name: 'Password User',
        password_hash: originalPassword,
      });

      const newPassword = 'NewSecurePass456!';
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          current_password: originalPassword,
          new_password: newPassword,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify the new password works by logging in
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'password@test.com',
          password: newPassword,
        });

      expect(loginResponse.status).toBe(200);
    });

    it('should fail to update password without current password', async () => {
      const { token } = await createTestUser({
        email: 'nocurrent@test.com',
        display_name: 'No Current Pass',
        password_hash: originalPassword,
      });

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          new_password: 'NewSecurePass456!',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('ValidationError');
    });

    it('should fail with weak new password', async () => {
      const { token } = await createTestUser({
        email: 'weakpass@test.com',
        display_name: 'Weak Pass User',
        password_hash: originalPassword,
      });

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          current_password: originalPassword,
          new_password: 'weak',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('ValidationError');
    });

    it('should fail to update password with wrong current password', async () => {
      const { token } = await createTestUser({
        email: 'wrongcurrent@test.com',
        display_name: 'Wrong Current',
        password_hash: originalPassword,
      });

      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          current_password: 'WrongCurrentPass123!',
          new_password: 'NewSecurePass456!',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('ValidationError');
      expect(response.body.message).toContain('Current password is incorrect');
    });

    it('should fail when unauthorized', async () => {
      const response = await request(app)
        .patch('/api/v1/users/me')
        .send({
          display_name: 'Hacker',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('AuthenticationError');
    });
  });
});
