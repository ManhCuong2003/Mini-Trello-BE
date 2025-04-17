import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { NextFunction, Request, Response } from "express";
import User, { IUser } from "../models/User";

export interface IRequestWithUser extends Request {
  user?: IUser;
}

export const protect = async (
  req: IRequestWithUser,
  res: Response,
  next: NextFunction
) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bear")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string;
      };

      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: "Invalid token" });
    }
  }

  if (!token) {
    res.status(401).json({ message: "No token" });
  }
};
