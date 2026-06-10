if (process.env.NODE_ENV === "development") {
  // 在本地开发环境下，强制覆盖 NEXTAUTH_URL 为 localhost:3000，
  // 避免使用生产域名导致的 Cookie 域和安全传输（__Secure- 限制）失效，从而解决登录重定向死循环。
  process.env.NEXTAUTH_URL = "http://localhost:3000";
}

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "./db";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    CredentialsProvider({
      id: "credentials",
      name: "邮箱登录",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const emailClean = (credentials.email as string).toLowerCase().trim();

        const user = await db.user.findUnique({
          where: { email: emailClean },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
    CredentialsProvider({
      id: "magiclink",
      name: "Magic Link",
      credentials: {
        token: { type: "text" },
        email: { type: "email" },
      },
      async authorize(credentials) {
        if (!credentials?.token || !credentials?.email) {
          return null;
        }

        const emailClean = (credentials.email as string).toLowerCase().trim();
        const verToken = await db.verificationToken.findUnique({
          where: { token: hashToken(credentials.token as string) },
        });

        if (!verToken || verToken.identifier !== emailClean) {
          return null;
        }

        if (verToken.expires < new Date()) {
          // 删除过期的 token
          await db.verificationToken.delete({
            where: { token: hashToken(credentials.token as string) },
          }).catch(() => {});
          return null;
        }

        // 删除 token（一次性使用）
        await db.verificationToken.delete({
          where: { token: hashToken(credentials.token as string) },
        });

        const user = await db.user.findUnique({
          where: { email: verToken.identifier },
        });

        if (!user) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
});
