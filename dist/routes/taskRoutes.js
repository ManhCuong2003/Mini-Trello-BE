"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const taskController_1 = require("../controllers/taskController");
const router = express_1.default.Router();
router.use(authMiddleware_1.protect);
router.post('/columns/:columnId/tasks', taskController_1.createTask);
router.delete('/:taskId', taskController_1.deleteTask);
// Route đặc biệt để xử lý kéo thả task
router.put('/:taskId/move', taskController_1.moveTask);
exports.default = router;
