import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token as any;
    const path = req.nextUrl.pathname;

    // Settings page : BOSS/ADMIN only
    if (path.startsWith("/settings") && !["BOSS", "ADMIN"].includes(token?.role)) {
      return NextResponse.redirect(new URL("/overview", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: { signIn: "/login" },
  },
);

export const config = {
  matcher: [
    "/overview/:path*",
    "/events/:path*",
    "/carts/:path*",
    "/claims/:path*",
    "/tickets/:path*",
    "/users/:path*",
    "/roles/:path*",
    "/giveaways/:path*",
    "/interest-checks/:path*",
    "/invites/:path*",
    "/announcements/:path*",
    "/analytics/:path*",
    "/logs/:path*",
    "/settings/:path*",
  ],
};
