import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const ADMIN_LOGIN_PATH = "/admin-login";
const LOGIN_PATH = "/login";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  if (pathname.startsWith("/admin")) {
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.redirect(new URL(ADMIN_LOGIN_PATH, req.url));
    }
    return NextResponse.next();
  }

  if (!session?.user?.id) {
    const loginUrl = new URL(LOGIN_PATH, req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/events/:path*",
    "/match/:path*",
    "/messages/:path*",
    "/profile/:path*",
    "/onboarding/:path*",
  ],
};
