"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const columnController_1 = require("../controllers/columnController");
const router = express_1.default.Router();
router.use(authMiddleware_1.protect);
router.post("/boards/:boardId/columns", columnController_1.createColumn);
router.delete("/:columnId", columnController_1.deleteColumn);
exports.default = router;
