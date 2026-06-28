import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/oauth/twitter/callback`;

  if (!clientId) {
    return NextResponse.json({
      error: 'X (Twitter) Client ID not configured',
      setupGuide: [
        '1. Go to https://developer.x.com',
        '2. Create a project and an app',
        '3. Set up OAuth 2.0 with PKCE',
        '4. Enable User authentication settings',
        '5. Add TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET to .env',
        `6. Set callback URL to: ${redirectUri}`,
      ].join('\n'),
    }, { status: 400 });
  }

  // Generate PKCE
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

  const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=tweet.read%20tweet.write%20users.read%20offline.access&state=tw_${Date.now()}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

  const response = NextResponse.json({ url: authUrl });
  response.cookies.set('twitter_code_verifier', codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  return response;
}