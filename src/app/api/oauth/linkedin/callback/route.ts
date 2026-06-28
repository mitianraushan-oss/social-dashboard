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
    const redirectUri = `${baseUrl}/api/oauth/linkedin/callback`;

    const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(redirectUri)}&client_id=${process.env.LINKEDIN_CLIENT_ID}&client_secret=${process.env.LINKEDIN_CLIENT_SECRET}`,
    });
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      return NextResponse.redirect(new URL('/?error=li_token_failed', baseUrl));
    }

    const meRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const meData = await meRes.json();

    const displayName = meData.name || [meData.given_name, meData.family_name].filter(Boolean).join(' ') || 'LinkedIn User';

    await db.socialAccount.upsert({
      where: { id: `li_${meData.sub}` },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || null,
        tokenExpiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null,
        displayName,
        isActive: true,
        metadata: JSON.stringify({ email: meData.email, picture: meData.picture }),
      },
      create: {
        id: `li_${meData.sub}`,
        platform: 'linkedin',
        platformUserId: meData.sub,
        displayName,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || null,
        tokenExpiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null,
        metadata: JSON.stringify({ email: meData.email, picture: meData.picture }),
      },
    });

    return NextResponse.redirect(new URL('/?connected=linkedin', baseUrl));
  } catch {
    return NextResponse.redirect(new URL('/?error=li_auth_failed', baseUrl));
  }
}