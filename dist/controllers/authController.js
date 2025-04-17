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
exports.googleCallbackHandler = exports.login = exports.register = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const bcrypt_1 = __importDefault(require("bcrypt"));
dotenv_1.default.config();
const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL;
const generateToken = (userId) => {
    return jsonwebtoken_1.default.sign({ id: userId }, JWT_SECRET, {
        expiresIn: "1d",
    });
};
// register controller
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        res.status(400).json({
            message: "Vui lòng cung cấp đủ thông tin: tên, email, mật khẩu.",
        });
        return;
    }
    try {
        // check email đã tồn tại
        const existingUser = yield User_1.default.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: "Email này đã được sử dụng." });
            return;
        }
        const salt = yield bcrypt_1.default.genSalt(10);
        const hashedPassword = yield bcrypt_1.default.hash(password, salt);
        const newUser = new User_1.default({
            name,
            email,
            password: hashedPassword,
        });
        const savedUser = yield newUser.save();
        // tạo token
        const token = generateToken(savedUser.id);
        const userResponse = {
            id: savedUser.id,
            name: savedUser.name,
        };
        res.status(201).json({ token, user: userResponse });
    }
    catch (error) {
        console.error("Lỗi đăng ký: ", error);
        res.status(500).json({ message: "Lỗi server khi đăng kí." });
    }
});
exports.register = register;
// Login controller
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password } = req.body;
    if (!email || !password) {
        res.status(400).json({ message: "Vui lòng cung cấp email và mật khẩu." });
        return;
    }
    try {
        const user = yield User_1.default.findOne({ email });
        if (!user) {
            res.status(401).json({ message: "Email hoặc mật khẩu không đúng." });
            return;
        }
        if (!user.password) {
            res.status(401).json({
                message: "Tài khoản này được đăng kí bằng Google, vui lòng đăng nhập bằng Google.",
            });
            return;
        }
        const isMatch = yield bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
            return;
        }
        // Tạo token
        const token = generateToken(user.id);
        const userResponse = {
            id: user.id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt,
        };
        res.status(200).json({ token, user: userResponse });
    }
    catch (error) {
        console.error("Lỗi đăng nhập:", error);
        res.status(500).json({ message: "Lỗi server khi đăng nhập." });
    }
});
exports.login = login;
// --- Google Callback Handler ---
// Hàm này sẽ được gọi sau khi passport.authenticate('google') thành công trong route
const googleCallbackHandler = (req, res) => {
    // req.user được gắn bởi Passport sau khi xác thực thành công
    const user = req.user;
    if (!user) {
        // Trường hợp hiếm khi xảy ra nếu passport authenticate thành công mà không có user
        res.redirect(`${FRONTEND_URL}/login?error=AuthenticationFailed`);
        return;
    }
    // Tạo JWT Token cho user này
    const token = generateToken(user.id);
    const userResponse = {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
    };
    // Chuyển hướng người dùng về Frontend kèm theo token
    // Frontend sẽ đọc token này từ URL và lưu lại
    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}&userId=${user.id}&name=${user.name}`);
};
exports.googleCallbackHandler = googleCallbackHandler;
