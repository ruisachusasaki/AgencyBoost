import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Plus, Search, Filter, Calendar, BarChart3, Settings, 
  Facebook, Instagram, Twitter, Linkedin, Youtube, Send,
  Heart, MessageCircle, Share, Eye, Clock, CheckCircle2,
  AlertCircle, XCircle, Edit, Trash2, Copy, ExternalLink
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SocialMediaAccount, SocialMediaPost, SocialMediaTemplate } from "@shared/schema";

// Platform configuration
const PLATFORMS = {
  facebook: { name: "Facebook", icon: Facebook, color: "#1877F2" },
  instagram: { name: "Instagram", icon: Instagram, color: "#E4405F" },
  twitter: { name: "Twitter", icon: Twitter, color: "#1DA1F2" },
  linkedin: { name: "LinkedIn", icon: Linkedin, color: "#0A66C2" },
  youtube: { name: "YouTube", icon: Youtube, color: "#FF0000" },
  tiktok: { name: "TikTok", icon: MessageCircle, color: "#000000" },
  pinterest: { name: "Pinterest", icon: Heart, color: "#BD081C" },
};

const POST_STATUS_CONFIG = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-800", icon: Edit },
  scheduled: { label: "Scheduled", color: "bg-blue-100 text-blue-800", icon: Clock },
  published: { label: "Published", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  failed: { label: "Failed", color: "bg-red-100 text-red-800", icon: XCircle },
};

export default function SocialMediaPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>("");

  const { toast } = useToast();

  // Queries
  const { data: accounts = [], isLoading: accountsLoading } = useQuery<SocialMediaAccount[]>({
    queryKey: ["/api/social-media-accounts"],
  });

  const { data: posts = [], isLoading: postsLoading } = useQuery<SocialMediaPost[]>({
    queryKey: ["/api/social-media-posts"],
  });

  const { data: templates = [] } = useQuery<SocialMediaTemplate[]>({
    queryKey: ["/api/social-media-templates"],
  });

  // Mutations
  const connectAccountMutation = useMutation({
    mutationFn: (accountData: any) => apiRequest("/api/social-media-accounts", "POST", accountData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-media-accounts"] });
      setIsConnectDialogOpen(false);
      toast({ title: "Account connected successfully" });
    },
  });

  const createPostMutation = useMutation({
    mutationFn: (postData: any) => apiRequest("/api/social-media-posts", "POST", postData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social-media-posts"] });
      setIsPostDialogOpen(false);
      toast({ title: "Post created successfully" });
    },
  });

  // Filter accounts and posts
  const filteredAccounts = accounts.filter(account => 
    selectedPlatform === "all" || account.platform === selectedPlatform
  );

  const filteredPosts = posts.filter(post => 
    (selectedPlatform === "all" || accounts.find(acc => acc.id === post.accountId)?.platform === selectedPlatform) &&
    (searchQuery === "" || post.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Analytics calculations
  const totalFollowers = accounts.reduce((sum, acc) => sum + (acc.followers || 0), 0);
  const totalPosts = posts.length;
  const scheduledPosts = posts.filter(p => p.status === "scheduled").length;
  const publishedToday = posts.filter(p => 
    p.status === "published" && 
    p.publishedAt && 
    new Date(p.publishedAt).toDateString() === new Date().toDateString()
  ).length;

  const connectAccount = (data: any) => {
    const accountData = {
      ...data,
      clientId: "client-1", // In real app, this would come from context
      followers: Math.floor(Math.random() * 10000),
      following: Math.floor(Math.random() * 1000),
      posts: Math.floor(Math.random() * 500),
    };
    connectAccountMutation.mutate(accountData);
  };

  const createPost = (data: any) => {
    const postData = {
      ...data,
      clientId: "client-1",
      authorId: "user-1",
      accountId: selectedAccount,
      status: data.scheduledAt ? "scheduled" : "draft",
      hashtags: data.hashtags ? data.hashtags.split(" ").filter((tag: string) => tag.startsWith("#")) : [],
      likes: 0,
      comments: 0,
      shares: 0,
      impressions: 0,
    };
    createPostMutation.mutate(postData);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 social-media-page">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Social Media Management</h1>
            <p className="text-gray-600">Manage your social media presence across all platforms</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Connect Account
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Connect Social Media Account</DialogTitle>
                </DialogHeader>
                <ConnectAccountForm onSubmit={connectAccount} isLoading={connectAccountMutation.isPending} />
              </DialogContent>
            </Dialog>
            
            <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4" />
                  Create Post
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Social Media Post</DialogTitle>
                </DialogHeader>
                <CreatePostForm 
                  accounts={accounts}
                  templates={templates}
                  onSubmit={createPost} 
                  selectedAccount={selectedAccount}
                  setSelectedAccount={setSelectedAccount}
                  isLoading={createPostMutation.isPending} 
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Followers</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalFollowers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Across all platforms</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPosts}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{scheduledPosts}</div>
              <p className="text-xs text-muted-foreground">Upcoming posts</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published Today</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{publishedToday}</div>
              <p className="text-xs text-muted-foreground">Posts today</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList className="social-media-tabslist">
              <TabsTrigger value="overview" className="social-media-tab">Overview</TabsTrigger>
              <TabsTrigger value="posts" className="social-media-tab">Posts</TabsTrigger>
              <TabsTrigger value="accounts" className="social-media-tab">Accounts</TabsTrigger>
              <TabsTrigger value="analytics" className="social-media-tab">Analytics</TabsTrigger>
              <TabsTrigger value="templates" className="social-media-tab">Templates</TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search posts..."
                  className="pl-10 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  {Object.entries(PLATFORMS).map(([key, platform]) => (
                    <SelectItem key={key} value={key}>{platform.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="overview" className="space-y-4">
            <OverviewTab accounts={filteredAccounts} posts={filteredPosts} />
          </TabsContent>

          <TabsContent value="posts" className="space-y-4">
            <PostsTab posts={filteredPosts} accounts={accounts} />
          </TabsContent>

          <TabsContent value="accounts" className="space-y-4">
            <AccountsTab accounts={filteredAccounts} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <AnalyticsTab accounts={filteredAccounts} posts={filteredPosts} />
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <TemplatesTab templates={templates} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Component implementations
function ConnectAccountForm({ onSubmit, isLoading }: { onSubmit: (data: any) => void; isLoading: boolean }) {
  const [formData, setFormData] = useState({
    platform: "",
    accountName: "",
    username: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Platform</label>
        <Select value={formData.platform} onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select platform" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PLATFORMS).map(([key, platform]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  <platform.icon className="h-4 w-4" />
                  {platform.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Account Name</label>
        <Input 
          value={formData.accountName}
          onChange={(e) => setFormData(prev => ({ ...prev, accountName: e.target.value }))}
          placeholder="Business Name or Personal Account"
          required
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Username</label>
        <Input 
          value={formData.username}
          onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
          placeholder="@username"
          required
        />
      </div>
      
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-primary/90">
          {isLoading ? "Connecting..." : "Connect Account"}
        </Button>
      </div>
    </form>
  );
}

function CreatePostForm({ 
  accounts, 
  templates, 
  onSubmit, 
  selectedAccount, 
  setSelectedAccount, 
  isLoading 
}: { 
  accounts: SocialMediaAccount[];
  templates: SocialMediaTemplate[];
  onSubmit: (data: any) => void;
  selectedAccount: string;
  setSelectedAccount: (id: string) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState({
    content: "",
    hashtags: "",
    scheduledAt: "",
    linkUrl: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Account</label>
        <Select value={selectedAccount} onValueChange={setSelectedAccount}>
          <SelectTrigger>
            <SelectValue placeholder="Select account" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((account) => {
              const platform = PLATFORMS[account.platform as keyof typeof PLATFORMS];
              return (
                <SelectItem key={account.id} value={account.id}>
                  <div className="flex items-center gap-2">
                    <platform.icon className="h-4 w-4" />
                    {account.accountName} (@{account.username})
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Content</label>
        <Textarea 
          value={formData.content}
          onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
          placeholder="What's happening?"
          className="min-h-24"
          required
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Hashtags</label>
          <Input 
            value={formData.hashtags}
            onChange={(e) => setFormData(prev => ({ ...prev, hashtags: e.target.value }))}
            placeholder="#marketing #social"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Link URL</label>
          <Input 
            value={formData.linkUrl}
            onChange={(e) => setFormData(prev => ({ ...prev, linkUrl: e.target.value }))}
            placeholder="https://example.com"
            type="url"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">Schedule (Optional)</label>
        <Input 
          value={formData.scheduledAt}
          onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
          type="datetime-local"
        />
      </div>
      
      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isLoading || !selectedAccount} className="bg-primary hover:bg-primary/90">
          {isLoading ? "Creating..." : formData.scheduledAt ? "Schedule Post" : "Create Draft"}
        </Button>
      </div>
    </form>
  );
}

function OverviewTab({ accounts, posts }: { accounts: SocialMediaAccount[]; posts: SocialMediaPost[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {accounts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No accounts connected yet</p>
            ) : (
              accounts.slice(0, 5).map((account) => {
                const platform = PLATFORMS[account.platform as keyof typeof PLATFORMS];
                return (
                  <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <platform.icon className="h-5 w-5" style={{ color: platform.color }} />
                      <div>
                        <p className="font-medium">{account.accountName}</p>
                        <p className="text-sm text-gray-500">@{account.username}</p>
                      </div>
                    </div>
                    <Badge variant={account.isActive ? "default" : "secondary"}>
                      {account.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {posts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No posts created yet</p>
            ) : (
              posts.slice(0, 5).map((post) => {
                const account = accounts.find(acc => acc.id === post.accountId);
                const platform = account ? PLATFORMS[account.platform as keyof typeof PLATFORMS] : null;
                const statusConfig = POST_STATUS_CONFIG[post.status as keyof typeof POST_STATUS_CONFIG];
                
                return (
                  <div key={post.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {platform && <platform.icon className="h-4 w-4" style={{ color: platform.color }} />}
                        <span className="text-sm text-gray-500">@{account?.username}</span>
                      </div>
                      <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                    </div>
                    <p className="text-sm line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {post.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {post.comments}
                      </span>
                      <span className="flex items-center gap-1">
                        <Share className="h-3 w-3" />
                        {post.shares}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PostsTab({ posts, accounts }: { posts: SocialMediaPost[]; accounts: SocialMediaAccount[] }) {
  return (
    <div className="space-y-4">
      {posts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Send className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No posts yet</h3>
            <p className="text-gray-500 mb-4">Create your first social media post to get started</p>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Create Post
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post) => {
            const account = accounts.find(acc => acc.id === post.accountId);
            const platform = account ? PLATFORMS[account.platform as keyof typeof PLATFORMS] : null;
            const statusConfig = POST_STATUS_CONFIG[post.status as keyof typeof POST_STATUS_CONFIG];
            
            return (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {platform && <platform.icon className="h-4 w-4" style={{ color: platform.color }} />}
                      <span className="text-sm text-gray-500">@{account?.username}</span>
                    </div>
                    <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-3 line-clamp-3">{post.content}</p>
                  
                  {post.hashtags && post.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {post.hashtags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {post.hashtags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{post.hashtags.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Heart className="h-3 w-3" />
                        {post.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {post.comments}
                      </span>
                      <span className="flex items-center gap-1">
                        <Share className="h-3 w-3" />
                        {post.shares}
                      </span>
                    </div>
                    {post.impressions > 0 && (
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {post.impressions}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {post.scheduledAt ? `Scheduled for ${new Date(post.scheduledAt).toLocaleDateString()}` :
                       post.publishedAt ? `Published ${new Date(post.publishedAt).toLocaleDateString()}` :
                       `Created ${new Date(post.createdAt).toLocaleDateString()}`}
                    </span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AccountsTab({ accounts }: { accounts: SocialMediaAccount[] }) {
  return (
    <div className="space-y-4">
      {accounts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Settings className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No accounts connected</h3>
            <p className="text-gray-500 mb-4">Connect your social media accounts to start managing posts</p>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Connect Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => {
            const platform = PLATFORMS[account.platform as keyof typeof PLATFORMS];
            
            return (
              <Card key={account.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <platform.icon className="h-6 w-6" style={{ color: platform.color }} />
                      <div>
                        <h3 className="font-medium">{account.accountName}</h3>
                        <p className="text-sm text-gray-500">@{account.username}</p>
                      </div>
                    </div>
                    <Badge variant={account.isActive ? "default" : "secondary"}>
                      {account.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center mb-4">
                    <div>
                      <p className="text-lg font-semibold">{account.followers?.toLocaleString() || 0}</p>
                      <p className="text-xs text-gray-500">Followers</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{account.following?.toLocaleString() || 0}</p>
                      <p className="text-xs text-gray-500">Following</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold">{account.posts?.toLocaleString() || 0}</p>
                      <p className="text-xs text-gray-500">Posts</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-500 mb-3">
                    <span>Last sync: {account.lastSync ? new Date(account.lastSync).toLocaleDateString() : "Never"}</span>
                    <span>Added: {new Date(account.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Settings className="h-3 w-3 mr-1" />
                      Settings
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AnalyticsTab({ accounts, posts }: { accounts: SocialMediaAccount[]; posts: SocialMediaPost[] }) {
  // Calculate engagement metrics
  const totalEngagement = posts.reduce((sum, post) => 
    sum + (post.likes || 0) + (post.comments || 0) + (post.shares || 0), 0
  );
  const avgEngagement = posts.length > 0 ? Math.round(totalEngagement / posts.length) : 0;
  const totalImpressions = posts.reduce((sum, post) => sum + (post.impressions || 0), 0);
  const engagementRate = totalImpressions > 0 ? ((totalEngagement / totalImpressions) * 100).toFixed(2) : "0.00";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEngagement.toLocaleString()}</div>
            <p className="text-xs text-gray-500">Likes, comments, shares</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Avg. Engagement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgEngagement}</div>
            <p className="text-xs text-gray-500">Per post</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Engagement Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{engagementRate}%</div>
            <p className="text-xs text-gray-500">Engagement/Impressions</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platform Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(PLATFORMS).map(([key, platform]) => {
              const platformAccounts = accounts.filter(acc => acc.platform === key);
              const platformPosts = posts.filter(post => 
                platformAccounts.some(acc => acc.id === post.accountId)
              );
              const platformEngagement = platformPosts.reduce((sum, post) => 
                sum + (post.likes || 0) + (post.comments || 0) + (post.shares || 0), 0
              );
              const platformFollowers = platformAccounts.reduce((sum, acc) => sum + (acc.followers || 0), 0);
              
              if (platformAccounts.length === 0) return null;
              
              return (
                <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <platform.icon className="h-5 w-5" style={{ color: platform.color }} />
                    <div>
                      <p className="font-medium">{platform.name}</p>
                      <p className="text-sm text-gray-500">
                        {platformAccounts.length} account{platformAccounts.length !== 1 ? 's' : ''} • 
                        {platformFollowers.toLocaleString()} followers
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{platformEngagement.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">Total engagement</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function TemplatesTab({ templates }: { templates: SocialMediaTemplate[] }) {
  return (
    <div className="space-y-4">
      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Copy className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
            <p className="text-gray-500 mb-4">Create reusable templates to speed up your content creation</p>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <Badge variant={template.isPublic ? "default" : "secondary"}>
                    {template.isPublic ? "Public" : "Private"}
                  </Badge>
                </div>
                {template.description && (
                  <CardDescription>{template.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Template</p>
                    <p className="text-sm bg-gray-50 p-2 rounded line-clamp-3">
                      {template.contentTemplate}
                    </p>
                  </div>
                  
                  {template.platforms && template.platforms.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Platforms</p>
                      <div className="flex gap-1">
                        {template.platforms.slice(0, 4).map((platformKey) => {
                          const platform = PLATFORMS[platformKey as keyof typeof PLATFORMS];
                          return platform ? (
                            <Badge key={platformKey} variant="outline" className="text-xs">
                              <platform.icon className="h-3 w-3 mr-1" />
                              {platform.name}
                            </Badge>
                          ) : null;
                        })}
                        {template.platforms.length > 4 && (
                          <Badge variant="outline" className="text-xs">
                            +{template.platforms.length - 4}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Used {template.usageCount || 0} times</span>
                    <span>{new Date(template.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Copy className="h-3 w-3 mr-1" />
                      Use
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}