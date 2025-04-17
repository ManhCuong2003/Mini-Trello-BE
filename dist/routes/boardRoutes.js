"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const boardController_1 = require("../controllers/boardController");
const router = express_1.default.Router();
router.use(authMiddleware_1.protect);
router
    .route("/")
    .get(boardController_1.getBoards)
    .post(boardController_1.createBoard);
router.route("/:boardId").delete(boardController_1.deleteBoard);
router.route("/:boardId/data").get(boardController_1.getBoardData);
exports.default = router;
