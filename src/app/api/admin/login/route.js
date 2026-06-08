import { NextResponse } from "next/server";

export async function POST(request) {
  const { email, password } =
    await request.json();

  if (
    email === "admin@gmail.com" &&
    password === "123456"
  ) {
    return NextResponse.json({
      success: true,
    });
  }

  return NextResponse.json(
    {
      success: false,
    },
    { status: 401 }
  );
}