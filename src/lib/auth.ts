import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { MemberStatus } from "@/generated/prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const member = await prisma.member.findUnique({
          where: { email: credentials.email as string },
          select: {
            id: true,
            email: true,
            name: true,
            passwordHash: true,
            type: true,
            grade: true,
            status: true,
          },
        });

        if (!member) return null;
        if (member.status !== MemberStatus.ACTIVE) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          member.passwordHash
        );
        if (!valid) return null;

        // 마지막 로그인 시각 업데이트
        await prisma.member.update({
          where: { id: member.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: member.id,
          email: member.email,
          name: member.name,
          memberType: member.type,
          memberGrade: member.grade,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.memberType = (user as any).memberType;
        token.memberGrade = (user as any).memberGrade;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).memberType = token.memberType;
        (session.user as any).memberGrade = token.memberGrade;
      }
      return session;
    },
  },
});
