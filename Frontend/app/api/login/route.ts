import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const validEmail = process.env.LOGIN_EMAIL;
  const validPassword = process.env.LOGIN_PASSWORD;

  if (email === validEmail && password === validPassword) {
    const res = NextResponse.json({ message: "Login successful" });
    res.cookies.set("auth", "true", { httpOnly: true });
    return res;
  }

  return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
}
