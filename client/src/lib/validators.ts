import { z } from "zod"

// Auth validators
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

// Preferences validators
export const preferencesSchema = z.object({
  watchlistStocks: z.array(z.string()).optional(),
  watchlistCrypto: z.array(z.string()).optional(),
  favoriteCurrencies: z.array(z.string()).optional(),
  theme: z.enum(["dark", "light"]).optional(),
  currency: z.string().optional(),
})

// Types
export type LoginFormData = z.infer<typeof loginSchema>
export type SignupFormData = z.infer<typeof signupSchema>
export type PreferencesFormData = z.infer<typeof preferencesSchema>

