import { z } from "zod";

export const CreateUserSchema = z.object({
  name: z.string(),
  email: z.string().email("Please enter a valid email."),
  password: z.string().min(4).max(10),
});

export const SignInSchema = z.object({
  email: z.string().email("Please enter a valid email."),
  password: z.string().min(4).max(10),
});
