import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  getTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  toggleTodoCompletion,
  getTodoById,
} from '../services/todoService';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { getLogger } from '../utils/logger';

const logger = getLogger('todo-controller');

// Validation schemas
const todoIdSchema = z.object({
  id: z.string().uuid('Invalid todo ID'),
});

const createTodoSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(500, 'Title must be 500 characters or less')
    .transform((val) => val.trim()),
  description: z
    .string()
    .max(5000, 'Description must be 5000 characters or less')
    .optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  due_date: z
    .string()
    .datetime('Invalid due date format')
    .optional(),
  tags: z
    .array(
      z
        .string()
        .min(1, 'Tag cannot be empty')
        .max(30, 'Tag must be 30 characters or less')
        .regex(
          /^[a-z0-9_-]+$/,
          'Tags must be lowercase alphanumeric with hyphens and underscores only'
        )
    )
    .max(10, 'Maximum 10 tags allowed')
    .optional(),
});

const updateTodoSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(500, 'Title must be 500 characters or less')
    .transform((val) => val.trim())
    .optional(),
  description: z
    .string()
    .max(5000, 'Description must be 5000 characters or less')
    .nullable()
    .optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  due_date: z.string().datetime('Invalid due date format').nullable().optional(),
  is_completed: z.boolean().optional(),
  tags: z
    .array(
      z
        .string()
        .min(1, 'Tag cannot be empty')
        .max(30, 'Tag must be 30 characters or less')
        .regex(
          /^[a-z0-9_-]+$/,
          'Tags must be lowercase alphanumeric with hyphens and underscores only'
        )
    )
    .max(10, 'Maximum 10 tags allowed')
    .optional(),
});

const todoFiltersSchema = z.object({
  status: z.enum(['active', 'completed']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  tag: z.string().optional(),
  search: z.string().optional(),
  sort: z.enum(['created_at', 'due_date', 'priority', 'title']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20)),
});

export const validateCreateTodo = validateBody(createTodoSchema);
export const validateUpdateTodo = validateBody(updateTodoSchema);
export const validateTodoId = validateParams(todoIdSchema);
export const validateTodoFilters = validateQuery(todoFiltersSchema);

export async function getTodosHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const filters = req.query as {
      status?: 'active' | 'completed';
      priority?: 'low' | 'medium' | 'high';
      tag?: string;
      search?: string;
      sort?: 'created_at' | 'due_date' | 'priority' | 'title';
      order?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    };

    const result = await getTodos(userId, filters);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function createTodoHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const result = await createTodo(userId, req.body);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getTodoHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params as { id: string };
    const result = await getTodoById(id, userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateTodoHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params as { id: string };
    const result = await updateTodo(id, userId, req.body);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteTodoHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params as { id: string };
    await deleteTodo(id, userId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function toggleTodoHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const { id } = req.params as { id: string };
    const result = await toggleTodoCompletion(id, userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
