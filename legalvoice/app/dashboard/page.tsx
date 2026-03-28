'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthContext } from '@/app/lib/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Badge } from '@/app/components/ui/badge';
import { Icons } from '@/app/components/icons';
import LoadingSpinner from '@/app/components/LoadingSpinner';

export default function DashboardPage() {
  const { user, profile, loading } = useAuthContext();
  const [greeting, setGreeting] = useState('Good day');

  useEffect(() => {
    // Set greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center space-y-4">
        <h1 className="text-2xl font-bold">Please sign in to view your dashboard</h1>
        <Link 
          href="/login"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Sign In
        </Link>
      </div>
    );
  }

  const userName = profile?.displayName || user.displayName || user.email?.split('@')[0] || 'User';

  return (
    <div className="min-h-screen flex-1 space-y-12 bg-[#07081a] text-white p-8 pt-16 md:p-12 md:pt-24 relative">
      {/* Background overlay with gradient effect */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#0f1129] to-[#07081a] opacity-70 pointer-events-none"></div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 z-0 overflow-hidden opacity-[0.15] pointer-events-none">
        <svg className="absolute top-0 left-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <radialGradient id="grid-gradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
          </defs>
          <g stroke="url(#grid-gradient)" strokeWidth="0.5">
            {[...Array(12)].map((_, i) => (
              <line key={`h-${i}`} x1="0" y1={i * 8.33} x2="100" y2={i * 8.33} />
            ))}
            {[...Array(12)].map((_, i) => (
              <line key={`v-${i}`} x1={i * 8.33} y1="0" x2={i * 8.33} y2="100" />
            ))}
          </g>
        </svg>
      </div>
      
      <div className="relative z-10">
        <div className="flex flex-col items-start space-y-4 mb-12">
          <h2 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-[#b3bcff] drop-shadow-sm">{greeting}, {userName}!</h2>
          <p className="text-xl text-[#ecf0ff] text-opacity-80 max-w-2xl">
            Welcome to your legal assistant dashboard. Here&apos;s an overview of your account and recent activities.
          </p>
        </div>
        
        <Tabs defaultValue="overview" className="space-y-8 mt-12">
          <TabsList className="bg-[#1c1f36] border border-[#272c47]">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#0e1022] data-[state=active]:text-white">Overview</TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-[#0e1022] data-[state=active]:text-white">Analytics</TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-[#0e1022] data-[state=active]:text-white">Reports</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="bg-[#0e1022] border border-[#272c47] text-white shadow-lg hover:shadow-[0_0_15px_rgba(60,36,194,0.2)] transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Credits Remaining
                  </CardTitle>
                  <Icons.credit className="h-4 w-4 text-[#ecf0ff] text-opacity-60" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{profile?.credits || 0}</div>
                  <p className="text-xs text-[#ecf0ff] text-opacity-70">
                    {profile?.subscription ? 'Premium plan' : 'Free plan'}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-[#0e1022] border border-[#272c47] text-white shadow-lg hover:shadow-[0_0_15px_rgba(60,36,194,0.2)] transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Account Status
                  </CardTitle>
                  <Icons.user className="h-4 w-4 text-[#ecf0ff] text-opacity-60" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {profile?.isVerified ? (
                      <Badge className="bg-green-500 text-white">Verified</Badge>
                    ) : (
                      <Badge variant="outline" className="border-[#272c47] text-[#ecf0ff]">Unverified</Badge>
                    )}
                  </div>
                  <p className="text-xs text-[#ecf0ff] text-opacity-70">
                    {profile?.role || 'User'} account
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-[#0e1022] border border-[#272c47] text-white shadow-lg hover:shadow-[0_0_15px_rgba(60,36,194,0.2)] transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                  <Icons.activity className="h-4 w-4 text-[#ecf0ff] text-opacity-60" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link 
                    href="/chat"
                    className="flex items-center rounded-md bg-[#3c24c2] px-3 py-2 text-sm font-medium text-white hover:bg-[#482fd0] transition-all duration-300 shadow-[0_0_10px_rgba(60,36,194,0.3)]"
                  >
                    <Icons.message className="mr-2 h-4 w-4" />
                    New Chat
                  </Link>
                  <Link 
                    href="/document-builder"
                    className="flex items-center rounded-md border border-[#272c47] px-3 py-2 text-sm font-medium hover:bg-[#1c1f36] transition-all duration-300"
                  >
                    <Icons.file className="mr-2 h-4 w-4" />
                    Create Document
                  </Link>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="col-span-1 bg-[#0e1022] border border-[#272c47] text-white shadow-lg hover:shadow-[0_0_15px_rgba(60,36,194,0.2)] transition-all duration-300">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription className="text-[#ecf0ff] text-opacity-60">
                    Your recent interactions with LegalVoice
                  </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <div className="space-y-8">
                    {/* Activity items would go here - For now showing empty state */}
                    <div className="flex justify-center py-8 text-center">
                      <div className="max-w-sm space-y-2">
                        <Icons.empty className="mx-auto h-12 w-12 text-[#ecf0ff] text-opacity-40" />
                        <h3 className="text-lg font-semibold">No recent activity</h3>
                        <p className="text-sm text-[#ecf0ff] text-opacity-60">
                          Start a new chat or create a document to see your activity here.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="col-span-1 bg-[#0e1022] border border-[#272c47] text-white shadow-lg hover:shadow-[0_0_15px_rgba(60,36,194,0.2)] transition-all duration-300">
                <CardHeader>
                  <CardTitle>Featured Tools</CardTitle>
                  <CardDescription className="text-[#ecf0ff] text-opacity-60">
                    Explore our powerful legal tools
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4 rounded-md border border-[#272c47] bg-[#0c0d24] p-4 hover:border-[#3c24c2] transition-all duration-300">
                      <Icons.contract className="h-6 w-6 text-[#0c8bdb]" />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          Contract Analysis
                        </p>
                        <p className="text-sm text-[#ecf0ff] text-opacity-60">
                          Upload a contract to get a detailed analysis
                        </p>
                      </div>
                      <Link 
                        href="/analyze"
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-[#272c47] bg-[#0e1022] hover:bg-[#1c1f36] h-8 w-8"
                      >
                        <Icons.arrowRight className="h-4 w-4" />
                        <span className="sr-only">Go to contract analysis</span>
                      </Link>
                    </div>
                    
                    <div className="flex items-center space-x-4 rounded-md border border-[#272c47] bg-[#0c0d24] p-4 hover:border-[#3c24c2] transition-all duration-300">
                      <Icons.search className="h-6 w-6 text-[#0c8bdb]" />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          Legal Research
                        </p>
                        <p className="text-sm text-[#ecf0ff] text-opacity-60">
                          Find relevant cases and statutes
                        </p>
                      </div>
                      <Link 
                        href="/research"
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-[#272c47] bg-[#0e1022] hover:bg-[#1c1f36] h-8 w-8"
                      >
                        <Icons.arrowRight className="h-4 w-4" />
                        <span className="sr-only">Go to legal research</span>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="analytics" className="h-[300px] space-y-4">
            <div className="flex h-full items-center justify-center bg-[#0e1022] border border-[#272c47] rounded-xl p-8">
              <div className="text-center">
                <Icons.chart className="mx-auto h-12 w-12 text-[#ecf0ff] text-opacity-40" />
                <h3 className="mt-4 text-lg font-semibold">Analytics Coming Soon</h3>
                <p className="mt-2 text-sm text-[#ecf0ff] text-opacity-60">
                  We&apos;re working on bringing you detailed analytics of your legal work.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="reports" className="h-[300px] space-y-4">
            <div className="flex h-full items-center justify-center bg-[#0e1022] border border-[#272c47] rounded-xl p-8">
              <div className="text-center">
                <Icons.file className="mx-auto h-12 w-12 text-[#ecf0ff] text-opacity-40" />
                <h3 className="mt-4 text-lg font-semibold">Reports Coming Soon</h3>
                <p className="mt-2 text-sm text-[#ecf0ff] text-opacity-60">
                  Generate comprehensive reports of your legal activities.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 