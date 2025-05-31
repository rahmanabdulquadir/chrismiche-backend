// auth.utils.ts
import crypto from "crypto";

export const generatePasswordResetToken = () => {
  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  return { resetToken, hashedToken };
};
