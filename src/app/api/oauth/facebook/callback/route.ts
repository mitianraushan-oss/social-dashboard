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
    const redirectUri = `${baseUrl}/api/oauth/facebook/callback`;
    const tokenRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${process.env.FACEBOOK_APP_ID}&client_secret=${process.env.FACEBOOK_APP_SECRET}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`
    );
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      return NextResponse.redirect(new URL('/?error=fb_token_failed', baseUrl));
    }

    // Get user info
    const meRes = await fetch(`https://graph.facebook.com/v21.0/me?fields=id,name,email&access_token=${tokenData.access_token}`);
    const meData = await meRes.json();

    // Get pages (for IG + FB posting)
    let pages: Array<{ id: string; name: string; access_token: string }> = [];
    try {
      const pagesRes = await fetch(`https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token&access_token=${tokenData.access_token}`);
      const pagesData = await pagesRes.json();
      pages = pagesData.data || [];
    } catch {}

    // Store Facebook account
    await db.socialAccount.upsert({
      where: { id: `fb_${meData.id}` },
      update: {
        accessToken: tokenData.access_token,
        tokenExpiresAt: new Date(Date.now() + (tokenData.expires_in || 5184000) * 1000),
        displayName: meData.name || 'Facebook User',
        isActive: true,
        metadata: JSON.stringify({ userId: meData.id, email: meData.email, pages }),
      },
      create: {
        id: `fb_${meData.id}`,
        platform: 'facebook',
        platformUserId: meData.id,
        displayName: meData.name || 'Facebook User',
        accessToken: tokenData.access_token,
        tokenExpiresAt: new Date(Date.now() + (tokenData.expires_in || 5184000) * 1000),
        metadata: JSON.stringify({ userId: meData.id, email: meData.email, pages }),
      },
    });

    // Store Instagram business account if available
    for (const page of pages) {
      try {
        const igRes = await fetch(`https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account{id,username}&access_token=${page.access_token}`);
        const igData = await igRes.json();
        if (igData.instagram_business_account) {
          const ig = igData.instagram_business_account;
          await db.socialAccount.upsert({
            where: { id: `ig_${ig.id}` },
            update: {
              accessToken: page.access_token,
              displayName: ig.username || 'Instagram',
              isActive: true,
              metadata: JSON.stringify({ igUserId: ig.id, pageId: page.id, pageToken: page.access_token }),
            },
            create: {
              id: `ig_${ig.id}`,
              platform: 'instagram',
              platformUserId: ig.id,
              displayName: ig.username || 'Instagram',
              accessToken: page.access_token,
              metadata: JSON.stringify({ igUserId: ig.id, pageId: page.id, pageToken: page.access_token }),
            },
          });
        }
      } catch {}
    }

    return NextResponse.redirect(new URL('/?connected=facebook,instagram', baseUrl));
  } catch {
    return NextResponse.redirect(new URL('/?error=fb_auth_failed', baseUrl));
  }
}