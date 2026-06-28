import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/oauth/linkedin/callback`;

  if (!clientId) {
    return NextResponse.json({
      error: 'LinkedIn Client ID not configured',
      setupGuide: [
        '1. Go to https://developer.linkedin.com',
        '2. Create a new app',
        '3. Add the "Sign In with LinkedIn" product',
        '4. Request w_member_social scope',
        '5. Add LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET to .env',
        `6. Set OAuth redirect URI to: ${redirectUri}`,
      ].join('\n'),
    }, { status: 400 });
  }

  const scopes = 'w_member_social%20profile%20email%20openid';
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&state=li_${Date.now()}`;

  return NextResponse.json({ url: authUrl });
}