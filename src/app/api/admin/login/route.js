import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { identifier, password } = await request.json();

    // 1. Hardcoded admin fallback for initial setup.
    // Replace this later with a secure database lookup (e.g., MongoDB/Prisma)
    const ADMIN_IDENTIFIER = process.env.ADMIN_USER || 'admin@martinskarate.com';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'SenseiMartin2026';

    if (identifier === ADMIN_IDENTIFIER && password === ADMIN_PASSWORD) {
      const response = NextResponse.json(
        { success: true, message: 'Authentication successful' },
        { status: 200 }
      );

      // 2. Set an HTTP-Only cookie for session management
      // In production, encrypt this token or use a JWT payload
      response.cookies.set('admin_session', 'authenticated_secure_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 8, // 8 hours session duration
        path: '/',
      });

      return response;
    }

    return NextResponse.json(
      { success: false, error: 'Invalid administrative credentials' },
      { status: 401 }
    );

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}