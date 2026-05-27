import { pool } from '../config/database';
import { PoolClient } from 'pg';
import { Todo, TodoWithTags, Tag, PaginatedResponse } from '../types';
import { ValidationError, NotFoundError, ForbiddenError } from '../utils/errors';
import { getLogger } from '../utils/logger';

const logger = getLogger('todo-service');

export interface CreateTodoData {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string;
  tags?: string[];
}

export interface UpdateTodoData {
  title?: string;
  description?: string | null;
  priority?: 'low' | 'medium' | 'high';
  due_date?: string | null;
  is_completed?: boolean;
  tags?: string[];
}

export interface TodoFilters {
  status?: 'active' | 'completed';
  priority?: 'low' | 'medium' | 'high';
  tag?: string;
  search?: string;
  sort?: 'created_at' | 'due_date' | 'priority' | 'title';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

function mapTodoWithTags(row: Record<string, unknown>): TodoWithTags {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    title: row.title as string,
    description: row.description as string | null,
    is_completed: row.is_completed as boolean,
    priority: row.priority as 'low' | 'medium' | 'high',
    due_date: row.due_date ? new Date(row.due_date as string) : null,
    created_at: new Date(row.created_at as string),
    updated_at: new Date(row.updated_at as string),
    deleted_at: row.deleted_at ? new Date(row.deleted_at as string) : null,
    tags: (row.tags as string[]) || [],
  };
}

function buildTodoQuery(userId: string, filters: TodoFilters): { 
  whereClause: string; 
  params: (string | number | boolean | null)[];
  paramIndex: number;
} {
  const conditions: string[] = ['t.user_id = $1', 't.deleted_at IS NULL'];
  const params: (string | number | boolean | null)[] = [userId];
  let paramIndex = 2;

  if (filters.status === 'active') {
    conditions.push(`t.is_completed = $${paramIndex++}`);
    params.push(false);
  } else if (filters.status === 'completed') {
    conditions.push(`t.is_completed = $${paramIndex++}`);
    params.push(true);
  }

  if (filters.priority) {
    conditions.push(`t.priority = $${paramIndex++}`);
    params.push(filters.priority);
  }

  if (filters.tag) {
    conditions.push(`EXISTS (
      SELECT 1 FROM todo_tags tt2 
      JOIN tags tg2 ON tt2.tag_id = tg2.id 
      WHERE tt2.todo_id = t.id AND tg2.name = $${paramIndex++}
    )`);
    params.push(filters.tag.toLowerCase());
  }

  if (filters.search) {
    conditions.push(`(t.title ILIKE $${paramIndex++} OR t.description ILIKE $${paramIndex++})`);
    const searchPattern = `%${filters.search}%`;
    params.push(searchPattern, searchPattern);
  }

  return {
    whereClause: conditions.join(' AND '),
    params,
    paramIndex,
  };
}

export async function getTodos(
  userId: string,
  filters: TodoFilters
): Promise<PaginatedResponse<TodoWithTags>> {
  const page = Math.max(1, filters.page || 1);
  const limit = Math.min(100, Math.max(1, filters.limit || 20));
  const offset = (page - 1) * limit;

  const { whereClause, params, paramIndex } = buildTodoQuery(userId, filters);

  const sortColumn = filters.sort || 'created_at';
  const sortOrder = filters.order === 'asc' ? 'ASC' : 'DESC';

  // Valid sort columns to prevent SQL injection
  const validSortColumns: Record<string, string> = {
    created_at: 't.created_at',
    due_date: 't.due_date',
    priority: 't.priority',
    title: 't.title',
  };

  const orderByColumn = validSortColumns[sortColumn] || 't.created_at';

  try {
    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM todos t WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get todos with tags
    const queryParams = [...params, limit, offset];
    const todosResult = await pool.query(
      `SELECT 
        t.*,
        COALESCE(
          ARRAY_AGG(tg.name) FILTER (WHERE tg.name IS NOT NULL),
          ARRAY[]::VARCHAR[]
        ) as tags
      FROM todos t
      LEFT JOIN todo_tags tt ON t.id = tt.todo_id
      LEFT JOIN tags tg ON tt.tag_id = tg.id
      WHERE ${whereClause}
      GROUP BY t.id
      ORDER BY ${orderByColumn} ${sortOrder}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      queryParams
    );

    const todos = todosResult.rows.map(mapTodoWithTags);
    const totalPages = Math.ceil(total / limit);

    return {
      data: todos,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    };
  } catch (error) {
    logger.error('Failed to get todos', { error: (error as Error).message, userId });
    throw error;
  }
}

export async function getTodoById(todoId: string, userId: string): Promise<TodoWithTags> {
  try {
    const result = await pool.query(
      `SELECT 
        t.*,
        COALESCE(
          ARRAY_AGG(tg.name) FILTER (WHERE tg.name IS NOT NULL),
          ARRAY[]::VARCHAR[]
        ) as tags
      FROM todos t
      LEFT JOIN todo_tags tt ON t.id = tt.todo_id
      LEFT JOIN tags tg ON tt.tag_id = tg.id
      WHERE t.id = $1 AND t.user_id = $2 AND t.deleted_at IS NULL
      GROUP BY t.id`,
      [todoId, userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Todo');
    }

    return mapTodoWithTags(result.rows[0]);
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Failed to get todo', { error: (error as Error).message, todoId, userId });
    throw error;
  }
}

export async function createTodo(userId: string, data: CreateTodoData): Promise<TodoWithTags> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Insert todo
    const todoResult = await client.query<Todo>(
      `INSERT INTO todos (user_id, title, description, priority, due_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        userId,
        data.title.trim(),
        data.description || null,
        data.priority || 'medium',
        data.due_date || null,
      ]
    );

    const todo = todoResult.rows[0];
    if (!todo) {
      throw new Error('Failed to create todo');
    }

    // Handle tags if provided
    if (data.tags && data.tags.length > 0) {
      await linkTagsToTodo(client, todo.id, userId, data.tags);
    }

    await client.query('COMMIT');

    logger.info('Todo created', { todoId: todo.id, userId });

    // Fetch the todo with tags to return
    return getTodoById(todo.id, userId);
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Failed to create todo', { error: (error as Error).message, userId });
    throw error;
  } finally {
    client.release();
  }
}

export async function updateTodo(
  todoId: string,
  userId: string,
  data: UpdateTodoData
): Promise<TodoWithTags> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if todo exists and belongs to user
    const existingResult = await client.query(
      'SELECT id FROM todos WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL',
      [todoId, userId]
    );

    if (existingResult.rows.length === 0) {
      throw new NotFoundError('Todo');
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: (string | number | boolean | null)[] = [];
    let paramIndex = 1;

    if (data.title !== undefined) {
      updates.push(`title = $${paramIndex++}`);
      values.push(data.title.trim());
    }

    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }

    if (data.priority !== undefined) {
      updates.push(`priority = $${paramIndex++}`);
      values.push(data.priority);
    }

    if (data.due_date !== undefined) {
      updates.push(`due_date = $${paramIndex++}`);
      values.push(data.due_date);
    }

    if (data.is_completed !== undefined) {
      updates.push(`is_completed = $${paramIndex++}`);
      values.push(data.is_completed);
    }

    if (updates.length === 0 && !data.tags) {
      throw new ValidationError('No fields to update');
    }

    // Execute update if there are fields to update
    if (updates.length > 0) {
      values.push(todoId);
      await client.query(
        `UPDATE todos SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
        values
      );
    }

    // Handle tag updates if provided
    if (data.tags !== undefined) {
      // Remove existing tags
      await client.query('DELETE FROM todo_tags WHERE todo_id = $1', [todoId]);

      // Add new tags
      if (data.tags.length > 0) {
        await linkTagsToTodo(client, todoId, userId, data.tags);
      }
    }

    await client.query('COMMIT');

    logger.info('Todo updated', { todoId, userId });

    return getTodoById(todoId, userId);
  } catch (error) {
    await client.query('ROLLBACK');
    if (error instanceof NotFoundError || error instanceof ValidationError) throw error;
    logger.error('Failed to update todo', { error: (error as Error).message, todoId, userId });
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteTodo(todoId: string, userId: string): Promise<void> {
  try {
    const result = await pool.query(
      `UPDATE todos 
       SET deleted_at = NOW() 
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
       RETURNING id`,
      [todoId, userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Todo');
    }

    logger.info('Todo soft deleted', { todoId, userId });
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Failed to delete todo', { error: (error as Error).message, todoId, userId });
    throw error;
  }
}

export async function toggleTodoCompletion(todoId: string, userId: string): Promise<TodoWithTags> {
  try {
    const result = await pool.query<Todo>(
      `UPDATE todos 
       SET is_completed = NOT is_completed 
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL
       RETURNING *`,
      [todoId, userId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundError('Todo');
    }

    logger.info('Todo completion toggled', { todoId, userId });

    return getTodoById(todoId, userId);
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    logger.error('Failed to toggle todo', { error: (error as Error).message, todoId, userId });
    throw error;
  }
}

async function linkTagsToTodo(
  client: PoolClient,
  todoId: string,
  userId: string,
  tagNames: string[]
): Promise<void> {
  // Normalize tags
  const normalizedTags = tagNames.map((tag) => tag.toLowerCase().trim());

  // Get or create tags
  const tagIds: string[] = [];

  for (const tagName of normalizedTags) {
    // Try to find existing tag
    const existingTag = await client.query<Tag>(
      'SELECT id FROM tags WHERE user_id = $1 AND name = $2',
      [userId, tagName]
    );

    if (existingTag.rows.length > 0) {
      const tagRow = existingTag.rows[0];
      if (tagRow) {
        tagIds.push(tagRow.id);
      }
    } else {
      // Create new tag
      const newTag = await client.query<Tag>(
        'INSERT INTO tags (user_id, name) VALUES ($1, $2) RETURNING id',
        [userId, tagName]
      );
      const newTagRow = newTag.rows[0];
      if (newTagRow) {
        tagIds.push(newTagRow.id);
      }
    }
  }

  // Link tags to todo
  for (const tagId of tagIds) {
    await client.query(
      'INSERT INTO todo_tags (todo_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [todoId, tagId]
    );
  }
}
