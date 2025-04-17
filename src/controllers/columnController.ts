import { Response } from "express";
import { IRequestWithUser } from "../middleware/authMiddleware";
import mongoose from "mongoose";
import Board from "../models/Board";
import Column, { IColumn } from "../models/Column";
import Task from "../models/Task";

// @desc    Tạo cột mới trong một bảng
// @route   POST /api/columns/boards/:boardId/columns
// @access  Private
export const createColumn = async (req: IRequestWithUser, res: Response) => {
  const { boardId } = req.params;
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: "Input column name" });
  }
  if (!mongoose.Types.ObjectId.isValid(boardId)) {
    return res.status(400).json({ message: "Board ID invalid" });
  }

  try {
    const board = await Board.findOne({ _id: boardId, owner: req.user?._id });
    if (!board) {
      return res.status(404).json({ message: "Board not exist" });
    }

    const newColumn = new Column({
      name,
      board: boardId,
      taskOrder: [],
    });
    const savedColumn = await newColumn.save();
    board.columnOrder.push(savedColumn.id as mongoose.Types.ObjectId);
    await board.save();
    res.status(201).json(savedColumn);
  } catch (error: any) {
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

// @desc    Xóa một cột
// @route   DELETE /api/columns/:columnId
// @access  Private
export const deleteColumn = async (req: IRequestWithUser, res: Response) => {
  const { columnId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(columnId)) {
    return res.status(400).json({ message: "Column ID invalid" });
  }

  try {
    const column = await Column.findById(columnId);
    if (!column) {
      return res.status(404).json({ message: "Column not exist" });
    }

    const board = await Board.findOne({
      _id: column.board,
      owner: req.user?._id,
    });
    if (!board) {
      return res.status(404).json({ message: "Board not exist" });
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await Task.deleteMany({ column: columnId }).session(session);
      await Column.deleteOne({ _id: columnId }).session(session);
      board.columnOrder = board.columnOrder.filter(
        (colId) => colId.toString() !== columnId.toString()
      );
      await board.save({ session });
      await session.commitTransaction();
      res.json({ message: "Column is deleted successfully" });
    } catch (error) {
      await session.abortTransaction();
      console.error("Transaction error during column deletion:", error);
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error: any) {
    console.error("Error deleting column:", error);
    if (
      error.constructor.name === "MongoError" ||
      error.constructor.name === "MongooseError"
    ) {
      res.status(500).json({
        message: "Delete column error (transaction failed), please try again.",
      });
    } else {
      res.status(500).json({ message: `Server error: ${error.message}` });
    }
  }
};
