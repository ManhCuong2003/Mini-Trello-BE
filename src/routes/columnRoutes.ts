import express, { RequestHandler } from "express";
import { protect } from "../middleware/authMiddleware";
import { createColumn, deleteColumn } from "../controllers/columnController";

const router = express.Router();

router.use(protect as RequestHandler);

router.post("/boards/:boardId/columns", createColumn as RequestHandler);

router.delete("/:columnId", deleteColumn as RequestHandler);

export default router;
