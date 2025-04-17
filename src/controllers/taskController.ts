import { Response } from "express";
import { IRequestWithUser } from "../middleware/authMiddleware";
import mongoose from "mongoose";
import Column from "../models/Column";
import Board from "../models/Board";
import Task from "../models/Task";

// @desc    Tạo task mới trong một cột
// @route   POST /api/tasks/columns/:columnId/tasks
// @access  Private
export const createTask = async (req: IRequestWithUser, res: Response) => {
  const { columnId } = req.params;
  const { title, description } = req.body;
  if (!title) {
    return res.status(400).json({ message: "Enter the task's title." });
  }
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
      return res.status(403).json({
        message: "You do not have permission to add tasks to this column.",
      });
    }

    const newTask = new Task({
      title,
      board: column.board,
      column: columnId,
      description: description || "",
    });
    const savedTask = await newTask.save();

    column.taskOrder.push(savedTask.id as mongoose.Types.ObjectId);
    await column.save();
    res.status(201).json(savedTask);
  } catch (error: any) {
    res.status(500).json({ message: `Server error: ${error.message}` });
  }
};

// @desc    Xóa một task
// @route   DELETE /api/tasks/:taskId
// @access  Private
export const deleteTask = async (req: IRequestWithUser, res: Response) => {
  const { taskId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(taskId)) {
    return res.status(400).json({ message: "Task ID invalid" });
  }
  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not exist" });
    }
    const board = await Board.findOne({
      _id: task.board,
      owner: req.user?._id,
    });
    if (!board) {
      return res
        .status(403)
        .json({ message: "You do not have permission to delete this task." });
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await Task.deleteOne({ _id: taskId }).session(session);
      await Column.updateOne(
        { _id: task.column },
        { $pull: { taskOrder: taskId } }
      ).session(session);
      await session.commitTransaction();
      res.json({ message: "Task is deleted successfully" });
    } catch (error) {
      await session.abortTransaction();
      console.error("Transaction error during task deletion:", error);
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error: any) {
    console.error("Error deleting task:", error);
    if (
      error.constructor.name === "MongoError" ||
      error.constructor.name === "MongooseError"
    ) {
      res.status(500).json({
        message: "Delete task error (transaction failed), try again.",
      });
    } else {
      res.status(500).json({ message: `Server error: ${error.message}` });
    }
  }
};

// @desc    Di chuyển task (xử lý drag & drop)
// @route   PUT /api/tasks/:taskId/move
// @access  Private
export const moveTask = async (req: IRequestWithUser, res: Response) => {
  const { taskId } = req.params;
  const {
    sourceColumnId, // Column ID nguồn
    destColumnId, // Column ID đích
    sourceIndex, // Vị trí index cũ trong sourceColumn.taskOrder
    destIndex, // Vị trí index mới trong destColumn.taskOrder
  } = req.body;

  if (
    !mongoose.Types.ObjectId.isValid(taskId) ||
    !mongoose.Types.ObjectId.isValid(sourceColumnId) ||
    !mongoose.Types.ObjectId.isValid(destColumnId) ||
    typeof sourceIndex !== "number" ||
    sourceIndex < 0 ||
    typeof destIndex !== "number" ||
    destIndex < 0
  ) {
    return res.status(400).json({ message: "Invalid migration data" });
  }
  try {
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not exist" });
    }
    const board = await Board.findOne({
      _id: task.board,
      owner: req.user?._id,
    });
    if (!board) {
      return res
        .status(403)
        .json({ message: "You do not have permission to delete this task." });
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // Lấy sourceColumn và destColumn
      const sourceColumn = await Column.findById(sourceColumnId).session(
        session
      );
      const destColumn =
        sourceColumnId === destColumnId
          ? sourceColumn
          : await Column.findById(destColumnId).session(session);

      if (!sourceColumn || !destColumn) {
        await session.abortTransaction();
        return res
          .status(400)
          .json({ message: "sourceColumn or destColumn not exist" });
      }

      // Xóa taskId khỏi sourceColumn.taskOrder
      const sourceTaskOrder = sourceColumn.taskOrder;
      sourceTaskOrder.splice(sourceIndex, 1);

      // Nếu di chuyển sang cột khác, cập nhật task.column
      if (sourceColumnId !== destColumnId) {
        task.column = new mongoose.Types.ObjectId(destColumnId);
        await task.save({ session });
      }

      // Chèn taskId vào destColumn.taskOrder tại vị trí mới
      const destTaskOrder = destColumn.taskOrder;
      destTaskOrder.splice(destIndex, 0, new mongoose.Types.ObjectId(taskId));

      //Lưu thay đổi của cả 2 column (nếu khác nhau)
      await sourceColumn.save({ session });
      if (sourceColumnId !== destColumnId) {
        await destColumn.save({ session });
      }

      await session.commitTransaction();
      res.json({ message: "Move task successfully" });
    } catch (error) {
      await session.abortTransaction();
      console.error("Transaction error during task move:", error);
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error: any) {
    console.error("Error moving task:", error);
    if (
      error.constructor.name === "MongoError" ||
      error.constructor.name === "MongooseError"
    ) {
      res.status(500).json({
        message: "Move task error (transaction failed), try again.",
      });
    } else {
      res.status(500).json({ message: `Server error: ${error.message}` });
    }
  }
};
