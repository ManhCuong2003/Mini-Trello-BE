import express, { RequestHandler } from "express";
import { protect } from "../middleware/authMiddleware";
import {
  createBoard,
  deleteBoard,
  getBoardData,
  getBoards,
} from "../controllers/boardController";

const router = express.Router();

router.use(protect as RequestHandler);

router
  .route("/")
  .get(getBoards as RequestHandler)
  .post(createBoard as RequestHandler);

router.route("/:boardId").delete(deleteBoard as RequestHandler);

router.route("/:boardId/data").get(getBoardData as RequestHandler);

export default router;
