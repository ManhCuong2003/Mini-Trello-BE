import { Request, Response } from "express";
import Board from "../models/Board";
import { IRequestWithUser } from "../middleware/authMiddleware";
import mongoose from "mongoose";
import Column from "../models/Column";
import Task from "../models/Task";

// @desc    Lấy danh sách board của người dùng
// @route   GET /api/boards
// @access  Private
export const getBoards = async (req: IRequestWithUser, res: Response) => {
  try {
    const boards = await Board.find({ owner: req.user?._id });
    res.status(200).json(boards);
  } catch (error: any) {
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

// @desc    Lấy danh sách board của người dùng
// @route   GET /api/boards
// @access  Private
export const createBoard = async (req: IRequestWithUser, res: Response) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Input board name" });
  }
  try {
    const board = new Board({ name, owner: req.user?._id, columnOrders: [] });
    const createBoard = await board.save();
    res.status(201).json({ createBoard });
  } catch (error: any) {
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

// @desc    Lấy dữ liệu chi tiết của một board (gồm columns và tasks)
// @route   GET /api/boards/:boardId/data
// @access  Private
export const getBoardData = async (req: IRequestWithUser, res: Response) => {
  const { boardId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(boardId)) {
    return res.status(400).json({ message: "Board ID is invalid" });
  }
  try {
    const board = await Board.findOne({ _id: boardId, owner: req.user?._id });
    if (!board) {
      return res.status(404).json({ message: "Board not exist" });
    }
    const columns = await Column.find({ board: boardId });

    const tasks = await Task.find({ board: boardId });

    res.json({ board, columns, tasks });
  } catch (error: any) {
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

// @desc    Xóa một board
// @route   DELETE /api/boards/:boardId
// @access  Private
export const deleteBoard = async (req: IRequestWithUser, res: Response) => {
  const { boardId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(boardId)) {
    return res.status(400).json({ message: "Board ID is invalid" });
  }
  try {
    const board = await Board.findOne({ _id: boardId, owner: req.user?._id });
    if (!board) {
      return res.status(404).json({ message: "Board not exist" });
    }
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const columns = await Column.find({ board: boardId }).session(session);
      const columnIds = columns.map((col) => col._id);
      await Task.deleteMany({ column: { $in: columnIds } }).session(session);
      await Column.deleteMany({ board: boardId }).session(session);
      await Board.deleteOne({ _id: boardId });
      await session.commitTransaction();
      res.json({ message: "Board is deleted successfully" });
    } catch (error) {
      await session.abortTransaction();
      console.error("Transaction error during board deletion:", error);
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error: any) {
    console.error("Error deleting board:", error);
    if (
      error.constructor.name === "MongoError" ||
      error.constructor.name === "MongooseError"
    ) {
      res.status(500).json({
        message: "Delete board error (transaction failed), please try again.",
      });
    } else {
      res.status(500).json({ message: `Server error: ${error.message}` });
    }
  }
};
