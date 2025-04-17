import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User";

dotenv.config();

// cấu hình google strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
    },
    async (accessToken, refreshToken, profile, done) => {
      // sau khi xác thực thành công
      const googleId = profile.id;
      const email = profile.emails?.[0]?.value;
      const name = profile.displayName;

      if (!email) {
        return done(
          new Error("Không thể lấy email từ Google profile."),
          undefined
        );
      }

      try {
        // check user có tồn tại chưa
        let user = await User.findOne({ googleId: googleId });

        if (user) {
          return done(null, user);
        }

        user = await User.findOne({ email: email });

        if (user) {
          // user tồn tại với email này nhưng chưa liên kêt google
          // --> cập nhật google Id cho user này
          if (!user.password) {
            user.googleId = googleId;
            await user.save();
            return done(null, user);
          } else {
            return done(
              new Error("Email này đã được đăng ký bằng phương thức khác"),
              undefined
            );
          }
        }

        // không tìm thấy user
        const newUser = new User({
          googleId,
          email,
          name,
        });
        await newUser.save();
        return done(null, newUser);
      } catch (error) {
        console.error("Lỗi trong Google Strategy: ", error);
        return done(error, undefined);
      }
    }
  )
);

export default passport;
