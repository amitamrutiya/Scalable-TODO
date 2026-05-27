import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getTodosHandler,
  createTodoHandler,
  getTodoHandler,
  updateTodoHandler,
  deleteTodoHandler,
  toggleTodoHandler,
  validateCreateTodo,
  validateUpdateTodo,
  validateTodoId,
  validateTodoFilters,
} from '../controllers/todoController';

const router = Router();

// Apply auth middleware to all todo routes
router.use(authenticateToken);

router.get('/', validateTodoFilters, getTodosHandler);
router.post('/', validateCreateTodo, createTodoHandler);
router.get('/:id', validateTodoId, getTodoHandler);
router.patch('/:id', validateTodoId, validateUpdateTodo, updateTodoHandler);
router.delete('/:id', validateTodoId, deleteTodoHandler);
router.patch('/:id/toggle', validateTodoId, toggleTodoHandler);

export default router;
