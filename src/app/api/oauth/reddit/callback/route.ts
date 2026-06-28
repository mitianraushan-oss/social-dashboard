import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

  if (!code) {
    return NextResponse.redirect(new URL('/?error=no_code', baseUrl));
  }

  try {
    const redirectUri = `${baseUrl}/api/oauth/reddit/callback`;

    const tokenRes = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${process.env.REDDIT_CLIENT_ID}:${process.env.REDDIT_CLIENT_SECRET}`).toString('base64')}`,
        'User-Agent': 'social-dashboard:0.1 (by /u/social-dashboard)',
      },
      body: `grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}`,
    });
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      return NextResponse.redirect(new URL('/?error=rd_token_failed', baseUrl));
    }

    const meRes = await fetch('https://oauth.reddit.com/api/v1/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, 'User-Agent': 'social-dashboard:0.1 (by /u/social-dashboard)' },
    });
    const meData = await meRes.json();

    await db.socialAccount.upsert({
      where: { id: `rd_${meData.id}` },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || null,
        tokenExpiresAt: null,
        displayName: meData.name || 'Reddit User',
        isActive: true,
        metadata: JSON.stringify({ username: meData.name, linkKarma: meData.link_karma, commentKarma: meData.comment_karma }),
      },
      create: {
        id: `rd_${meData.id}`,
        platform: 'reddit',
        platformUserId: meData.id,
        displayName: meData.name || 'Reddit User',
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || null,
        tokenExpiresAt: null,
        metadata: JSON.stringify({ username: meData.name, linkKarma: meData.link_karma, commentKarma: meData.comment_karma }),
      },
    });

    return NextResponse.redirect(new URL('/?connected=reddit', baseUrl));
  } catch {
    return NextResponse.redirect(new URL('/?error=rd_auth_failed', baseUrl));
  }
}