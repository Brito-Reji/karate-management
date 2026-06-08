import { NextResponse } from "next/server";

export async function POST(request) {
  const { identifier, password } =
    await request.json();
    // check idntifure is email or phone number
    const isEmail = identifier.includes("@");
    const isPhoneNo = identifier.match(/^[0-9]{10}$/);

    console.log(isEmail,isPhoneNo); 

  if (isEmail && isPhoneNo &&
    identifier === "admin@gmail.com" &&
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