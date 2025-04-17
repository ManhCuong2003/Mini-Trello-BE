import express from "express";
import passport from "../config/passport"; // Import passport đã cấu hình
import * as authController from "../controllers/authController";

const router = express.Router();

router.post("/register", authController.register);

router.post("/login", authController.login);

// --- Google Authentication ---

// Bước 1: Chuyển hướng đến Google để xác thực
// Khi người dùng click nút "Login with Google" ở frontend, frontend sẽ gọi tới endpoint này.
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"], // Yêu cầu quyền truy cập profile và email
    session: false, // Không sử dụng session của express, dùng JWT
  })
);

// Bước 2: Google gọi lại URL này sau khi xác thực
// Passport sẽ xử lý code từ Google, gọi callback trong GoogleStrategy
// Nếu thành công, nó sẽ gọi hàm handler tiếp theo (authController.googleCallbackHandler)
// req.user sẽ được gắn vào request bởi passport
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=GoogleAuthFailed`, // Chuyển hướng về trang login của frontend nếu lỗi
    session: false, // Không sử dụng session
  }),
  authController.googleCallbackHandler // Xử lý sau khi authenticate thành công
);

export default router;
