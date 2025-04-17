"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("../config/passport")); // Import passport đã cấu hình
const authController = __importStar(require("../controllers/authController"));
const router = express_1.default.Router();
router.post("/register", authController.register);
router.post("/login", authController.login);
// --- Google Authentication ---
// Bước 1: Chuyển hướng đến Google để xác thực
// Khi người dùng click nút "Login with Google" ở frontend, frontend sẽ gọi tới endpoint này.
router.get("/google", passport_1.default.authenticate("google", {
    scope: ["profile", "email"], // Yêu cầu quyền truy cập profile và email
    session: false, // Không sử dụng session của express, dùng JWT
}));
// Bước 2: Google gọi lại URL này sau khi xác thực
// Passport sẽ xử lý code từ Google, gọi callback trong GoogleStrategy
// Nếu thành công, nó sẽ gọi hàm handler tiếp theo (authController.googleCallbackHandler)
// req.user sẽ được gắn vào request bởi passport
router.get("/google/callback", passport_1.default.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=GoogleAuthFailed`, // Chuyển hướng về trang login của frontend nếu lỗi
    session: false, // Không sử dụng session
}), authController.googleCallbackHandler // Xử lý sau khi authenticate thành công
);
exports.default = router;
