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
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = __importDefault(require("../models/User"));
dotenv_1.default.config();
// cấu hình google strategy
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, (accessToken, refreshToken, profile, done) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    // sau khi xác thực thành công
    const googleId = profile.id;
    const email = (_b = (_a = profile.emails) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.value;
    const name = profile.displayName;
    if (!email) {
        return done(new Error("Không thể lấy email từ Google profile."), undefined);
    }
    try {
        // check user có tồn tại chưa
        let user = yield User_1.default.findOne({ googleId: googleId });
        if (user) {
            return done(null, user);
        }
        user = yield User_1.default.findOne({ email: email });
        if (user) {
            // user tồn tại với email này nhưng chưa liên kêt google
            // --> cập nhật google Id cho user này
            if (!user.password) {
                user.googleId = googleId;
                yield user.save();
                return done(null, user);
            }
            else {
                return done(new Error("Email này đã được đăng ký bằng phương thức khác"), undefined);
            }
        }
        // không tìm thấy user
        const newUser = new User_1.default({
            googleId,
            email,
            name,
        });
        yield newUser.save();
        return done(null, newUser);
    }
    catch (error) {
        console.error("Lỗi trong Google Strategy: ", error);
        return done(error, undefined);
    }
})));
exports.default = passport_1.default;
