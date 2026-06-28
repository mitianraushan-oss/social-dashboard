import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

// Platform-specific publish functions
async function publishToFacebook(accessToken: string, content: string, metadata: string) {
  const meta = JSON.parse(metadata || '{}');
  const pageToken = meta.pages?.[0]?.access_token || accessToken;
  const pageId = meta.pages?.[0]?.id;

  if (!pageId) throw new Error('No Facebook Page found. Please ensure you manage at least one Facebook Page.');

  const res = await fetch(`https://graph.facebook.com/v21.0/${pageId}/feed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: content, access_token: pageToken }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message);
  return { success: true, postId: data.id, url: `https://facebook.com/${data.id}` };
}

async function publishToInstagram(accessToken: string, content: string, metadata: string) {
  const meta = JSON.parse(metadata || '{}');
  // Instagram Content Publishing API requires a media container first
  // For text-only posts, we create a single-image post with text overlay
  throw new Error('Instagram API requires an image. Please add an image to post on Instagram.');
}

async function publishToInstagramWithImage(accessToken: string, content: string, imageUrl: string, metadata: string) {
  const meta = JSON.parse(metadata || '{}');
  const pageId = meta.pageId;
  const pageToken = meta.pageToken || accessToken;
  const igUserId = meta.igUserId;

  if (!igUserId || !pageId) throw new Error('Instagram Business account not properly linked.');

  // Step 1: Create media container
  const containerRes = await fetch(`https://graph.facebook.com/v21.0/${igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_url: imageUrl,
      caption: content,
      access_token: pageToken,
    }),
  });
  const containerData = await containerRes.json();
  if (containerData.error) throw new Error(containerData.error.message);

  // Step 2: Publish the container
  const publishRes = await fetch(`https://graph.facebook.com/v21.0/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: containerData.id,
      access_token: pageToken,
    }),
  });
  const publishData = await publishRes.json();
  if (publishData.error) throw new Error(publishData.error.message);

  return { success: true, postId: publishData.id };
}

async function publishToLinkedIn(accessToken: string, content: string) {
  const meRes = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const meData = await meRes.json();

  const res = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      author: `urn:li:person:${meData.sub}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: content },
          shareMediaCategory: 'ARTICLE',
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LinkedIn API error: ${err}`);
  }
  return { success: true, postId: 'linkedIn-post' };
}

async function publishToTwitter(accessToken: string, content: string) {
  // Twitter has 280 char limit
  const tweetContent = content.length > 280 ? content.slice(0, 277) + '...' : content;

  const res = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ text: tweetContent }),
  });
  const data = await res.json();
  if (data.errors) throw new Error(data.errors[0]?.message || 'Twitter API error');
  return { success: true, postId: data.data?.id, url: `https://x.com/i/status/${data.data?.id}` };
}

async function publishToReddit(accessToken: string, content: string, metadata: string) {
  const meta = JSON.parse(metadata || '{}');
  const subreddit = 'test'; // Default subreddit - user should configure this

  const res = await fetch(`https://oauth.reddit.com/api/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'social-dashboard:0.1 (by /u/social-dashboard)',
    },
    body: `kind=self&sr=${subreddit}&title=${encodeURIComponent(content.slice(0, 300))}&text=${encodeURIComponent(content)}`,
  });
  const data = await res.json();
  if (data.json?.errors?.length) throw new Error(data.json.errors[0][0]);
  return { success: true, postId: data.json?.data?.id, url: `https://reddit.com${data.json?.data?.url}` };
}

const PUBLISH_FNS: Record<string, (token: string, content: string, metadata?: string, imageUrl?: string) => Promise<{ success: boolean; postId?: string; url?: string }>> = {
  facebook: publishToFacebook,
  instagram: publishToInstagram,
  linkedin: publishToLinkedIn,
  twitter: publishToTwitter,
  reddit: publishToReddit,
};

export async function POST(request: Request) {
  try {
    const { content, imageUrl, platforms } = await request.json();

    if (!content || !platforms?.length) {
      return NextResponse.json({ error: 'Content and at least one platform are required' }, { status: 400 });
    }

    // Get accounts for selected platforms
    const accounts = await db.socialAccount.findMany({
      where: { platform: { in: platforms }, isActive: true },
    });

    const accountMap = new Map(accounts.map(a => [a.platform, a]));
    const results: Array<{ platform: string; success: boolean; postId?: string; url?: string; error?: string }> = [];

    for (const platform of platforms) {
      const account = accountMap.get(platform);
      if (!account) {
        results.push({ platform, success: false, error: 'Account not connected' });
        continue;
      }

      try {
        let result;
        if (platform === 'instagram' && imageUrl) {
          result = await publishToInstagramWithImage(account.accessToken, content, imageUrl, account.metadata || '');
        } else {
          const publishFn = PUBLISH_FNS[platform];
          if (!publishFn) {
            results.push({ platform, success: false, error: 'Unsupported platform' });
            continue;
          }
          result = await publishFn(account.accessToken, content, account.metadata || '', imageUrl);
        }
        results.push({ platform, ...result });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        results.push({ platform, success: false, error: message });
      }
    }

    // Save post to database
    const post = await db.post.create({
      data: {
        content,
        imageUrl: imageUrl || null,
        platforms: JSON.stringify(platforms),
        status: results.every(r => r.success) ? 'published' : results.some(r => r.success) ? 'published' : 'failed',
        results: JSON.stringify(results),
      },
    });

    return NextResponse.json({ success: true, postId: post.id, results });
  } catch (error) {
    return NextResponse.json({ error: 'Publishing failed' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const posts = await db.post.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return NextResponse.json(posts);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
  }
}