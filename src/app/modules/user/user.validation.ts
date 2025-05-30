import { z } from "zod";
import { CharacterList } from "../../config/characters";

const createUserValidationSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: "Email is required" })
      .email("Invalid email format"),
    password: z
      .string({ required_error: "Password is required" })
      .min(6, "Password must be at least 6 characters")
      .max(20, "Password must be at most 20 characters"),
    fullName: z.string().optional(),
    username: z.string().optional(),
    phoneNumber: z.string().optional(),
    gender: z.enum(["male", "female", "other"]).optional(),
    character: z.enum(CharacterList).default("Robo"),
    role: z.enum(["admin", "user"]).default("user"),
  }),
});

const updateUserValidationSchema = z.object({
  body: z.object({
    fullName: z.string().optional(),
    username: z.string().optional(),
    gender: z.enum(["male", "female", "other"]).optional(),
    phoneNumber: z.string().optional(),
    character: z.enum(CharacterList).optional(),
  }),
});

export const UserValidations = {
  createUserValidationSchema,
  updateUserValidationSchema,
};
