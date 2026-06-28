import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/oauth/reddit/callback`;

  if (!clientId) {
    return NextResponse.json({
      error: 'Reddit Client ID not configured',
      setupGuide: [
        '1. Go to https://old.reddit.com/prefs/apps',
        '2. Scroll down and click "create another app"',
        '3. Select "script" type',
        `4. Set redirect URI to: ${redirectUri}`,
        '5. Note the client_id (under app name) and client_secret',
        '6. Add REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET to .env',
      ].join('\n'),
    }, { status: 400 });
  }

  const state = `rd_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const authUrl = `https://www.reddit.com/api/v1/authorize?client_id=${clientId}&response_type=code&state=${state}&redirect_uri=${encodeURIComponent(redirectUri)}&duration=permanent&scope=identity,submit,read`;

  return NextResponse.json({ url: authUrl });
}