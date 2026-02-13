import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Logout realizado' });

  // Limpar cookie do corretor
  response.cookies.set('corretor_token', '', {
    path: '/',
    maxAge: 0,
    sameSite: 'strict',
    httpOnly: false,
  });

  return response;
}
