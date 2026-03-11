import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import connect from "@/lib/mongoose";
import User from "@/lib/models/User";
import { signInSchema } from "@/lib/validations/auth";
import { normalizeRoles } from "@/lib/roles";

async function ensureRolesInDb(userId: string, email: string, roles: unknown) {
  const normalizedRoles = normalizeRoles(roles, email);
  const hasSameLength =
    Array.isArray(roles) && roles.length === normalizedRoles.length;
  const hasSameValues =
    Array.isArray(roles) &&
    normalizedRoles.every((role) => roles.includes(role));

  if (!hasSameLength || !hasSameValues) {
    await User.findByIdAndUpdate(userId, { $set: { roles: normalizedRoles } });
  }

  return normalizedRoles;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = signInSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        await connect();

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user || user.provider === "google" || !user.passwordHash)
          return null;

        const valid = await user.comparePassword(password);
        if (!valid) return null;
        if (!user.verified) return null;

        let avatar = user.avatar;
        if (!avatar) {
          avatar = Math.floor(Math.random() * 10) + 1;
          await User.findByIdAndUpdate(user._id, { avatar });
        }

        return {
          id: user._id.toString(),
          name: user.username,
          email: user.email,
          image: user.image ?? undefined,
          avatar,
          roles: await ensureRolesInDb(
            user._id.toString(),
            user.email,
            user.roles
          ),
        };
      },
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID ?? "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") return true;

      const email = user.email?.toLowerCase().trim();
      if (!email) return false;

      await connect();
      const existing = await User.findOne({ email });

      if (existing) {
        if (existing.provider === "credentials") {
          return "/auth?error=use_credentials";
        }

        if (!existing.verified) {
          existing.emailVerified = new Date();
          existing.verified = true;
          await existing.save();
        }

        const roles = await ensureRolesInDb(
          existing._id.toString(),
          existing.email,
          existing.roles
        );

        user.id = existing._id.toString();
        user.name = existing.username;
        (user as { avatar?: number }).avatar = existing.avatar;
        (user as { roles?: string[] }).roles = roles;
        return true;
      }

      const usernameBase = (user.name ?? email.split("@")[0] ?? "crewmate")
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "")
        .slice(0, 24) || "crewmate";

      let usernameCandidate = usernameBase;
      let suffix = 1;
      while (
        await User.findOne({
          username: new RegExp(`^${usernameCandidate}$`, "i"),
        })
      ) {
        usernameCandidate = `${usernameBase}${suffix}`;
        suffix += 1;
      }

      const created = await User.create({
        username: usernameCandidate,
        email,
        provider: "google",
        image: user.image ?? undefined,
        avatar: Math.floor(Math.random() * 10) + 1,
        emailVerified: new Date(),
        verified: true,
        roles: normalizeRoles([], email),
      });

      user.id = created._id.toString();
      user.name = created.username;
      (user as { avatar?: number }).avatar = created.avatar;
      (user as { roles?: string[] }).roles = normalizeRoles(
        created.roles,
        email
      );
      return true;
    },
    redirect({ url, baseUrl }) {
      if (url === baseUrl || url === `${baseUrl}/`) {
        return `${baseUrl}/`;
      }
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/`;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.name;
        token.avatar = (user as { avatar?: number }).avatar;
        token.roles = (user as { roles?: string[] }).roles;
      }

      if (token.id && token.email) {
        await connect();
        const dbUser = (await User.findById(token.id)
          .select("roles email username avatar")
          .lean()) as {
          roles?: string[];
          email: string;
          username?: string;
          avatar?: number;
        } | null;

        if (dbUser?.email) {
          token.roles = await ensureRolesInDb(
            token.id as string,
            dbUser.email,
            dbUser.roles
          );
          if (dbUser.username) token.username = dbUser.username;
          if (dbUser.avatar !== undefined) token.avatar = dbUser.avatar;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.avatar = token.avatar as number | undefined;
        session.user.roles = token.roles as
          | ("participant" | "volunteer" | "admin" | "super_admin")[]
          | undefined;
      }
      return session;
    },
  },
});
