import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
  const clientId = process.env.FACEBOOK_APP_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/oauth/facebook/callback`;

  if (!clientId) {
    return NextResponse.json({
      error: 'Facebook App ID not configured',
      setupGuide: [
        '1. Go to https://developers.facebook.com',
        '2. Create a new app (Business type)',
        '3. Add "Facebook Login" product',
        '4. In Settings > Basic, note your App ID',
        '5. Add FACEBOOK_APP_ID and FACEBOOK_APP_SECRET to .env',
        `6. Set OAuth redirect URI to: ${redirectUri}`,
        '7. Required scopes: email, public_profile, pages_manage_posts, instagram_basic, instagram_content_publish',
      ].join('\n'),
    }, { status: 400 });
  }

  const scopes = ['email', 'public_profile', 'pages_manage_posts', 'pages_read_engagement', 'instagram_basic', 'instagram_content_publish'].join(',');
  const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&response_type=code`;

  return NextResponse.json({ url: authUrl });
}