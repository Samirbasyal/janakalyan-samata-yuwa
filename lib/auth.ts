import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { sendMail } from "@/lib/mail";

export const auth = betterAuth({
  database: new Pool({ connectionString: process.env.DATABASE_URL, max: 5 }),
  // IMPORTANT: no fixed baseURL — better-auth derives the base URL from each
  // request's origin, so login works from localhost, the Vercel domain, a
  // custom domain, or any preview URL. This eliminates "Invalid origin".
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendMail({
        to: user.email,
        subject: "Reset your password",
        html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>Reset your password</h2><p>We received a request to reset your password.</p><p><a href="${url}" style="background:#123f52;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">Reset password</a></p><p>This link expires soon. If you did not request this, you can ignore this email.</p></div>`,
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }) => {
      await sendMail({
        to: user.email,
        subject: "Verify your email — Janakalyan Samata Yuwa Club",
        html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>Verify your email</h2><p>Click below to verify your email address for your club account.</p><p><a href="${url}" style="background:#123f52;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">Verify email</a></p><p>Or copy this link: ${url}</p><p>If you did not create this account, you can ignore this email.</p></div>`,
      });
      // Dev fallback logs inside sendMail when no provider is configured.
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "viewer",
        input: false,
      },
    },
  },
  socialProviders:
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : undefined,
  trustedOrigins: [
    process.env.V0_RUNTIME_URL,
    process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL,
  ].filter(Boolean) as string[],
  advanced: {
    defaultCookieAttributes:
      process.env.NODE_ENV === "development"
        ? { sameSite: "none", secure: true }
        : undefined,
  },
});
