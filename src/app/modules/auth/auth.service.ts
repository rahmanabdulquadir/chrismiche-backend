import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";
import { TLoginUser } from "./auth.interface";
import { JwtPayload } from "jsonwebtoken";
import config from "../../config";
import bcrypt from "bcrypt";
import { createToken, verifyToken } from "./auth.utils";
import crypto from 'crypto';
import { User } from "../user/user.model";

const loginUser = async (payload: TLoginUser) => {
  const user = await User.findOne({ email: payload?.email }).select(
    "+password"
  );
  console.log(user, payload);

  // Check if user exists
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
  }

  // Check if user is deleted
  const isUserDeleted = user?.isDeleted;
  if (isUserDeleted) {
    throw new ApiError(httpStatus.FORBIDDEN, "User is deleted!");
  }
  // Check if password is correct
  if (!(await bcrypt.compare(payload?.password, user?.password))) {
    throw new ApiError(httpStatus.FORBIDDEN, "Password did not match!");
  }

  //----------------Create jsonwebtoken and send to the client-----------------
  const jwtPayload = {
    userId: user._id.toString(),
    role: user.role,
  };

  //++++++++++++++++   ACCESS TOKEN   ++++++++++++++++
  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    parseInt(config.jwt_access_expires_in as string)
  );
  //++++++++++++++++   Refresh TOKEN   ++++++++++++++++
  const refreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret as string,
    parseInt(config.jwt_refresh_expires_in as string)
  );
  return {
    accessToken,
    refreshToken,
  };
};

const changePassword = async (
  userData: JwtPayload,
  payload: { oldPassword: string; newPassword: string }
) => {
  const user = await User.findById(userData.userId).select("+password");

  // Check if user exists
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
  }

  // Check if user is deleted
  const isUserDeleted = user?.isDeleted;
  if (isUserDeleted) {
    throw new ApiError(httpStatus.FORBIDDEN, "User is deleted!");
  }

  // Check if user is blocked
  // const userStatus = user?.status;
  // if (userStatus === "blocked") {
  //   throw new ApiError(httpStatus.FORBIDDEN, "User is blocked!");
  // }

  // Check if password is correct
  if (!(await bcrypt.compare(payload?.oldPassword, user?.password))) {
    throw new ApiError(httpStatus.FORBIDDEN, "Password did not match!");
  }

  // Hash new password
  const newHashedPassword = await bcrypt.hash(
    payload?.newPassword,
    Number(config.bcrypt_salt_rounds)
  );

  await User.findOneAndUpdate(
    {
      _id: userData.userId,
      role: userData.role,
    },
    {
      password: newHashedPassword,
    }
  );
  return null; // No need to send password as response. That's why we did not assign update operation in result variable too
};

const refreshToken = async (token: string) => {
  // checking if the given token is valid
  const decoded = verifyToken(token, config.jwt_refresh_secret as string);

  const { userId } = decoded;

  // checking if the user exists
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "This user is not found !");
  }
  // checking if the user is already deleted
  const isDeleted = user?.isDeleted;
  if (isDeleted) {
    throw new ApiError(httpStatus.FORBIDDEN, "This user is deleted !");
  }

  // checking if the user is blocked
  // const userStatus = user?.status;
  // if (userStatus === "blocked") {
  //   throw new ApiError(httpStatus.FORBIDDEN, "This user is blocked ! !");
  // }

  const jwtPayload = {
    userId: user.id,
    role: user.role,
  };

  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    parseInt(config.jwt_access_expires_in as string)
  );

  return {
    accessToken,
  };
};

const forgetPassword = async (email: string) => {
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);  // 10 mins
  await user.save({ validateBeforeSave: false });

  return { resetToken }; // this will be returned to Flutter app
};

const resetPassword = async ({ resetToken, password }: { resetToken: string; password: string }) => {
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) throw new ApiError(httpStatus.BAD_REQUEST, 'Token is invalid or expired');

  user.password = await bcrypt.hash(password, Number(config.bcrypt_salt_rounds));
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  return { email: user.email };
};

export const AuthServices = {
  loginUser,
  changePassword,
  refreshToken,
  forgetPassword,
  resetPassword,
};
