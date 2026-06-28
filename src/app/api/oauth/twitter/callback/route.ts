import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  // Read code_verifier from cookie
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach(c => {
    const [k, ...v] = c.trim().split('=');
    if (k) cookies[k] = v.join('=');
  });
  const codeVerifier = cookies['twitter_code_verifier'];

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', baseUrl));
  }

  try {
    const redirectUri = `${baseUrl}/api/oauth/twitter/callback`;
    const basicAuth = Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString('base64');

    const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
      },
      body: `grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}&code_verifier=${codeVerifier}`,
    });
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      return NextResponse.redirect(new URL('/?error=tw_token_failed', baseUrl));
    }

    const meRes = await fetch('https://api.twitter.com/2/users/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const meData = await meRes.json();
    const user = meData.data;

    await db.socialAccount.upsert({
      where: { id: `tw_${user.id}` },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || null,
        tokenExpiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null,
        displayName: user.name || `@${user.username}`,
        isActive: true,
        metadata: JSON.stringify({ username: user.username, profileImage: user.profile_image_url }),
      },
      create: {
        id: `tw_${user.id}`,
        platform: 'twitter',
        platformUserId: user.id,
        displayName: user.name || `@${user.username}`,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || null,
        tokenExpiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null,
        metadata: JSON.stringify({ username: user.username, profileImage: user.profile_image_url }),
      },
    });

    const response = NextResponse.redirect(new URL('/?connected=twitter', baseUrl));
    response.cookies.set('twitter_code_verifier', '', { maxAge: 0, path: '/' });
    return response;
  } catch {
    return NextResponse.redirect(new URL('/?error=tw_auth_failed', baseUrl));
  }
}