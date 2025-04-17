import express from "express";
import passport from "../config/passport";
import * as authController from "../controllers/authController";

const router = express.Router();

router.post("/register", authController.register);

router.post("/login", authController.login);

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=GoogleAuthFailed`,
    session: false, 
  }),
  authController.googleCallbackHandler
);

export default router;
