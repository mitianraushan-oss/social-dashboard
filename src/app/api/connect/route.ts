import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

const PLATFORM_CONFIG: Record<string, {
  name: string;
  color: string;
  icon: string;
  authUrl: string;
  setupGuide: string;
}> = {
  facebook: {
    name: 'Facebook',
    color: '#1877F2',
    icon: 'facebook',
    authUrl: '/api/oauth/facebook',
    setupGuide: '1. Go to developers.facebook.com\n2. Create a Business app\n3. Add Facebook Login product\n4. Set OAuth redirect URI\n5. Get App ID and App Secret',
  },
  instagram: {
    name: 'Instagram',
    color: '#E4405F',
    icon: 'instagram',
    authUrl: '/api/oauth/facebook', // IG uses Meta's OAuth
    setupGuide: '1. Convert to Business/Creator account\n2. Link to a Facebook Page\n3. Use Meta Graph API\n4. Enable Content Publishing\n5. Get Page Access Token',
  },
  linkedin: {
    name: 'LinkedIn',
    color: '#0A66C2',
    icon: 'linkedin',
    authUrl: '/api/oauth/linkedin',
    setupGuide: '1. Go to developer.linkedin.com\n2. Create an app\n3. Request w_member_social scope\n4. Set OAuth redirect URI\n5. Get Client ID and Secret',
  },
  twitter: {
    name: 'X (Twitter)',
    color: '#000000',
    icon: 'twitter',
    authUrl: '/api/oauth/twitter',
    setupGuide: '1. Go to developer.x.com\n2. Create a project + app\n3. Set up OAuth 2.0 with PKCE\n4. Set callback URL\n5. Get Client ID and Secret',
  },
  reddit: {
    name: 'Reddit',
    color: '#FF4500',
    icon: 'reddit',
    authUrl: '/api/oauth/reddit',
    setupGuide: '1. Go to old.reddit.com/prefs/apps\n2. Create a "script" app\n3. Set redirect URI\n4. Get client_id and client_secret',
  },
};

export async function GET() {
  const accounts = await db.socialAccount.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const connectedPlatforms = new Set(accounts.filter(a => a.isActive).map(a => a.platform));

  const platforms = Object.entries(PLATFORM_CONFIG).map(([key, config]) => ({
    id: key,
    ...config,
    connected: connectedPlatforms.has(key),
    account: accounts.find(a => a.platform === key && a.isActive) || null,
  }));

  return NextResponse.json({ platforms, accounts });
}