import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createHash, randomBytes } from "node:crypto";
import { body, validationResult } from "express-validator";
import User from "../models/User.js";
import PendingRegistration from "../models/PendingRegistration.js";
import { requireAuth } from "../middleware/auth.js";
import {
  sendFailedLoginEmail,
  sendLoginEmail,
  sendLogoutEmail,
  sendRegisterEmail,
  sendRegistrationOtpEmail,
  sendResetEmail,
} from "../services/emailService.js";
import { cleanEmail, isValidPhone } from "../utils/query.js";
import {
  createOtp,
  hashOtp,
  verifyOtp,
} from "../utils/otp.js";

const router = Router();
const registrationPrograms = ["B.Tech", "M.Tech", "Degree", "Pharmacy"];
const registrationDurations = {
  "B.Tech": 4,
  "M.Tech": 2,
  Degree: 3,
  Pharmacy: 6,
};
const registrationExpiryMs = 30 * 60 * 1000;
const otpExpiryMs = 10 * 60 * 1000;
const otpResendDelayMs = 60 * 1000;
const otpAttemptLimit = 5;

function getPasswordRules() {
  return body("password")
    .isString()
    .isLength({ min: 8, max: 100 })
    .withMessage("Password must contain 8 to 100 characters.");
}

function sendErrors(req, res) {
  const result = validationResult(req);
  if (result.isEmpty()) return false;

  res.status(400).json({
    message: "Please correct the highlighted information.",
    errors: result
      .array()
      .map((item) => ({ field: item.path, message: item.msg })),
  });
  return true;
}

function makeToken(user) {
  return jwt.sign(
    { sub: String(user._id), role: user.role },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "8h",
    },
  );
}

function getPublicUser(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    studentProfile: user.role === "student" ? user.studentProfile || null : null,
  };
}

const registrationDetailsRules = [
  body("firstName")
    .isString()
    .trim()
    .isLength({ min: 1, max: 60 })
    .withMessage("First name must contain 1 to 60 characters."),
  body("lastName")
    .isString()
    .trim()
    .isLength({ min: 1, max: 60 })
    .withMessage("Last name must contain 1 to 60 characters."),
  body("email").isEmail().normalizeEmail(),
  body("rollNumber")
    .isString()
    .trim()
    .isLength({ min: 2, max: 40 })
    .matches(/^[A-Za-z0-9][A-Za-z0-9/-]*$/)
    .withMessage("Enter a valid college roll number."),
  body("gender")
    .isIn(["Male", "Female", "Other"])
    .withMessage("Choose a valid gender."),
  body("phone")
    .isString()
    .custom(isValidPhone)
    .withMessage("Enter a valid phone number with 10 to 15 digits."),
  body("program")
    .isIn(registrationPrograms)
    .withMessage("Choose a valid program."),
  body("branch")
    .isString()
    .trim()
    .isLength({ min: 2, max: 80 })
    .withMessage("Branch must contain 2 to 80 characters."),
  body("address")
    .isString()
    .trim()
    .isLength({ min: 5, max: 300 })
    .withMessage("Address must contain 5 to 300 characters."),
  body("yearOfStudy").isInt({ min: 1, max: 6 }).toInt(),
  body("passingOutYear").isInt({ min: 1980, max: 2100 }).toInt(),
];

router.post("/registration/start", registrationDetailsRules, async (req, res, next) => {
  try {
    if (sendErrors(req, res)) return;

    const {
      firstName,
      lastName,
      email,
      rollNumber,
      gender,
      phone,
      address,
      program,
      branch,
    } = req.body;
    if (`${firstName.trim()} ${lastName.trim()}`.length > 100) {
      return res.status(400).json({
        message: "First and last name together must be 100 characters or fewer.",
      });
    }
    const yearOfStudy = Number(req.body.yearOfStudy);
    const passingOutYear = Number(req.body.passingOutYear);
    if (yearOfStudy > registrationDurations[program]) {
      return res.status(400).json({
        message: `Year of study must be between 1 and ${registrationDurations[program]} for ${program}.`,
      });
    }
    if (await User.exists({ email: cleanEmail(email) })) {
      return res.status(409).json({
        message: "An account already exists for this email. Please sign in.",
      });
    }
    const normalizedRollNumber = rollNumber.trim().toUpperCase();
    if (await User.exists({ "studentProfile.rollNumber": normalizedRollNumber })) {
      return res.status(409).json({
        message: "That college roll number is already registered.",
      });
    }

    const normalizedEmail = cleanEmail(email);
    let pending = await PendingRegistration.findOne({ email: normalizedEmail });
    if (!pending) pending = new PendingRegistration({ email: normalizedEmail });
    pending.firstName = firstName;
    pending.lastName = lastName;
    pending.rollNumber = normalizedRollNumber;
    pending.gender = gender;
    pending.phone = phone.trim();
    pending.address = address.trim();
    pending.program = program;
    pending.branch = branch.trim();
    pending.yearOfStudy = yearOfStudy;
    pending.passingOutYear = passingOutYear;
    pending.passwordHash = "";
    pending.otpHash = "";
    pending.otpExpiresAt = null;
    pending.otpSentAt = null;
    pending.otpAttempts = 0;
    pending.expiresAt = new Date(Date.now() + registrationExpiryMs);
    await pending.save();

    res.status(201).json({
      challengeId: String(pending._id),
      expiresInSeconds: registrationExpiryMs / 1000,
    });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/registration/send-otp",
  [
    body("challengeId").isMongoId(),
    body("password").optional().isString().isLength({ min: 8, max: 100 }),
  ],
  async (req, res, next) => {
    try {
      if (sendErrors(req, res)) return;
      const pending = await PendingRegistration.findById(
        req.body.challengeId,
      ).select("+passwordHash +otpHash");
      if (!pending || pending.expiresAt <= new Date()) {
        return res.status(410).json({
          message: "This registration expired. Please start again.",
        });
      }
      if (
        pending.otpSentAt &&
        Date.now() - pending.otpSentAt.getTime() < otpResendDelayMs
      ) {
        const retryAfterSeconds = Math.ceil(
          (otpResendDelayMs - (Date.now() - pending.otpSentAt.getTime())) /
            1000,
        );
        return res.status(429).json({
          message: `Please wait ${retryAfterSeconds} seconds before requesting another code.`,
          retryAfterSeconds,
        });
      }

      if (req.body.password !== undefined) {
        pending.passwordHash = await bcrypt.hash(req.body.password, 12);
      }
      if (!pending.passwordHash) {
        return res.status(400).json({
          message: "Create a password before requesting the verification code.",
        });
      }

      const otp = createOtp();
      pending.otpHash = hashOtp(
        pending.email,
        otp,
        process.env.JWT_SECRET,
      );
      pending.otpExpiresAt = new Date(Date.now() + otpExpiryMs);
      pending.otpSentAt = new Date();
      pending.otpAttempts = 0;
      pending.expiresAt = new Date(Date.now() + registrationExpiryMs);
      await pending.save();

      const emailSent = await sendRegistrationOtpEmail(
        {
          name: `${pending.firstName} ${pending.lastName}`,
          email: pending.email,
        },
        otp,
      );
      if (!emailSent) {
        pending.otpHash = "";
        pending.otpExpiresAt = null;
        pending.otpSentAt = null;
        await pending.save();
        return res.status(503).json({
          message:
            "We could not send the verification code. Check the server SMTP settings and try again.",
        });
      }

      res.json({
        message: "Verification code sent to your email address.",
        resendAfterSeconds: otpResendDelayMs / 1000,
        expiresInSeconds: otpExpiryMs / 1000,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/registration/verify",
  [body("challengeId").isMongoId(), body("otp").isString().matches(/^[0-9]{6}$/)],
  async (req, res, next) => {
    try {
      if (sendErrors(req, res)) return;

      const pending = await PendingRegistration.findById(
        req.body.challengeId,
      ).select("+passwordHash +otpHash");
      if (!pending || pending.expiresAt <= new Date()) {
        return res.status(410).json({
          message: "This registration expired. Please start again.",
        });
      }
      if (!pending.otpHash || !pending.otpExpiresAt) {
        return res.status(400).json({
          message: "Request an email verification code first.",
        });
      }
      if (pending.otpExpiresAt <= new Date()) {
        return res.status(410).json({
          message: "This verification code expired. Request a new one.",
        });
      }
      if (pending.otpAttempts >= otpAttemptLimit) {
        await pending.deleteOne();
        return res.status(429).json({
          message: "Too many incorrect codes. Please start registration again.",
        });
      }

      const codeIsValid = verifyOtp(
        pending.email,
        req.body.otp,
        process.env.JWT_SECRET,
        pending.otpHash,
      );
      if (!codeIsValid) {
        pending.otpAttempts += 1;
        const remainingAttempts = otpAttemptLimit - pending.otpAttempts;
        if (remainingAttempts <= 0) {
          await pending.deleteOne();
          return res.status(429).json({
            message: "Too many incorrect codes. Please start registration again.",
          });
        }
        await pending.save();
        return res.status(400).json({
          message: `That code is incorrect. ${remainingAttempts} attempts remain.`,
        });
      }

      const user = await User.create({
        name: `${pending.firstName} ${pending.lastName}`,
        email: pending.email,
        passwordHash: pending.passwordHash,
        role: "student",
        emailVerifiedAt: new Date(),
        studentProfile: {
          rollNumber: pending.rollNumber,
          gender: pending.gender,
          phone: pending.phone,
          address: pending.address,
          program: pending.program,
          branch: pending.branch,
          yearOfStudy: pending.yearOfStudy,
          passingOutYear: pending.passingOutYear,
        },
      });
      await pending.deleteOne();
      const emailNotificationSent = await sendRegisterEmail(user);

      res.status(201).json({
        message: "Your student account was created successfully.",
        user: getPublicUser(user),
        emailNotificationSent,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post("/register", (_req, res) => {
  res.status(410).json({
    message: "Registration now requires email verification. Please use the three-step signup form.",
  });
});

router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isString().isLength({ min: 1, max: 100 }),
  ],
  async (req, res, next) => {
    try {
      if (sendErrors(req, res)) return;

      const user = await User.findOne({
        email: cleanEmail(req.body.email),
      }).select("+passwordHash");
      const passwordMatches =
        user && (await bcrypt.compare(req.body.password, user.passwordHash));

      if (!passwordMatches) {
        if (user) await sendFailedLoginEmail(user);
        return res
          .status(401)
          .json({ message: "Email or password is incorrect." });
      }

      await sendLoginEmail(user);
      res.json({ token: makeToken(user), user: getPublicUser(user) });
    } catch (error) {
      next(error);
    }
  },
);

router.post("/logout", requireAuth, async (req, res) => {
  await sendLogoutEmail(req.user);
  res.json({ message: "You have been signed out." });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: getPublicUser(req.user) });
});

router.patch(
  "/me",
  requireAuth,
  [
    body("name").optional().trim().isLength({ min: 2, max: 100 }),
    body("email").optional().isEmail().normalizeEmail(),
  ],
  async (req, res, next) => {
    try {
      if (sendErrors(req, res)) return;
      if (
        req.user.role === "student" &&
        req.body.email !== undefined &&
        cleanEmail(req.body.email) !== req.user.email
      ) {
        return res.status(400).json({
          message: "Student email changes require email verification.",
        });
      }
      const updates = {};
      if (req.body.name !== undefined) updates.name = req.body.name.trim();
      if (req.body.email !== undefined)
        updates.email = cleanEmail(req.body.email);

      const user = await User.findByIdAndUpdate(req.user._id, updates, {
        new: true,
        runValidators: true,
      });
      res.json({ user: getPublicUser(user) });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/change-password",
  requireAuth,
  [
    body("currentPassword").isString().isLength({ min: 1, max: 100 }),
    getPasswordRules(),
  ],
  async (req, res, next) => {
    try {
      if (sendErrors(req, res)) return;
      const user = await User.findById(req.user._id).select("+passwordHash");
      const matches =
        user &&
        (await bcrypt.compare(req.body.currentPassword, user.passwordHash));
      if (!matches)
        return res
          .status(400)
          .json({ message: "Current password is incorrect." });

      user.passwordHash = await bcrypt.hash(req.body.password, 12);
      await user.save();
      res.json({
        message: "Password changed successfully. Sign in again if prompted.",
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/forgot-password",
  [body("email").isEmail().normalizeEmail()],
  async (req, res, next) => {
    try {
      if (sendErrors(req, res)) return;

      const email = cleanEmail(req.body.email);
      const user = await User.findOne({ email });

      if (user) {
        const token = randomBytes(32).toString("hex");
        user.passwordResetTokenHash = createHash("sha256")
          .update(token)
          .digest("hex");
        user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
        await user.save();

        const frontendUrl =
          process.env.FRONTEND_URL ||
          process.env.CLIENT_ORIGIN ||
          "http://localhost:5174";
        const link = `${frontendUrl.replace(/\/$/, "")}/reset-password?token=${token}`;
        await sendResetEmail(user, link);
      }

      res.json({
        message:
          "If an account uses that email, password reset instructions have been sent.",
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/reset-password",
  [body("token").isString().isLength({ min: 32, max: 200 }), getPasswordRules()],
  async (req, res, next) => {
    try {
      if (sendErrors(req, res)) return;
      const tokenHash = createHash("sha256")
        .update(req.body.token)
        .digest("hex");
      const user = await User.findOne({
        passwordResetTokenHash: tokenHash,
        passwordResetExpires: { $gt: new Date() },
      }).select("+passwordHash +passwordResetTokenHash +passwordResetExpires");

      if (!user)
        return res
          .status(400)
          .json({ message: "The reset link is invalid or has expired." });

      user.passwordHash = await bcrypt.hash(req.body.password, 12);
      user.passwordResetTokenHash = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      res.json({
        message: "Password reset successfully. You can now sign in.",
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
