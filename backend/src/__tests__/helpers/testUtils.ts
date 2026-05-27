import { pool } from '@/config/database';
import { hashPassword } from '@/utils/hash';
import { generateToken } from '@/utils/jwt';
import { v4 as uuidv4 } from 'uuid';

interface TestUser {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  created_at: Date;
  updated_at: Date;
}

export async function createTestUser(
  overrides: Partial<TestUser> = {}
): Promise<{ user: TestUser; rawPassword: string; token: string }> {
  const rawPassword = overrides.password_hash || 'TestPass123!';
  const passwordHash = await hashPassword(rawPassword);
  const email = overrides.email || `test-${Date.now()}@example.com`;
  const displayName = overrides.display_name || 'Test User';

  const result = await pool.query<TestUser>(
    `INSERT INTO users (email, password_hash, display_name) 
     VALUES ($1, $2, $3) 
     RETURNING id, email, password_hash, display_name, created_at, updated_at`,
    [email, passwordHash, displayName]
  );

  const user = result.rows[0];
  if (!user) {
    throw new Error('Failed to create test user');
  }
  const token = generateToken(user.id);

  return { user, rawPassword, token };
}

export function generateAuthToken(userId: string): string {
  return generateToken(userId);
}

export async function createTestTodo(
  userId: string,
  data: {
    title?: string;
    description?: string | null;
    priority?: 'low' | 'medium' | 'high';
    is_completed?: boolean;
    tags?: string[];
  } = {}
): Promise<{ id: string; title: string; user_id: string }> {
  const todoResult = await pool.query(
    `INSERT INTO todos (user_id, title, description, priority, is_completed, due_date)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [
      userId,
      data.title ?? 'Test Todo',
      data.description ?? null,
      data.priority ?? 'medium',
      data.is_completed ?? false,
      null,
    ]
  );

  const todo = todoResult.rows[0];

  if (data.tags && data.tags.length > 0) {
    for (const tagName of data.tags) {
      const tagResult = await pool.query(
        `INSERT INTO tags (user_id, name)
         VALUES ($1, $2)
         ON CONFLICT (user_id, name) DO UPDATE SET name = $2
         RETURNING id`,
        [userId, tagName.toLowerCase()]
      );

      await pool.query(
        'INSERT INTO todo_tags (todo_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [todo.id, tagResult.rows[0].id]
      );
    }
  }

  return todo;
}
