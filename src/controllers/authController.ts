import dotenv from "dotenv";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";
import bcrypt from "bcrypt";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET!;
const FRONTEND_URL = process.env.FRONTEND_URL!;

const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn: "1d",
  });
};

// register controller
export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({
      message: "Vui lòng cung cấp đủ thông tin: tên, email, mật khẩu.",
    });
    return;
  }

  try {
    // check email đã tồn tại
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: "Email này đã được sử dụng." });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    const savedUser = await newUser.save();

    // tạo token
    const token = generateToken(savedUser.id);

    const userResponse = {
      id: savedUser.id,
      name: savedUser.name,
    };

    res.status(201).json({ token, user: userResponse });
  } catch (error) {
    console.error("Lỗi đăng ký: ", error);
    res.status(500).json({ message: "Lỗi server khi đăng kí." });
  }
};

// Login controller
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: "Vui lòng cung cấp email và mật khẩu." });
    return;
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: "Email hoặc mật khẩu không đúng." });
      return;
    }

    if (!user.password) {
      res.status(401).json({
        message:
          "Tài khoản này được đăng kí bằng Google, vui lòng đăng nhập bằng Google.",
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
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
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    res.status(500).json({ message: "Lỗi server khi đăng nhập." });
  }
};

// --- Google Callback Handler ---
// Hàm này sẽ được gọi sau khi passport.authenticate('google') thành công trong route
export const googleCallbackHandler = (req: Request, res: Response): void => {
  // req.user được gắn bởi Passport sau khi xác thực thành công
  const user = req.user as IUser;

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
