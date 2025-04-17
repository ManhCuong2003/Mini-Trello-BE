"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.moveTask = exports.deleteTask = exports.createTask = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Column_1 = __importDefault(require("../models/Column"));
const Board_1 = __importDefault(require("../models/Board"));
const Task_1 = __importDefault(require("../models/Task"));
// @desc    Tạo task mới trong một cột
// @route   POST /api/tasks/columns/:columnId/tasks
// @access  Private
const createTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { columnId } = req.params;
    const { title, description } = req.body;
    if (!title) {
        return res.status(400).json({ message: "Enter the task's title." });
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(columnId)) {
        return res.status(400).json({ message: "Column ID invalid" });
    }
    try {
        const column = yield Column_1.default.findById(columnId);
        if (!column) {
            return res.status(404).json({ message: "Column not exist" });
        }
        const board = yield Board_1.default.findOne({
            _id: column.board,
            owner: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
        });
        if (!board) {
            return res.status(403).json({
                message: "You do not have permission to add tasks to this column.",
            });
        }
        const newTask = new Task_1.default({
            title,
            board: column.board,
            column: columnId,
            description: description || "",
        });
        const savedTask = yield newTask.save();
        column.taskOrder.push(savedTask.id);
        yield column.save();
        res.status(201).json(savedTask);
    }
    catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
});
exports.createTask = createTask;
// @desc    Xóa một task
// @route   DELETE /api/tasks/:taskId
// @access  Private
const deleteTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { taskId } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(taskId)) {
        return res.status(400).json({ message: "Task ID invalid" });
    }
    try {
        const task = yield Task_1.default.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: "Task not exist" });
        }
        const board = yield Board_1.default.findOne({
            _id: task.board,
            owner: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
        });
        if (!board) {
            return res
                .status(403)
                .json({ message: "You do not have permission to delete this task." });
        }
        const session = yield mongoose_1.default.startSession();
        session.startTransaction();
        try {
            yield Task_1.default.deleteOne({ _id: taskId }).session(session);
            yield Column_1.default.updateOne({ _id: task.column }, { $pull: { taskOrder: taskId } }).session(session);
            yield session.commitTransaction();
            res.json({ message: "Task is deleted successfully" });
        }
        catch (error) {
            yield session.abortTransaction();
            console.error("Transaction error during task deletion:", error);
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    catch (error) {
        console.error("Error deleting task:", error);
        if (error.constructor.name === "MongoError" ||
            error.constructor.name === "MongooseError") {
            res.status(500).json({
                message: "Delete task error (transaction failed), try again.",
            });
        }
        else {
            res.status(500).json({ message: `Server error: ${error.message}` });
        }
    }
});
exports.deleteTask = deleteTask;
// @desc    Di chuyển task (xử lý drag & drop)
// @route   PUT /api/tasks/:taskId/move
// @access  Private
const moveTask = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { taskId } = req.params;
    const { sourceColumnId, // Column ID nguồn
    destColumnId, // Column ID đích
    sourceIndex, // Vị trí index cũ trong sourceColumn.taskOrder
    destIndex, // Vị trí index mới trong destColumn.taskOrder
     } = req.body;
    if (!mongoose_1.default.Types.ObjectId.isValid(taskId) ||
        !mongoose_1.default.Types.ObjectId.isValid(sourceColumnId) ||
        !mongoose_1.default.Types.ObjectId.isValid(destColumnId) ||
        typeof sourceIndex !== "number" ||
        sourceIndex < 0 ||
        typeof destIndex !== "number" ||
        destIndex < 0) {
        return res.status(400).json({ message: "Invalid migration data" });
    }
    try {
        const task = yield Task_1.default.findById(taskId);
        if (!task) {
            return res.status(404).json({ message: "Task not exist" });
        }
        const board = yield Board_1.default.findOne({
            _id: task.board,
            owner: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id,
        });
        if (!board) {
            return res
                .status(403)
                .json({ message: "You do not have permission to delete this task." });
        }
        const session = yield mongoose_1.default.startSession();
        session.startTransaction();
        try {
            // Lấy sourceColumn và destColumn
            const sourceColumn = yield Column_1.default.findById(sourceColumnId).session(session);
            const destColumn = sourceColumnId === destColumnId
                ? sourceColumn
                : yield Column_1.default.findById(destColumnId).session(session);
            if (!sourceColumn || !destColumn) {
                yield session.abortTransaction();
                return res
                    .status(400)
                    .json({ message: "sourceColumn or destColumn not exist" });
            }
            // Xóa taskId khỏi sourceColumn.taskOrder
            const sourceTaskOrder = sourceColumn.taskOrder;
            sourceTaskOrder.splice(sourceIndex, 1);
            // Nếu di chuyển sang cột khác, cập nhật task.column
            if (sourceColumnId !== destColumnId) {
                task.column = new mongoose_1.default.Types.ObjectId(destColumnId);
                yield task.save({ session });
            }
            // Chèn taskId vào destColumn.taskOrder tại vị trí mới
            const destTaskOrder = destColumn.taskOrder;
            destTaskOrder.splice(destIndex, 0, new mongoose_1.default.Types.ObjectId(taskId));
            //Lưu thay đổi của cả 2 column (nếu khác nhau)
            yield sourceColumn.save({ session });
            if (sourceColumnId !== destColumnId) {
                yield destColumn.save({ session });
            }
            yield session.commitTransaction();
            res.json({ message: "Move task successfully" });
        }
        catch (error) {
            yield session.abortTransaction();
            console.error("Transaction error during task move:", error);
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    catch (error) {
        console.error("Error moving task:", error);
        if (error.constructor.name === "MongoError" ||
            error.constructor.name === "MongooseError") {
            res.status(500).json({
                message: "Move task error (transaction failed), try again.",
            });
        }
        else {
            res.status(500).json({ message: `Server error: ${error.message}` });
        }
    }
});
exports.moveTask = moveTask;
