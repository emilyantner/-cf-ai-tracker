import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const ALLOWED_DOMAIN = "channelfactory.com";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/denied",
  },
  callbacks: {
    async signIn({ profile }) {
      const email = profile?.email ?? "";
      return email.endsWith(`@${ALLOWED_DOMAIN}`);
    },
    async session({ session }) {
      return session;
    },
  },
};
