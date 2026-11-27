import z from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .min(1, "Enter your username.")
    .max(60, "Username must be 60 characters or fewer."),
  password: z
    .string()
    .min(1, "Enter your password.")
    .max(255, "Password must be 255 characters or fewer."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
