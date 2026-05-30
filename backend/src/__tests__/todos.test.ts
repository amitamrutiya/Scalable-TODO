import request from 'supertest';
import { createTestApp } from './helpers/testApp';
import { cleanupTestData } from './helpers/database';
import { createTestUser, createTestTodo } from './helpers/testUtils';

const app = createTestApp();

describe('Todo Endpoints', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  // =====================================================
  // GET /api/v1/todos
  // =====================================================
  describe('GET /api/v1/todos', () => {
    it('should list todos with pagination', async () => {
      const { user, token } = await createTestUser();
      await createTestTodo(user.id, { title: 'Todo 1' });
      await createTestTodo(user.id, { title: 'Todo 2' });

      const response = await request(app)
        .get('/api/v1/todos?page=1&limit=1')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.todos).toHaveLength(1);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(1);
      expect(response.body.data.pagination.total).toBe(2);
      expect(response.body.data.pagination.total_pages).toBe(2);
    });

    it('should filter by status=active', async () => {
      const { user, token } = await createTestUser();
      await createTestTodo(user.id, { title: 'Active Todo', is_completed: false });
      await createTestTodo(user.id, { title: 'Completed Todo', is_completed: true });

      const response = await request(app)
        .get('/api/v1/todos?status=active')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.todos).toHaveLength(1);
      expect(response.body.data.todos[0].title).toBe('Active Todo');
    });

    it('should filter by status=completed', async () => {
      const { user, token } = await createTestUser();
      await createTestTodo(user.id, { title: 'Active Todo', is_completed: false });
      await createTestTodo(user.id, { title: 'Completed Todo', is_completed: true });

      const response = await request(app)
        .get('/api/v1/todos?status=completed')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.todos).toHaveLength(1);
      expect(response.body.data.todos[0].title).toBe('Completed Todo');
    });

    it('should filter by priority', async () => {
      const { user, token } = await createTestUser();
      await createTestTodo(user.id, { title: 'High Priority', priority: 'high' });
      await createTestTodo(user.id, { title: 'Low Priority', priority: 'low' });

      const response = await request(app)
        .get('/api/v1/todos?priority=high')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.todos).toHaveLength(1);
      expect(response.body.data.todos[0].priority).toBe('high');
    });

    it('should search by text in title', async () => {
      const { user, token } = await createTestUser();
      await createTestTodo(user.id, { title: 'Buy groceries' });
      await createTestTodo(user.id, { title: 'Walk the dog' });

      const response = await request(app)
        .get('/api/v1/todos?search=groceries')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.todos).toHaveLength(1);
      expect(response.body.data.todos[0].title).toBe('Buy groceries');
    });

    it('should search by text in description', async () => {
      const { user, token } = await createTestUser();
      await createTestTodo(user.id, { title: 'Task 1', description: 'This is about groceries' });
      await createTestTodo(user.id, { title: 'Task 2', description: 'Walk the dog' });

      const response = await request(app)
        .get('/api/v1/todos?search=groceries')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.todos).toHaveLength(1);
      expect(response.body.data.todos[0].title).toBe('Task 1');
    });

    it('should sort by different fields', async () => {
      const { user, token } = await createTestUser();
      await createTestTodo(user.id, { title: 'Alpha' });
      await createTestTodo(user.id, { title: 'Beta' });

      const response = await request(app)
        .get('/api/v1/todos?sort=title&order=asc')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.todos[0].title).toBe('Alpha');
      expect(response.body.data.todos[1].title).toBe('Beta');
    });

    it('should fail when no token is provided', async () => {
      const response = await request(app)
        .get('/api/v1/todos');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('AuthenticationError');
    });
  });

  // =====================================================
  // POST /api/v1/todos
  // =====================================================
  describe('POST /api/v1/todos', () => {
    it('should create a todo with all fields', async () => {
      const { token } = await createTestUser();
      const dueDate = new Date('2026-12-31T23:59:59Z').toISOString();

      const response = await request(app)
        .post('/api/v1/todos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Complete Todo',
          description: 'A detailed description',
          priority: 'high',
          due_date: dueDate,
          tags: ['urgent', 'work'],
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Complete Todo');
      expect(response.body.data.description).toBe('A detailed description');
      expect(response.body.data.priority).toBe('high');
      expect(response.body.data.tags).toContain('urgent');
      expect(response.body.data.tags).toContain('work');
    });

    it('should create a todo with minimal fields (title only)', async () => {
      const { token } = await createTestUser();

      const response = await request(app)
        .post('/api/v1/todos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Minimal Todo',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.title).toBe('Minimal Todo');
      expect(response.body.data.priority).toBe('medium');
      expect(response.body.data.is_completed).toBe(false);
      expect(response.body.data.tags).toEqual([]);
    });

    it('should fail when title is missing', async () => {
      const { token } = await createTestUser();

      const response = await request(app)
        .post('/api/v1/todos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'No title here',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('ValidationError');
    });

    it('should fail when title is too long (> 500 chars)', async () => {
      const { token } = await createTestUser();
      const longTitle = 'a'.repeat(501);

      const response = await request(app)
        .post('/api/v1/todos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: longTitle,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('ValidationError');
    });

    it('should fail with invalid priority', async () => {
      const { token } = await createTestUser();

      const response = await request(app)
        .post('/api/v1/todos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Invalid Priority',
          priority: 'critical',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('ValidationError');
    });

    it('should fail with too many tags (> 10)', async () => {
      const { token } = await createTestUser();

      const response = await request(app)
        .post('/api/v1/todos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Tagged Todo',
          tags: ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 't10', 't11'],
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('ValidationError');
    });

    it('should fail with invalid tag format', async () => {
      const { token } = await createTestUser();

      const response = await request(app)
        .post('/api/v1/todos')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Tagged Todo',
          tags: ['ValidTag', 'INVALID_TAG'], // INVALID_TAG has uppercase, spaces, special chars
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('ValidationError');
    });

    it('should fail when unauthorized (no token)', async () => {
      const response = await request(app)
        .post('/api/v1/todos')
        .send({
          title: 'Unauthorized Todo',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('AuthenticationError');
    });
  });

  // =====================================================
  // PATCH /api/v1/todos/:id
  // =====================================================
  describe('PATCH /api/v1/todos/:id', () => {
    it('should update todo title', async () => {
      const { user, token } = await createTestUser();
      const todo = await createTestTodo(user.id, { title: 'Old Title' });

      const response = await request(app)
        .patch(`/api/v1/todos/${todo.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'New Title',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('New Title');
    });

    it('should update todo priority', async () => {
      const { user, token } = await createTestUser();
      const todo = await createTestTodo(user.id, { title: 'Priority Todo', priority: 'low' });

      const response = await request(app)
        .patch(`/api/v1/todos/${todo.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          priority: 'high',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.priority).toBe('high');
    });

    it('should toggle completion status via direct update', async () => {
      const { user, token } = await createTestUser();
      const todo = await createTestTodo(user.id, { title: 'Toggle Todo', is_completed: false });

      const response = await request(app)
        .patch(`/api/v1/todos/${todo.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          is_completed: true,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.is_completed).toBe(true);
    });

    it('should toggle completion status via toggle endpoint', async () => {
      const { user, token } = await createTestUser();
      const todo = await createTestTodo(user.id, { title: 'Toggle Todo', is_completed: false });

      const response = await request(app)
        .patch(`/api/v1/todos/${todo.id}/toggle`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.is_completed).toBe(true);
    });

    it('should fail to update non-existent todo (404)', async () => {
      const { token } = await createTestUser();
      const fakeId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

      const response = await request(app)
        .patch(`/api/v1/todos/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Should Fail',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('NotFoundError');
    });

    it('should fail to update another users todo', async () => {
      const { user: user1, token: token1 } = await createTestUser({ email: 'user1@test.com' });
      const { token: token2 } = await createTestUser({ email: 'user2@test.com' });
      const todo = await createTestTodo(user1.id, { title: 'Private Todo' });

      const response = await request(app)
        .patch(`/api/v1/todos/${todo.id}`)
        .set('Authorization', `Bearer ${token2}`)
        .send({
          title: 'Hacked',
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('NotFoundError');
    });

    it('should fail when unauthorized', async () => {
      const { user } = await createTestUser();
      const todo = await createTestTodo(user.id, { title: 'Secure Todo' });

      const response = await request(app)
        .patch(`/api/v1/todos/${todo.id}`)
        .send({
          title: 'Unauthorized Update',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('AuthenticationError');
    });
  });

  // =====================================================
  // DELETE /api/v1/todos/:id
  // =====================================================
  describe('DELETE /api/v1/todos/:id', () => {
    it('should soft delete own todo', async () => {
      const { user, token } = await createTestUser();
      const todo = await createTestTodo(user.id, { title: 'To Delete' });

      const deleteResponse = await request(app)
        .delete(`/api/v1/todos/${todo.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(deleteResponse.status).toBe(200);

      // Verify it's not in the list anymore
      const listResponse = await request(app)
        .get('/api/v1/todos')
        .set('Authorization', `Bearer ${token}`);

      expect(listResponse.body.data.todos).toHaveLength(0);
    });

    it('should fail to delete non-existent todo (404)', async () => {
      const { token } = await createTestUser();
      const fakeId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

      const response = await request(app)
        .delete(`/api/v1/todos/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('NotFoundError');
    });

    it('should fail to delete another users todo', async () => {
      const { user: user1, token: token1 } = await createTestUser({ email: 'owner@test.com' });
      const { token: token2 } = await createTestUser({ email: 'attacker@test.com' });
      const todo = await createTestTodo(user1.id, { title: 'Protected' });

      const response = await request(app)
        .delete(`/api/v1/todos/${todo.id}`)
        .set('Authorization', `Bearer ${token2}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('NotFoundError');
    });

    it('should fail when unauthorized', async () => {
      const { user } = await createTestUser();
      const todo = await createTestTodo(user.id, { title: 'Secure' });

      const response = await request(app)
        .delete(`/api/v1/todos/${todo.id}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('AuthenticationError');
    });
  });

  // =====================================================
  // GET /api/v1/todos/:id (single todo)
  // =====================================================
  describe('GET /api/v1/todos/:id', () => {
    it('should get a specific todo by id', async () => {
      const { user, token } = await createTestUser();
      const todo = await createTestTodo(user.id, { title: 'Specific Todo', tags: ['tag1'] });

      const response = await request(app)
        .get(`/api/v1/todos/${todo.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Specific Todo');
      expect(response.body.data.tags).toContain('tag1');
    });

    it('should fail for non-existent todo (404)', async () => {
      const { token } = await createTestUser();
      const fakeId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

      const response = await request(app)
        .get(`/api/v1/todos/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('NotFoundError');
    });

    it('should fail when unauthorized', async () => {
      const { user } = await createTestUser();
      const todo = await createTestTodo(user.id, { title: 'Secure' });

      const response = await request(app)
        .get(`/api/v1/todos/${todo.id}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('AuthenticationError');
    });
  });
});
