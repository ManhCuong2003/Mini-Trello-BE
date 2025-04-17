import express, { RequestHandler } from 'express';
import { protect } from '../middleware/authMiddleware';
import { createTask, deleteTask, moveTask } from '../controllers/taskController';

const router = express.Router();

router.use(protect as RequestHandler);

router.post('/columns/:columnId/tasks', createTask as RequestHandler);

router.delete('/:taskId', deleteTask as RequestHandler);

// Route đặc biệt để xử lý kéo thả task
router.put('/:taskId/move', moveTask as RequestHandler);

export default router;