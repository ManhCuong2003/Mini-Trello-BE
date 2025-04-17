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
exports.deleteBoard = exports.getBoardData = exports.createBoard = exports.getBoards = void 0;
const Board_1 = __importDefault(require("../models/Board"));
const mongoose_1 = __importDefault(require("mongoose"));
const Column_1 = __importDefault(require("../models/Column"));
const Task_1 = __importDefault(require("../models/Task"));
// @desc    Lấy danh sách board của người dùng
// @route   GET /api/boards
// @access  Private
const getBoards = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const boards = yield Board_1.default.find({ owner: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id });
        res.status(200).json(boards);
    }
    catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
});
exports.getBoards = getBoards;
// @desc    Lấy danh sách board của người dùng
// @route   GET /api/boards
// @access  Private
const createBoard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ message: "Input board name" });
    }
    try {
        const board = new Board_1.default({ name, owner: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id, columnOrders: [] });
        const createBoard = yield board.save();
        res.status(201).json({ createBoard });
    }
    catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
});
exports.createBoard = createBoard;
// @desc    Lấy dữ liệu chi tiết của một board (gồm columns và tasks)
// @route   GET /api/boards/:boardId/data
// @access  Private
const getBoardData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { boardId } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(boardId)) {
        return res.status(400).json({ message: "Board ID is invalid" });
    }
    try {
        const board = yield Board_1.default.findOne({ _id: boardId, owner: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id });
        if (!board) {
            return res.status(404).json({ message: "Board not exist" });
        }
        const columns = yield Column_1.default.find({ board: boardId });
        const tasks = yield Task_1.default.find({ board: boardId });
        res.json({ board, columns, tasks });
    }
    catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
});
exports.getBoardData = getBoardData;
// @desc    Xóa một board
// @route   DELETE /api/boards/:boardId
// @access  Private
const deleteBoard = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { boardId } = req.params;
    if (!mongoose_1.default.Types.ObjectId.isValid(boardId)) {
        return res.status(400).json({ message: "Board ID is invalid" });
    }
    try {
        const board = yield Board_1.default.findOne({ _id: boardId, owner: (_a = req.user) === null || _a === void 0 ? void 0 : _a._id });
        if (!board) {
            return res.status(404).json({ message: "Board not exist" });
        }
        const session = yield mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const columns = yield Column_1.default.find({ board: boardId }).session(session);
            const columnIds = columns.map((col) => col._id);
            yield Task_1.default.deleteMany({ column: { $in: columnIds } }).session(session);
            yield Column_1.default.deleteMany({ board: boardId }).session(session);
            yield Board_1.default.deleteOne({ _id: boardId });
            yield session.commitTransaction();
            res.json({ message: "Board is deleted successfully" });
        }
        catch (error) {
            yield session.abortTransaction();
            console.error("Transaction error during board deletion:", error);
            throw error;
        }
        finally {
            session.endSession();
        }
    }
    catch (error) {
        console.error("Error deleting board:", error);
        if (error.constructor.name === "MongoError" ||
            error.constructor.name === "MongooseError") {
            res.status(500).json({
                message: "Delete board error (transaction failed), please try again.",
            });
        }
        else {
            res.status(500).json({ message: `Server error: ${error.message}` });
        }
    }
});
exports.deleteBoard = deleteBoard;
