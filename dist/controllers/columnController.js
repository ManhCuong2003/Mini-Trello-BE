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
exports.deleteColumn = exports.createColumn = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Board_1 = __importDefault(require("../models/Board"));
const Column_1 = __importDefault(require("../models/Column"));
const Task_1 = __importDefault(require("../models/Task"));
// @desc    Tạo cột mới trong một bảng
// @route   POST /api/columns/boards/:boardId/columns
// @access  Private
const createColumn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { boardId } = req.params;
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ message: "Input column name" });
    }
    if (!mongoose_1.default.Types.ObjectId.isValid(boardId)) {
        return res.status(400).json({ message: "Board ID invalid" });
    }
    try {
        const board = yield Board_1.default.findOne({ _id: boardId, owner: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id });
        if (!board) {
            return res.status(404).json({ message: "Board not exist" });
        }
        const newColumn = new Column_1.default({
            name,
            board: boardId,
            taskOrder: [],
        });
        const savedColumn = yield newColumn.save();
        board.columnOrder.push(savedColumn.id);
        yield board.save();
        res.status(201).json(savedColumn);
    }
    catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
});
exports.createColumn = createColumn;
// @desc    Xóa một cột
// @route   DELETE /api/columns/:columnId
// @access  Private
const deleteColumn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { columnId } = req.params;
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
            return res.status(404).json({ message: "Board not exist" });
        }
        const session = yield mongoose_1.default.startSession();
        session.startTransaction();
        try {
            yield Task_1.default.deleteMany({ column: columnId }).session(session);
            yield Column_1.default.deleteOne({ _id: columnId }).session(session);
            board.columnOrder = board.columnOrder.filter((colId) => colId.toString() !== columnId.toString());
            yield board.save({ session });
            yield session.commitTransaction();
            res.json({ message: "Column is deleted successfully" });
        }
        catch (error) {
            yield session.abortTransaction();
            console.error("Transaction error during column deletion:", error);
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    catch (error) {
        console.error("Error deleting column:", error);
        if (error.constructor.name === "MongoError" ||
            error.constructor.name === "MongooseError") {
            res.status(500).json({
                message: "Delete column error (transaction failed), please try again.",
            });
        }
        else {
            res.status(500).json({ message: `Server error: ${error.message}` });
        }
    }
});
exports.deleteColumn = deleteColumn;
