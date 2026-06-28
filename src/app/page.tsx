'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  Share2, Link2, Unlink, Send, CheckCircle2, XCircle, AlertCircle,
  Facebook, Instagram, Linkedin, Twitter, MessageCircle,
  Settings, History, Plus, Trash2, ExternalLink, Copy, Loader2,
  Image as ImageIcon, Globe, Shield
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────
interface SocialAccount {
  id: string
  platform: string
  platformUserId: string
  displayName: string
  accessToken: string
  isActive: boolean
  createdAt: string
  metadata: string | null
}

interface PlatformConfig {
  id: string
  name: string
  color: string
  description: string
  authEndpoint: string
  setupSteps: string[]
}

interface PostRecord {
  id: string
  content: string
  imageUrl: string | null
  platforms: string
  status: string
  results: string | null
  createdAt: string
}

// ─── Platform Configs ─────────────────────────────────
const PLATFORMS: PlatformConfig[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    color: '#1877F2',
    description: 'Share posts to your Facebook Page',
    authEndpoint: '/api/oauth/facebook',
    setupSteps: [
      'Go to developers.facebook.com → Create Business App',
      'Add "Facebook Login" product',
      'Request: pages_manage_posts, pages_read_engagement, instagram_basic, instagram_content_publish',
      'Set redirect URI in OAuth settings',
      'Add FACEBOOK_APP_ID and FACEBOOK_APP_SECRET to .env',
    ],
  },
  {
    id: 'instagram',
    name: 'Instagram',
    color: '#E4405F',
    description: 'Publish to Instagram Business account (via Facebook Page)',
    authEndpoint: '/api/oauth/facebook',
    setupSteps: [
      'Convert Instagram to Business/Creator account',
      'Link it to a Facebook Page you manage',
      'Connect Facebook first (Instagram uses Meta\'s API)',
      'Enable Content Publishing in app settings',
      'Note: Image required for Instagram posts',
    ],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    color: '#0A66C2',
    description: 'Post to your LinkedIn profile',
    authEndpoint: '/api/oauth/linkedin',
    setupSteps: [
      'Go to developer.linkedin.com → Create App',
      'Add "Sign In with LinkedIn" product',
      'Request w_member_social scope',
      'Set redirect URI in OAuth 2.0 settings',
      'Add LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET to .env',
    ],
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    color: '#000000',
    description: 'Tweet from your X account (280 char limit)',
    authEndpoint: '/api/oauth/twitter',
    setupSteps: [
      'Go to developer.x.com → Create Project + App',
      'Set up OAuth 2.0 with PKCE',
      'Enable User authentication',
      'Add tweet.read, tweet.write, users.read, offline.access scopes',
      'Add TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET to .env',
    ],
  },
  {
    id: 'reddit',
    name: 'Reddit',
    color: '#FF4500',
    description: 'Submit posts to Reddit',
    authEndpoint: '/api/oauth/reddit',
    setupSteps: [
      'Go to old.reddit.com/prefs/apps',
      'Click "create another app" → select "script"',
      'Set redirect URI',
      'Note client_id (under app name) and client_secret',
      'Add REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET to .env',
    ],
  },
]

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  facebook: <Facebook className="w-5 h-5" />,
  instagram: <Instagram className="w-5 h-5" />,
  linkedin: <Linkedin className="w-5 h-5" />,
  twitter: <Twitter className="w-5 h-5" />,
  reddit: <MessageCircle className="w-5 h-5" />,
}

// ─── Main Component ──────────────────────────────────
export default function Home() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [posts, setPosts] = useState<PostRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)

  // Compose state
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set())

  // Setup dialog state
  const [setupPlatform, setSetupPlatform] = useState<PlatformConfig | null>(null)
  const [setupError, setSetupError] = useState<string | null>(null)

  useEffect(() => {
    fetchAccounts()
    fetchPosts()

    // Check for OAuth callback errors/success in URL
    const params = new URLSearchParams(window.location.search)
    const error = params.get('error')
    const connected = params.get('connected')

    if (error) {
      toast.error(`Connection failed: ${error.replace(/_/g, ' ')}`)
      window.history.replaceState({}, '', '/')
    }
    if (connected) {
      const names = connected.split(',').map(p => PLATFORMS.find(pl => pl.id === p)?.name || p)
      toast.success(`Connected: ${names.join(', ')}`)
      window.history.replaceState({}, '', '/')
      // Refresh accounts after redirect
      setTimeout(fetchAccounts, 500)
    }
  }, [])

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/accounts')
      const data = await res.json()
      setAccounts(Array.isArray(data) ? data : [])
    } catch {
      setAccounts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/publish')
      const data = await res.json()
      setPosts(Array.isArray(data) ? data : [])
    } catch {
      setPosts([])
    }
  }

  const connectPlatform = async (platform: PlatformConfig) => {
    try {
      const res = await fetch(platform.authEndpoint)
      const data = await res.json()

      if (data.error) {
        setSetupPlatform(platform)
        setSetupError(data.setupGuide || data.error)
        return
      }

      // Redirect to OAuth provider
      window.location.href = data.url
    } catch {
      toast.error(`Failed to initiate ${platform.name} connection`)
    }
  }

  const disconnectAccount = async (id: string) => {
    try {
      await fetch('/api/accounts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setAccounts(prev => prev.filter(a => a.id !== id))
      setSelectedPlatforms(prev => {
        const next = new Set(prev)
        const account = accounts.find(a => a.id === id)
        if (account) next.delete(account.platform)
        return next
      })
      toast.success('Account disconnected')
    } catch {
      toast.error('Failed to disconnect account')
    }
  }

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => {
      const next = new Set(prev)
      if (next.has(platformId)) next.delete(platformId)
      else next.add(platformId)
      return next
    })
  }

  const handlePublish = async () => {
    if (!content.trim()) {
      toast.error('Please write something to post')
      return
    }
    if (selectedPlatforms.size === 0) {
      toast.error('Please select at least one platform')
      return
    }

    setPublishing(true)
    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          imageUrl: imageUrl.trim() || undefined,
          platforms: Array.from(selectedPlatforms),
        }),
      })
      const data = await res.json()

      if (data.error) {
        toast.error(data.error)
        return
      }

      // Show per-platform results
      const results = data.results as Array<{ platform: string; success: boolean; error?: string; url?: string }>
      results.forEach(r => {
        const name = PLATFORMS.find(p => p.id === r.platform)?.name || r.platform
        if (r.success) {
          toast.success(`${name}: Published! ${r.url ? `View: ${r.url}` : ''}`)
        } else {
          toast.error(`${name}: ${r.error || 'Failed'}`)
        }
      })

      setContent('')
      setImageUrl('')
      fetchPosts()
    } catch {
      toast.error('Publishing failed. Check your network connection.')
    } finally {
      setPublishing(false)
    }
  }

  const getConnectedAccount = (platformId: string) => {
    return accounts.find(a => a.platform === platformId && a.isActive)
  }

  // ─── Render ────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Social Dashboard</h1>
              <p className="text-xs text-gray-500">Post everywhere, one click</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {accounts.filter(a => a.isActive).length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {accounts.filter(a => a.isActive).length} connected
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6">
        <Tabs defaultValue="compose" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="compose" className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Compose
            </TabsTrigger>
            <TabsTrigger value="accounts" className="flex items-center gap-2">
              <Link2 className="w-4 h-4" /> Accounts
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="w-4 h-4" /> History
            </TabsTrigger>
          </TabsList>

          {/* ═══ COMPOSE TAB ═══ */}
          <TabsContent value="compose" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Compose Area */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Create Post</CardTitle>
                    <CardDescription>Write your content and select platforms to publish</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="What's on your mind? Write your post here..."
                      value={content}
                      onChange={e => setContent(e.target.value)}
                      className="min-h-[160px] resize-y text-[15px] leading-relaxed"
                    />
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Image URL (optional — required for Instagram)"
                        value={imageUrl}
                        onChange={e => setImageUrl(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    {imageUrl && (
                      <div className="rounded-lg overflow-hidden border border-gray-200 max-h-48">
                        <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-gray-400">
                        {content.length} characters
                        {selectedPlatforms.has('twitter') && content.length > 280 && (
                          <span className="text-red-500 ml-2">X limits to 280 chars</span>
                        )}
                      </span>
                      <Button
                        onClick={handlePublish}
                        disabled={publishing || !content.trim() || selectedPlatforms.size === 0}
                        className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white gap-2"
                      >
                        {publishing ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Publishing...</>
                        ) : (
                          <><Send className="w-4 h-4" /> Publish to {selectedPlatforms.size} platform{selectedPlatforms.size !== 1 ? 's' : ''}</>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Platform Selector */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Select Platforms</CardTitle>
                    <CardDescription>Choose where to publish</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {PLATFORMS.map(platform => {
                      const account = getConnectedAccount(platform.id)
                      const isSelected = selectedPlatforms.has(platform.id)
                      const isConnected = !!account

                      return (
                        <div
                          key={platform.id}
                          className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-orange-400 bg-orange-50'
                              : isConnected
                              ? 'border-gray-200 bg-white hover:border-gray-300'
                              : 'border-dashed border-gray-300 bg-gray-50 opacity-70'
                          }`}
                          onClick={() => isConnected && togglePlatform(platform.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center text-white"
                              style={{ backgroundColor: platform.color }}
                            >
                              {PLATFORM_ICONS[platform.id]}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{platform.name}</p>
                              <p className="text-xs text-gray-500">
                                {isConnected ? account.displayName : 'Not connected'}
                              </p>
                            </div>
                          </div>
                          {isConnected ? (
                            <Switch checked={isSelected} onCheckedChange={() => togglePlatform(platform.id)} />
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-orange-600 hover:text-orange-700"
                              onClick={e => { e.stopPropagation(); connectPlatform(platform) }}
                            >
                              Connect
                            </Button>
                          )}
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ═══ ACCOUNTS TAB ═══ */}
          <TabsContent value="accounts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="w-5 h-5" /> Connected Accounts
                </CardTitle>
                <CardDescription>
                  Manage your social media connections. Click &quot;Connect&quot; to authorize each platform via OAuth.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {PLATFORMS.map(platform => {
                    const account = getConnectedAccount(platform.id)
                    const isConnected = !!account

                    return (
                      <Card key={platform.id} className="border-2 transition-all hover:shadow-md">
                        <CardContent className="pt-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-11 h-11 rounded-xl flex items-center justify-center text-white"
                                style={{ backgroundColor: platform.color }}
                              >
                                {PLATFORM_ICONS[platform.id]}
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{platform.name}</h3>
                                <p className="text-xs text-gray-500 mt-0.5">{platform.description}</p>
                              </div>
                            </div>
                            {isConnected && (
                              <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Connected
                              </Badge>
                            )}
                          </div>

                          {isConnected ? (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                <div>
                                  <p className="text-sm font-medium">{account.displayName}</p>
                                  <p className="text-xs text-gray-400">ID: {account.platformUserId.slice(0, 12)}...</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => disconnectAccount(account.id)}
                                >
                                  <Unlink className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <Button
                                className="w-full gap-2"
                                variant="outline"
                                onClick={() => connectPlatform(platform)}
                              >
                                <ExternalLink className="w-4 h-4" /> Connect {platform.name}
                              </Button>
                              <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 space-y-1">
                                <p className="font-medium text-gray-700 mb-2">Setup steps:</p>
                                {platform.setupSteps.map((step, i) => (
                                  <p key={i} className="flex gap-2">
                                    <span className="text-gray-400 font-mono">{i + 1}.</span>
                                    <span>{step}</span>
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {/* Setup Guide Banner */}
                <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex gap-3">
                    <Shield className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">How OAuth Works</p>
                      <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                        Your passwords are <strong>never</strong> stored or entered here. Each platform uses a secure OAuth flow:
                        you log in directly on the platform&apos;s website, authorize our app once, and we receive a token that allows posting on your behalf.
                        Tokens are stored encrypted in your local database and auto-refresh when needed.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ HISTORY TAB ═══ */}
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="w-5 h-5" /> Post History
                </CardTitle>
                <CardDescription>View your recent posts and their publishing status across platforms.</CardDescription>
              </CardHeader>
              <CardContent>
                {posts.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Send className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No posts yet. Compose your first post to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto">
                    {posts.map(post => {
                      let results: Array<{ platform: string; success: boolean; error?: string }> = []
                      try { results = JSON.parse(post.results || '[]') } catch {}

                      return (
                        <div key={post.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <p className="text-sm text-gray-800 whitespace-pre-wrap flex-1 mr-4">{post.content}</p>
                            <Badge
                              variant={post.status === 'published' ? 'secondary' : 'destructive'}
                              className={post.status === 'published' ? 'bg-green-100 text-green-700' : ''}
                            >
                              {post.status === 'published' ? <><CheckCircle2 className="w-3 h-3 mr-1" /> Published</> : <><XCircle className="w-3 h-3 mr-1" /> Failed</>}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {JSON.parse(post.platforms || '[]').map((p: string) => (
                              <Badge key={p} variant="outline" className="text-xs">
                                {PLATFORM_ICONS[p]} {PLATFORMS.find(pl => pl.id === p)?.name || p}
                              </Badge>
                            ))}
                          </div>
                          {results.length > 0 && (
                            <div className="text-xs space-y-1">
                              {results.map((r, i) => (
                                <div key={i} className="flex items-center gap-1.5">
                                  {r.success ? (
                                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                                  ) : (
                                    <XCircle className="w-3 h-3 text-red-500" />
                                  )}
                                  <span className="text-gray-600">
                                    {PLATFORMS.find(pl => pl.id === r.platform)?.name}: {r.success ? 'OK' : r.error}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-gray-400">{new Date(post.createdAt).toLocaleString()}</p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 text-center text-xs text-gray-400">
          Social Dashboard — Post to Facebook, Instagram, LinkedIn, X, and Reddit in one click. Your tokens are stored locally.
        </div>
      </footer>

      {/* Setup Error Dialog */}
      {setupPlatform && setupError && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setSetupPlatform(null); setSetupError(null) }}>
          <Card className="max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                {setupPlatform.name} — Setup Required
              </CardTitle>
              <CardDescription>
                Configure your {setupPlatform.name} developer credentials before connecting.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 rounded-lg p-4 text-sm font-mono text-gray-700 whitespace-pre-wrap space-y-1">
                {setupError.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(setupError)
                    toast.success('Setup steps copied to clipboard')
                  }}
                >
                  <Copy className="w-4 h-4 mr-1" /> Copy Steps
                </Button>
                <Button size="sm" onClick={() => { setSetupPlatform(null); setSetupError(null) }}>
                  Got it
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}