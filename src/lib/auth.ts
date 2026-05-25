import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { MemberRole, MemberStatus } from "@/generated/prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: 3600 },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        loginId: { label: "아이디", type: "text" },
        password: { label: "비밀번호", type: "password" },
        rememberMe: { label: "로그인 유지", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.loginId || !credentials?.password) return null;

        const member = await prisma.member.findUnique({
          where: { loginId: credentials.loginId as string },
          select: {
            id: true,
            loginId: true,
            role: true,
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

        // fire-and-forget: lastLoginAt is non-critical, don't block auth response
        prisma.member.update({
          where: { id: member.id },
          data: { lastLoginAt: new Date() },
        }).catch(() => {});

        return {
          id: member.id,
          email: member.email ?? member.loginId,
          name: member.name,
          role: member.role,
          memberType: member.type,
          memberGrade: member.grade,
          rememberMe: credentials.rememberMe !== "false",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.memberType = (user as any).memberType;
        token.memberGrade = (user as any).memberGrade;
        if ((user as any).rememberMe === true) {
          // 로그인 유지 선택 시 7일
          token.exp = Math.floor(Date.now() / 1000) + 604800;
        } else {
          // 기본 1시간
          token.exp = Math.floor(Date.now() / 1000) + 3600;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).memberType = token.memberType;
        (session.user as any).memberGrade = token.memberGrade;
      }
      return session;
    },
  },
});
