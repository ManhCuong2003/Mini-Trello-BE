"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const db_1 = __importDefault(require("./config/db"));
const passport_1 = __importDefault(require("./config/passport"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const boardRoutes_1 = __importDefault(require("./routes/boardRoutes"));
const columnRoutes_1 = __importDefault(require("./routes/columnRoutes"));
const taskRoutes_1 = __importDefault(require("./routes/taskRoutes"));
dotenv_1.default.config();
(0, db_1.default)();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL;
app.use((0, cors_1.default)({
    origin: FRONTEND_URL,
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(passport_1.default.initialize());
app.use("/api/auth", authRoutes_1.default);
app.use("/api/boards", boardRoutes_1.default);
app.use("/api/columns", columnRoutes_1.default);
app.use("/api/tasks", taskRoutes_1.default);
app.use((err, req, res, next) => {
    console.error(err.stack);
    res
        .status(err.status || 500)
        .json({ message: err.message || "Internal Server Error" });
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
