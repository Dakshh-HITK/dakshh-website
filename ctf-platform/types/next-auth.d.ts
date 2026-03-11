import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      avatar?: number;
      roles?: ("participant" | "volunteer" | "admin" | "super_admin")[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string;
    avatar?: number;
    roles?: ("participant" | "volunteer" | "admin" | "super_admin")[];
  }
}
