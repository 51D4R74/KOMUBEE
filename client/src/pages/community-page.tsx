import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  POWER_LABELS,
  POWER_LEVELS,
  VOTE_WEIGHTS,
  type Community,
  type Thread,
  type CommunityMember,
  type ThreadMessage,
  type User,
  type Mission,
  type MissionContribution,
  type Poll,
  type PollOption,
  type PollVote,
  type Arena,
  type ArenaArgument,
  type ArenaVote,
  type Mosaic,
  type MosaicPiece,
  type Fogueira,
  type FogueiraBrasa,
} from "@shared/schema";
import {
  ArrowLeft,
  Users,
  Flame,
  Pin,
  Plus,
  Send,
  MessageCircle,
  Clock,
  Shield,
  Crown,
  Zap,
  Target,
  BarChart3,
  Swords,
  Puzzle,
  Check,
  X,
  Mic,
  Headphones,
  Link,
  Type,
  Image,
} from "lucide-react";
import { useState, useMemo } from "react";
import { formatDistanceToNow } from "date-fns";

interface CommunityPageProps {
  communityId: string;
  onBack: () => void;
}

type InteractionTab = "colmeia" | "fogueira" | "missao" | "quiz" | "arena" | "mosaico";

function PowerIcon({ level }: { level: number }) {
  switch (level) {
    case 5: return <Crown className="w-3.5 h-3.5 text-amber-400" />;
    case 4: return <Shield className="w-3.5 h-3.5 text-gray-400" />;
    case 3: return <Zap className="w-3.5 h-3.5 text-orange-400" />;
    default: return null;
  }
}

function UserAvatar({ user, size = "sm" }: { user: any; size?: "sm" | "md" }) {
  const s = size === "sm" ? "w-6 h-6 text-xs" : "w-8 h-8 text-sm";
  return (
    <div
      className={`${s} rounded-md flex items-center justify-center font-headline shrink-0`}
      style={{
        backgroundColor: (user?.avatarColor || "#E63946") + "33",
        color: user?.avatarColor || "#E63946",
      }}
    >
      {user?.username?.charAt(0).toUpperCase() || "?"}
    </div>
  );
}

const TAB_CONFIG: { id: InteractionTab; label: string; icon: any }[] = [
  { id: "colmeia", label: "Colmeia", icon: MessageCircle },
  { id: "fogueira", label: "Fogueira", icon: Flame },
  { id: "missao", label: "Missao", icon: Target },
  { id: "quiz", label: "Quiz", icon: BarChart3 },
  { id: "arena", label: "Arena", icon: Swords },
  { id: "mosaico", label: "Mosaico", icon: Puzzle },
];

export function CommunityPage({ communityId, onBack }: CommunityPageProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<InteractionTab>("colmeia");

  const { data: community, isLoading: communityLoading } = useQuery<Community>({
    queryKey: ["/api/communities", communityId],
  });

  const { data: members = [] } = useQuery<(CommunityMember & { user: User })[]>({
    queryKey: ["/api/communities", communityId, "members"],
  });

  const myMembership = members.find((m) => m.userId === user?.id);

  if (communityLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="space-y-4 w-64">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Community not found</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" data-testid="community-page">
      <div className="border-b border-border px-4 py-3 flex items-center gap-3"
        style={{ background: `linear-gradient(135deg, ${community.color}08, transparent)` }}>
        <Button size="icon" variant="ghost" onClick={onBack} data-testid="button-back">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div
          className="w-8 h-8 rounded-md flex items-center justify-center font-headline text-sm"
          style={{ backgroundColor: community.color + "33", color: community.color }}
        >
          {community.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-headline text-lg text-foreground truncate" data-testid="text-community-title">
            {community.name}
          </h1>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" /> {community.memberCount}
            </span>
            <span className="flex items-center gap-1" style={{ color: community.color }}>
              <Flame className="w-3 h-3" /> {community.heatScore}
            </span>
            {myMembership && (
              <Badge variant="secondary" className="text-xs">
                {POWER_LABELS[myMembership.powerLevel]}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="border-b border-border flex gap-0 overflow-x-auto px-2" data-testid="interaction-tabs">
        {TAB_CONFIG.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`tab-${tab.id}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-hidden">
          {activeTab === "colmeia" && (
            <ColmeiaTab communityId={communityId} members={members} myMembership={myMembership} communityColor={community.color} />
          )}
          {activeTab === "fogueira" && (
            <FogueiraTab communityId={communityId} myMembership={myMembership} communityColor={community.color} />
          )}
          {activeTab === "missao" && (
            <MissaoTab communityId={communityId} myMembership={myMembership} communityColor={community.color} />
          )}
          {activeTab === "quiz" && (
            <QuizTab communityId={communityId} myMembership={myMembership} communityColor={community.color} />
          )}
          {activeTab === "arena" && (
            <ArenaTab communityId={communityId} myMembership={myMembership} communityColor={community.color} />
          )}
          {activeTab === "mosaico" && (
            <MosaicoTab communityId={communityId} myMembership={myMembership} communityColor={community.color} />
          )}
        </div>

        <div className="w-48 border-l border-border flex-col hidden xl:flex">
          <div className="px-3 py-3 border-b border-border">
            <h3 className="font-headline text-xs text-muted-foreground uppercase tracking-wider">
              Members ({members.length})
            </h3>
          </div>
          <div className="flex-1 overflow-auto">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-2 px-3 py-1.5" data-testid={`member-${member.id}`}>
                <UserAvatar user={member.user} />
                <span className="text-xs truncate flex-1" style={{ color: member.powerLevel === 5 ? "#F4A261" : "hsl(0, 0%, 88%)" }}>
                  {member.user?.username || "Unknown"}
                </span>
                <PowerIcon level={member.powerLevel} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ColmeiaTab({ communityId, members, myMembership, communityColor }: {
  communityId: string; members: (CommunityMember & { user: User })[]; myMembership?: CommunityMember; communityColor: string;
}) {
  const { toast } = useToast();
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [newThreadContent, setNewThreadContent] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [createThreadOpen, setCreateThreadOpen] = useState(false);

  const { data: threads = [], isLoading: threadsLoading } = useQuery<Thread[]>({
    queryKey: ["/api/communities", communityId, "threads"],
  });

  const { data: messages = [] } = useQuery<(ThreadMessage & { author: User })[]>({
    queryKey: ["/api/threads", selectedThread, "messages"],
    enabled: !!selectedThread,
  });

  const createThreadMutation = useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const res = await apiRequest("POST", `/api/communities/${communityId}/threads`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities", communityId, "threads"] });
      setCreateThreadOpen(false);
      setNewThreadTitle("");
      setNewThreadContent("");
      toast({ title: "Thread created!" });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string }) => {
      const res = await apiRequest("POST", `/api/threads/${selectedThread}/messages`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/threads", selectedThread, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/communities", communityId, "threads"] });
      setNewMessage("");
    },
  });

  const selectedThreadData = threads.find((t) => t.id === selectedThread);

  const isStale = (thread: Thread) => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return new Date(thread.lastActivityAt) < sevenDaysAgo;
  };

  return (
    <div className="flex h-full">
      <div className={`${selectedThread ? "w-72 border-r border-border" : "flex-1"} flex flex-col transition-all duration-200`}>
        <div className="px-4 py-3 flex items-center justify-between gap-2 border-b border-border">
          <h2 className="font-headline text-sm text-muted-foreground">Threads</h2>
          {myMembership && myMembership.powerLevel >= POWER_LEVELS.MEMBER && (
            <Dialog open={createThreadOpen} onOpenChange={setCreateThreadOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost" data-testid="button-new-thread">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card" data-testid="dialog-create-thread">
                <DialogHeader>
                  <DialogTitle className="font-headline">New Thread</DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); if (newThreadTitle.trim()) createThreadMutation.mutate({ title: newThreadTitle.trim(), content: newThreadContent.trim() }); }} className="space-y-4">
                  <Input placeholder="Thread title" value={newThreadTitle} onChange={(e) => setNewThreadTitle(e.target.value)} data-testid="input-thread-title" />
                  <Textarea placeholder="Start the conversation..." value={newThreadContent} onChange={(e) => setNewThreadContent(e.target.value)} className="resize-none" data-testid="input-thread-content" />
                  <Button type="submit" className="w-full" disabled={createThreadMutation.isPending || !newThreadTitle.trim()} data-testid="button-submit-thread">Create Thread</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <div className="flex-1 overflow-auto">
          {threadsLoading ? (
            <div className="p-4 space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : threads.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-sm text-muted-foreground">No threads yet</p>
              <p className="text-xs text-muted-foreground mt-1 opacity-60">Start the first conversation</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {threads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => setSelectedThread(thread.id)}
                  className={`w-full text-left px-4 py-3 transition-colors hover-elevate ${selectedThread === thread.id ? "bg-secondary" : ""} ${isStale(thread) ? "opacity-50" : ""}`}
                  data-testid={`button-thread-${thread.id}`}
                >
                  <div className="flex items-start gap-2">
                    {thread.isPinned && <Pin className="w-3 h-3 text-amber-400 mt-1 shrink-0" />}
                    {isStale(thread) && <Clock className="w-3 h-3 text-red-400 mt-1 shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{thread.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{thread.messageCount}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDistanceToNow(new Date(thread.lastActivityAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedThread && selectedThreadData && (
        <div className="flex-1 flex flex-col" data-testid="thread-detail">
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" onClick={() => setSelectedThread(null)} data-testid="button-close-thread">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="min-w-0 flex-1">
                <h3 className="font-headline text-sm text-foreground truncate" data-testid="text-thread-title">{selectedThreadData.title}</h3>
                {isStale(selectedThreadData) && <span className="text-xs text-red-400">Inactive 7+ days</span>}
              </div>
            </div>
            {selectedThreadData.content && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{selectedThreadData.content}</p>}
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-12"><p className="text-sm text-muted-foreground opacity-60">No messages yet</p></div>
            ) : (
              messages.map((msg) => {
                const msgMembership = members.find((m) => m.userId === msg.authorId);
                return (
                  <div key={msg.id} className="flex gap-3 animate-float-in" data-testid={`message-${msg.id}`}>
                    <UserAvatar user={msg.author} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium" style={{ color: msgMembership?.powerLevel === 5 ? "#F4A261" : "hsl(0, 0%, 88%)" }}>
                          {msg.author?.username || "Unknown"}
                        </span>
                        <PowerIcon level={msgMembership?.powerLevel || 2} />
                        <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}</span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {myMembership && myMembership.powerLevel >= POWER_LEVELS.MEMBER && (
            <div className="px-4 py-3 border-t border-border">
              <form onSubmit={(e) => { e.preventDefault(); if (newMessage.trim()) sendMessageMutation.mutate({ content: newMessage.trim() }); }} className="flex gap-2">
                <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Write a message..." data-testid="input-message" className="flex-1" />
                <Button type="submit" size="icon" disabled={sendMessageMutation.isPending || !newMessage.trim()} data-testid="button-send-message"><Send className="w-4 h-4" /></Button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FogueiraTab({ communityId, myMembership, communityColor }: {
  communityId: string; myMembership?: CommunityMember; communityColor: string;
}) {
  const { toast } = useToast();
  const [newTitle, setNewTitle] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedFogueira, setSelectedFogueira] = useState<string | null>(null);
  const [brasaText, setBrasaText] = useState("");

  const { data: fogueirasList = [] } = useQuery<Fogueira[]>({
    queryKey: ["/api/communities", communityId, "fogueiras"],
  });

  const { data: brasas = [] } = useQuery<(FogueiraBrasa & { user: User })[]>({
    queryKey: ["/api/fogueiras", selectedFogueira, "brasas"],
    enabled: !!selectedFogueira,
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string }) => {
      const res = await apiRequest("POST", `/api/communities/${communityId}/fogueiras`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities", communityId, "fogueiras"] });
      setCreateOpen(false);
      setNewTitle("");
      toast({ title: "Fogueira lit!" });
    },
  });

  const endMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/fogueiras/${id}/end`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities", communityId, "fogueiras"] });
      toast({ title: "Fogueira ended" });
    },
  });

  const brasaMutation = useMutation({
    mutationFn: async (data: { content: string }) => {
      const res = await apiRequest("POST", `/api/fogueiras/${selectedFogueira}/brasas`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fogueiras", selectedFogueira, "brasas"] });
      setBrasaText("");
      toast({ title: "Brasa left!" });
    },
  });

  const joinMutation = useMutation({
    mutationFn: async ({ id, asSpeaker }: { id: string; asSpeaker: boolean }) => {
      const res = await apiRequest("POST", `/api/fogueiras/${id}/join`, { asSpeaker });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities", communityId, "fogueiras"] });
    },
  });

  const selectedData = fogueirasList.find((f) => f.id === selectedFogueira);
  const activeFogueiras = fogueirasList.filter((f) => f.isActive);
  const pastFogueiras = fogueirasList.filter((f) => !f.isActive);

  return (
    <div className="flex h-full">
      <div className={`${selectedFogueira ? "w-72 border-r border-border" : "flex-1"} flex flex-col`}>
        <div className="px-4 py-3 flex items-center justify-between border-b border-border">
          <h2 className="font-headline text-sm text-muted-foreground">Fogueiras</h2>
          {myMembership && myMembership.powerLevel >= POWER_LEVELS.CATALYST && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild><Button size="sm" variant="ghost" data-testid="button-new-fogueira"><Plus className="w-4 h-4" /></Button></DialogTrigger>
              <DialogContent className="bg-card">
                <DialogHeader><DialogTitle className="font-headline">Light a Fogueira</DialogTitle></DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); if (newTitle.trim()) createMutation.mutate({ title: newTitle.trim() }); }} className="space-y-4">
                  <Input placeholder="Topic..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} data-testid="input-fogueira-title" />
                  <p className="text-xs text-muted-foreground">Live audio room. Max 12 speakers, 2 hour limit. No recordings.</p>
                  <Button type="submit" className="w-full" disabled={createMutation.isPending || !newTitle.trim()} data-testid="button-create-fogueira">Light It</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <div className="flex-1 overflow-auto">
          {activeFogueiras.length > 0 && (
            <div className="p-2">
              <p className="text-xs text-muted-foreground px-2 py-1 font-headline uppercase tracking-wider">Live Now</p>
              {activeFogueiras.map((f) => (
                <button key={f.id} onClick={() => setSelectedFogueira(f.id)} className={`w-full text-left px-3 py-3 rounded-md mb-1 transition-colors hover-elevate ${selectedFogueira === f.id ? "bg-secondary" : ""}`} data-testid={`fogueira-${f.id}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-sm font-medium text-foreground truncate">{f.title}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Mic className="w-3 h-3" />{f.speakerCount}/12</span>
                    <span className="flex items-center gap-1"><Headphones className="w-3 h-3" />{f.listenerCount}</span>
                    {f.endsAt && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Ends {formatDistanceToNow(new Date(f.endsAt), { addSuffix: true })}</span>}
                  </div>
                </button>
              ))}
            </div>
          )}
          {pastFogueiras.length > 0 && (
            <div className="p-2">
              <p className="text-xs text-muted-foreground px-2 py-1 font-headline uppercase tracking-wider">Past</p>
              {pastFogueiras.map((f) => (
                <button key={f.id} onClick={() => setSelectedFogueira(f.id)} className={`w-full text-left px-3 py-2 rounded-md mb-1 opacity-60 transition-colors hover-elevate ${selectedFogueira === f.id ? "bg-secondary" : ""}`} data-testid={`fogueira-past-${f.id}`}>
                  <p className="text-sm text-foreground truncate">{f.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatDistanceToNow(new Date(f.createdAt), { addSuffix: true })}</p>
                </button>
              ))}
            </div>
          )}
          {fogueirasList.length === 0 && (
            <div className="p-8 text-center">
              <Flame className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-sm text-muted-foreground">No fogueiras yet</p>
              <p className="text-xs text-muted-foreground mt-1 opacity-60">Catalyst+ can light one</p>
            </div>
          )}
        </div>
      </div>

      {selectedFogueira && selectedData && (
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" onClick={() => setSelectedFogueira(null)}><ArrowLeft className="w-4 h-4" /></Button>
              <div className="flex-1">
                <h3 className="font-headline text-sm text-foreground">{selectedData.title}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  {selectedData.isActive && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                  <span className="text-xs text-muted-foreground">{selectedData.isActive ? "Live" : "Ended"}</span>
                  <span className="text-xs text-muted-foreground">{selectedData.speakerCount} speakers, {selectedData.listenerCount} listeners</span>
                </div>
              </div>
              {selectedData.isActive && (
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" onClick={() => joinMutation.mutate({ id: selectedData.id, asSpeaker: false })} data-testid="button-join-listener">
                    <Headphones className="w-3 h-3 mr-1" />Listen
                  </Button>
                  {selectedData.speakerCount < 12 && (
                    <Button size="sm" variant="outline" onClick={() => joinMutation.mutate({ id: selectedData.id, asSpeaker: true })} data-testid="button-join-speaker">
                      <Mic className="w-3 h-3 mr-1" />Speak
                    </Button>
                  )}
                  {myMembership && myMembership.powerLevel >= POWER_LEVELS.CATALYST && (
                    <Button size="sm" variant="destructive" onClick={() => endMutation.mutate(selectedData.id)} data-testid="button-end-fogueira">End</Button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4">
            {selectedData.isActive && (
              <div className="bg-card/50 border border-border rounded-lg p-6 mb-4 text-center">
                <div className="relative mx-auto w-16 h-16 mb-3">
                  <Flame className="w-16 h-16 text-orange-500 animate-pulse" />
                </div>
                <p className="text-sm text-foreground font-headline mb-1">Fogueira is burning</p>
                <p className="text-xs text-muted-foreground">Join as speaker or listener. No recordings.</p>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="font-headline text-xs text-muted-foreground uppercase tracking-wider">Brasas (Embers)</h4>
              {brasas.length === 0 ? (
                <p className="text-xs text-muted-foreground opacity-60">No brasas yet. Leave a thought before the fire dies.</p>
              ) : (
                brasas.map((b) => (
                  <div key={b.id} className="flex gap-2 items-start" data-testid={`brasa-${b.id}`}>
                    <UserAvatar user={b.user} />
                    <div>
                      <span className="text-xs text-muted-foreground">{b.user?.username}</span>
                      <p className="text-sm text-foreground">{b.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {myMembership && (
            <div className="px-4 py-3 border-t border-border">
              <form onSubmit={(e) => { e.preventDefault(); if (brasaText.trim()) brasaMutation.mutate({ content: brasaText.trim() }); }} className="flex gap-2">
                <Input value={brasaText} onChange={(e) => setBrasaText(e.target.value)} placeholder="Leave a brasa (max 280 chars)..." maxLength={280} className="flex-1" data-testid="input-brasa" />
                <Button type="submit" size="icon" disabled={brasaMutation.isPending || !brasaText.trim()} data-testid="button-send-brasa"><Send className="w-4 h-4" /></Button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MissaoTab({ communityId, myMembership, communityColor }: {
  communityId: string; myMembership?: CommunityMember; communityColor: string;
}) {
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTarget, setNewTarget] = useState("100");
  const [contribText, setContribText] = useState("");
  const [contribAmount, setContribAmount] = useState("1");

  const { data: missionsList = [] } = useQuery<Mission[]>({
    queryKey: ["/api/communities", communityId, "missions"],
  });

  const { data: contributions = [] } = useQuery<(MissionContribution & { user: User })[]>({
    queryKey: ["/api/missions", selectedMission, "contributions"],
    enabled: !!selectedMission,
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; targetCount: number }) => {
      const res = await apiRequest("POST", `/api/communities/${communityId}/missions`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities", communityId, "missions"] });
      setCreateOpen(false);
      setNewTitle("");
      setNewDesc("");
      setNewTarget("100");
      toast({ title: "Mission created!" });
    },
  });

  const contributeMutation = useMutation({
    mutationFn: async (data: { content: string; amount: number }) => {
      const res = await apiRequest("POST", `/api/missions/${selectedMission}/contributions`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/missions", selectedMission, "contributions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/communities", communityId, "missions"] });
      setContribText("");
      setContribAmount("1");
      toast({ title: "Contribution added!" });
    },
  });

  const selectedData = missionsList.find((m) => m.id === selectedMission);

  return (
    <div className="flex h-full">
      <div className={`${selectedMission ? "w-72 border-r border-border" : "flex-1"} flex flex-col`}>
        <div className="px-4 py-3 flex items-center justify-between border-b border-border">
          <h2 className="font-headline text-sm text-muted-foreground">Missions</h2>
          {myMembership && myMembership.powerLevel >= POWER_LEVELS.CATALYST && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild><Button size="sm" variant="ghost" data-testid="button-new-mission"><Plus className="w-4 h-4" /></Button></DialogTrigger>
              <DialogContent className="bg-card">
                <DialogHeader><DialogTitle className="font-headline">New Mission</DialogTitle></DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); if (newTitle.trim()) createMutation.mutate({ title: newTitle.trim(), description: newDesc.trim(), targetCount: parseInt(newTarget) || 100 }); }} className="space-y-4">
                  <Input placeholder="Mission title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} data-testid="input-mission-title" />
                  <Textarea placeholder="Description..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="resize-none" data-testid="input-mission-desc" />
                  <Input type="number" placeholder="Target count" value={newTarget} onChange={(e) => setNewTarget(e.target.value)} min="1" max="100000" data-testid="input-mission-target" />
                  <Button type="submit" className="w-full" disabled={createMutation.isPending || !newTitle.trim()} data-testid="button-create-mission">Create Mission</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <div className="flex-1 overflow-auto">
          {missionsList.length === 0 ? (
            <div className="p-8 text-center">
              <Target className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-sm text-muted-foreground">No missions yet</p>
              <p className="text-xs text-muted-foreground mt-1 opacity-60">Catalyst+ can create missions</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {missionsList.map((mission) => {
                const pct = Math.min(100, Math.round((mission.currentCount / mission.targetCount) * 100));
                return (
                  <button key={mission.id} onClick={() => setSelectedMission(mission.id)} className={`w-full text-left px-4 py-3 transition-colors hover-elevate ${selectedMission === mission.id ? "bg-secondary" : ""}`} data-testid={`mission-${mission.id}`}>
                    <div className="flex items-center gap-2">
                      {mission.isCompleted && <Check className="w-4 h-4 text-green-400 shrink-0" />}
                      <p className="text-sm font-medium text-foreground truncate">{mission.title}</p>
                    </div>
                    <div className="mt-2">
                      <Progress value={pct} className="h-1.5" />
                      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                        <span>{mission.currentCount}/{mission.targetCount}</span>
                        <span>{pct}%</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedMission && selectedData && (
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" onClick={() => setSelectedMission(null)}><ArrowLeft className="w-4 h-4" /></Button>
              <div className="flex-1">
                <h3 className="font-headline text-sm text-foreground">{selectedData.title}</h3>
                {selectedData.description && <p className="text-xs text-muted-foreground mt-0.5">{selectedData.description}</p>}
              </div>
              {selectedData.isCompleted && <Badge variant="secondary" className="bg-green-900/30 text-green-400">Completed!</Badge>}
            </div>
            <div className="mt-3">
              <Progress value={Math.min(100, Math.round((selectedData.currentCount / selectedData.targetCount) * 100))} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">{selectedData.currentCount} / {selectedData.targetCount}</p>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-3">
            <h4 className="font-headline text-xs text-muted-foreground uppercase tracking-wider">Contributions</h4>
            {contributions.length === 0 ? (
              <p className="text-xs text-muted-foreground opacity-60">No contributions yet</p>
            ) : (
              contributions.map((c) => (
                <div key={c.id} className="flex gap-2 items-start" data-testid={`contrib-${c.id}`}>
                  <UserAvatar user={c.user} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground">{c.user?.username}</span>
                      <Badge variant="outline" className="text-xs">+{c.amount}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{c.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {myMembership && !selectedData.isCompleted && (
            <div className="px-4 py-3 border-t border-border">
              <form onSubmit={(e) => { e.preventDefault(); if (contribText.trim()) contributeMutation.mutate({ content: contribText.trim(), amount: parseInt(contribAmount) || 1 }); }} className="flex gap-2">
                <Input value={contribText} onChange={(e) => setContribText(e.target.value)} placeholder="What did you contribute?" className="flex-1" data-testid="input-contrib" />
                <Input type="number" value={contribAmount} onChange={(e) => setContribAmount(e.target.value)} className="w-16" min="1" data-testid="input-contrib-amount" />
                <Button type="submit" size="icon" disabled={contributeMutation.isPending || !contribText.trim()} data-testid="button-send-contrib"><Send className="w-4 h-4" /></Button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function QuizTab({ communityId, myMembership, communityColor }: {
  communityId: string; myMembership?: CommunityMember; communityColor: string;
}) {
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [optionTexts, setOptionTexts] = useState(["", ""]);

  const { data: pollsList = [] } = useQuery<Poll[]>({
    queryKey: ["/api/communities", communityId, "polls"],
  });

  const { data: options = [] } = useQuery<PollOption[]>({
    queryKey: ["/api/polls", selectedPoll, "options"],
    enabled: !!selectedPoll,
  });

  const { data: votes = [] } = useQuery<PollVote[]>({
    queryKey: ["/api/polls", selectedPoll, "votes"],
    enabled: !!selectedPoll,
  });

  const createMutation = useMutation({
    mutationFn: async (data: { question: string; options: string[] }) => {
      const res = await apiRequest("POST", `/api/communities/${communityId}/polls`, { question: data.question, options: data.options, pollType: "multiple", isAnonymous: true });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities", communityId, "polls"] });
      setCreateOpen(false);
      setQuestion("");
      setOptionTexts(["", ""]);
      toast({ title: "Quiz created!" });
    },
  });

  const voteMutation = useMutation({
    mutationFn: async (optionId: string) => {
      const res = await apiRequest("POST", `/api/polls/${selectedPoll}/vote`, { optionId });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/polls", selectedPoll, "votes"] });
      toast({ title: "Vote cast!" });
    },
  });

  const selectedData = pollsList.find((p) => p.id === selectedPoll);

  const voteTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const v of votes) {
      totals[v.optionId] = (totals[v.optionId] || 0) + v.weight;
    }
    return totals;
  }, [votes]);

  const totalVoteWeight = Object.values(voteTotals).reduce((a, b) => a + b, 0);

  return (
    <div className="flex h-full">
      <div className={`${selectedPoll ? "w-72 border-r border-border" : "flex-1"} flex flex-col`}>
        <div className="px-4 py-3 flex items-center justify-between border-b border-border">
          <h2 className="font-headline text-sm text-muted-foreground">Quiz / Votes</h2>
          {myMembership && myMembership.powerLevel >= POWER_LEVELS.MEMBER && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild><Button size="sm" variant="ghost" data-testid="button-new-poll"><Plus className="w-4 h-4" /></Button></DialogTrigger>
              <DialogContent className="bg-card">
                <DialogHeader><DialogTitle className="font-headline">New Quiz</DialogTitle></DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); const validOpts = optionTexts.filter(Boolean); if (question.trim() && validOpts.length >= 2) createMutation.mutate({ question: question.trim(), options: validOpts }); }} className="space-y-4">
                  <Input placeholder="Question" value={question} onChange={(e) => setQuestion(e.target.value)} data-testid="input-poll-question" />
                  <div className="space-y-2">
                    {optionTexts.map((opt, i) => (
                      <div key={i} className="flex gap-2">
                        <Input placeholder={`Option ${i + 1}`} value={opt} onChange={(e) => { const n = [...optionTexts]; n[i] = e.target.value; setOptionTexts(n); }} data-testid={`input-poll-option-${i}`} />
                        {i >= 2 && <Button type="button" size="icon" variant="ghost" onClick={() => setOptionTexts(optionTexts.filter((_, j) => j !== i))}><X className="w-3 h-3" /></Button>}
                      </div>
                    ))}
                    {optionTexts.length < 10 && <Button type="button" variant="ghost" size="sm" onClick={() => setOptionTexts([...optionTexts, ""])} data-testid="button-add-option"><Plus className="w-3 h-3 mr-1" />Add Option</Button>}
                  </div>
                  <p className="text-xs text-muted-foreground">Vote weight scales with power level. Anonymous voting.</p>
                  <Button type="submit" className="w-full" disabled={createMutation.isPending || !question.trim() || optionTexts.filter(Boolean).length < 2} data-testid="button-create-poll">Create Quiz</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <div className="flex-1 overflow-auto">
          {pollsList.length === 0 ? (
            <div className="p-8 text-center">
              <BarChart3 className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-sm text-muted-foreground">No quizzes yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {pollsList.map((poll) => (
                <button key={poll.id} onClick={() => setSelectedPoll(poll.id)} className={`w-full text-left px-4 py-3 transition-colors hover-elevate ${selectedPoll === poll.id ? "bg-secondary" : ""}`} data-testid={`poll-${poll.id}`}>
                  <p className="text-sm font-medium text-foreground truncate">{poll.question}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={poll.isActive ? "default" : "secondary"} className="text-xs">{poll.isActive ? "Active" : "Closed"}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(poll.createdAt), { addSuffix: true })}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedPoll && selectedData && (
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" onClick={() => setSelectedPoll(null)}><ArrowLeft className="w-4 h-4" /></Button>
              <h3 className="font-headline text-sm text-foreground flex-1">{selectedData.question}</h3>
              {!selectedData.isActive && <Badge variant="secondary">Closed</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedData.isAnonymous ? "Anonymous voting" : "Open voting"} | Weight by power level | {votes.length} vote{votes.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {options.map((opt) => {
              const optWeight = voteTotals[opt.id] || 0;
              const pct = totalVoteWeight > 0 ? Math.round((optWeight / totalVoteWeight) * 100) : 0;
              return (
                <button
                  key={opt.id}
                  onClick={() => { if (selectedData.isActive && myMembership) voteMutation.mutate(opt.id); }}
                  className="w-full text-left p-3 rounded-md border border-border hover-elevate transition-colors"
                  disabled={!selectedData.isActive || voteMutation.isPending}
                  data-testid={`option-${opt.id}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-foreground">{opt.text}</span>
                    <span className="text-xs font-data" style={{ color: communityColor }}>{pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: communityColor + "aa" }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{optWeight} weighted votes</p>
                </button>
              );
            })}
            {myMembership && (
              <p className="text-xs text-muted-foreground text-center mt-4">
                Your vote weight: {VOTE_WEIGHTS[myMembership.powerLevel] || 1}x ({POWER_LABELS[myMembership.powerLevel]})
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ArenaTab({ communityId, myMembership, communityColor }: {
  communityId: string; myMembership?: CommunityMember; communityColor: string;
}) {
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedArena, setSelectedArena] = useState<string | null>(null);
  const [proposition, setProposition] = useState("");
  const [sideALabel, setSideALabel] = useState("For");
  const [sideBLabel, setSideBLabel] = useState("Against");
  const [argText, setArgText] = useState("");
  const [argSide, setArgSide] = useState<"a" | "b">("a");

  const { data: arenasList = [] } = useQuery<Arena[]>({
    queryKey: ["/api/communities", communityId, "arenas"],
  });

  const { data: arenaArgs = [] } = useQuery<(ArenaArgument & { user: User })[]>({
    queryKey: ["/api/arenas", selectedArena, "arguments"],
    enabled: !!selectedArena,
  });

  const { data: arenaVotes = [] } = useQuery<ArenaVote[]>({
    queryKey: ["/api/arenas", selectedArena, "votes"],
    enabled: !!selectedArena,
  });

  const createMutation = useMutation({
    mutationFn: async (data: { proposition: string; sideALabel: string; sideBLabel: string }) => {
      const res = await apiRequest("POST", `/api/communities/${communityId}/arenas`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities", communityId, "arenas"] });
      setCreateOpen(false);
      setProposition("");
      toast({ title: "Arena created!" });
    },
  });

  const argMutation = useMutation({
    mutationFn: async (data: { side: string; content: string }) => {
      const res = await apiRequest("POST", `/api/arenas/${selectedArena}/arguments`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/arenas", selectedArena, "arguments"] });
      setArgText("");
      toast({ title: "Argument posted!" });
    },
  });

  const arenaTotalVoteMutation = useMutation({
    mutationFn: async (side: "a" | "b") => {
      const res = await apiRequest("POST", `/api/arenas/${selectedArena}/vote`, { side });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/arenas", selectedArena, "votes"] });
      toast({ title: "Vote cast!" });
    },
  });

  const selectedData = arenasList.find((a) => a.id === selectedArena);
  const sideAArgs = arenaArgs.filter((a) => a.side === "a");
  const sideBArgs = arenaArgs.filter((a) => a.side === "b");
  const sideAVotes = arenaVotes.filter((v) => v.side === "a").length;
  const sideBVotes = arenaVotes.filter((v) => v.side === "b").length;

  return (
    <div className="flex h-full">
      <div className={`${selectedArena ? "w-72 border-r border-border" : "flex-1"} flex flex-col`}>
        <div className="px-4 py-3 flex items-center justify-between border-b border-border">
          <h2 className="font-headline text-sm text-muted-foreground">Arena</h2>
          {myMembership && myMembership.powerLevel >= POWER_LEVELS.CATALYST && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild><Button size="sm" variant="ghost" data-testid="button-new-arena"><Plus className="w-4 h-4" /></Button></DialogTrigger>
              <DialogContent className="bg-card">
                <DialogHeader><DialogTitle className="font-headline">New Arena Debate</DialogTitle></DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); if (proposition.trim()) createMutation.mutate({ proposition: proposition.trim(), sideALabel, sideBLabel }); }} className="space-y-4">
                  <Input placeholder="Proposition to debate" value={proposition} onChange={(e) => setProposition(e.target.value)} data-testid="input-arena-proposition" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Side A label" value={sideALabel} onChange={(e) => setSideALabel(e.target.value)} data-testid="input-arena-side-a" />
                    <Input placeholder="Side B label" value={sideBLabel} onChange={(e) => setSideBLabel(e.target.value)} data-testid="input-arena-side-b" />
                  </div>
                  <Button type="submit" className="w-full" disabled={createMutation.isPending || !proposition.trim()} data-testid="button-create-arena">Start Debate</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <div className="flex-1 overflow-auto">
          {arenasList.length === 0 ? (
            <div className="p-8 text-center">
              <Swords className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-sm text-muted-foreground">No debates yet</p>
              <p className="text-xs text-muted-foreground mt-1 opacity-60">Catalyst+ can start debates</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {arenasList.map((arena) => (
                <button key={arena.id} onClick={() => setSelectedArena(arena.id)} className={`w-full text-left px-4 py-3 transition-colors hover-elevate ${selectedArena === arena.id ? "bg-secondary" : ""}`} data-testid={`arena-${arena.id}`}>
                  <p className="text-sm font-medium text-foreground truncate">{arena.proposition}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={arena.status === "open" ? "default" : "secondary"} className="text-xs">{arena.status}</Badge>
                    <span className="text-xs text-muted-foreground">{arena.sideALabel} vs {arena.sideBLabel}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedArena && selectedData && (
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" onClick={() => setSelectedArena(null)}><ArrowLeft className="w-4 h-4" /></Button>
              <h3 className="font-headline text-sm text-foreground flex-1">{selectedData.proposition}</h3>
              <Badge variant={selectedData.status === "open" ? "default" : "secondary"}>{selectedData.status}</Badge>
            </div>
            <div className="flex items-center gap-4 mt-3">
              <button onClick={() => arenaTotalVoteMutation.mutate("a")} className="flex-1 p-2 rounded-md border border-green-800/30 bg-green-900/10 hover:bg-green-900/20 transition-colors text-center" data-testid="button-vote-a">
                <p className="text-sm font-headline text-green-400">{selectedData.sideALabel}</p>
                <p className="text-lg font-data text-green-300">{sideAVotes}</p>
              </button>
              <span className="text-xs text-muted-foreground font-headline">VS</span>
              <button onClick={() => arenaTotalVoteMutation.mutate("b")} className="flex-1 p-2 rounded-md border border-red-800/30 bg-red-900/10 hover:bg-red-900/20 transition-colors text-center" data-testid="button-vote-b">
                <p className="text-sm font-headline text-red-400">{selectedData.sideBLabel}</p>
                <p className="text-lg font-data text-red-300">{sideBVotes}</p>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4">
            <div className="grid grid-cols-2 gap-4 h-full">
              <div className="space-y-3">
                <h4 className="font-headline text-xs text-green-400 uppercase tracking-wider">{selectedData.sideALabel}</h4>
                {sideAArgs.map((a) => (
                  <div key={a.id} className="p-2 rounded-md border border-green-800/20 bg-green-900/5" data-testid={`arg-a-${a.id}`}>
                    <div className="flex items-center gap-1 mb-1">
                      <UserAvatar user={a.user} />
                      <span className="text-xs text-muted-foreground">{a.user?.username}</span>
                    </div>
                    <p className="text-sm text-foreground">{a.content}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <h4 className="font-headline text-xs text-red-400 uppercase tracking-wider">{selectedData.sideBLabel}</h4>
                {sideBArgs.map((a) => (
                  <div key={a.id} className="p-2 rounded-md border border-red-800/20 bg-red-900/5" data-testid={`arg-b-${a.id}`}>
                    <div className="flex items-center gap-1 mb-1">
                      <UserAvatar user={a.user} />
                      <span className="text-xs text-muted-foreground">{a.user?.username}</span>
                    </div>
                    <p className="text-sm text-foreground">{a.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {myMembership && selectedData.status === "open" && (
            <div className="px-4 py-3 border-t border-border">
              <form onSubmit={(e) => { e.preventDefault(); if (argText.trim()) argMutation.mutate({ side: argSide, content: argText.trim() }); }} className="flex gap-2">
                <select value={argSide} onChange={(e) => setArgSide(e.target.value as "a" | "b")} className="px-2 py-1 rounded-md border border-border bg-card text-xs text-foreground" data-testid="select-arg-side">
                  <option value="a">{selectedData.sideALabel}</option>
                  <option value="b">{selectedData.sideBLabel}</option>
                </select>
                <Input value={argText} onChange={(e) => setArgText(e.target.value)} placeholder="Make your argument..." className="flex-1" data-testid="input-argument" />
                <Button type="submit" size="icon" disabled={argMutation.isPending || !argText.trim()} data-testid="button-send-argument"><Send className="w-4 h-4" /></Button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MosaicoTab({ communityId, myMembership, communityColor }: {
  communityId: string; myMembership?: CommunityMember; communityColor: string;
}) {
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedMosaic, setSelectedMosaic] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newFormat, setNewFormat] = useState("board");
  const [newRules, setNewRules] = useState("");
  const [pieceContent, setPieceContent] = useState("");
  const [pieceType, setPieceType] = useState<"text" | "link" | "image">("text");

  const { data: mosaicsList = [] } = useQuery<Mosaic[]>({
    queryKey: ["/api/communities", communityId, "mosaics"],
  });

  const { data: pieces = [] } = useQuery<(MosaicPiece & { user: User })[]>({
    queryKey: ["/api/mosaics", selectedMosaic, "pieces"],
    enabled: !!selectedMosaic,
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; format: string; rules: string }) => {
      const res = await apiRequest("POST", `/api/communities/${communityId}/mosaics`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities", communityId, "mosaics"] });
      setCreateOpen(false);
      setNewTitle("");
      setNewDesc("");
      toast({ title: "Mosaic created!" });
    },
  });

  const addPieceMutation = useMutation({
    mutationFn: async (data: { pieceType: string; content: string }) => {
      const res = await apiRequest("POST", `/api/mosaics/${selectedMosaic}/pieces`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mosaics", selectedMosaic, "pieces"] });
      setPieceContent("");
      toast({ title: "Piece added!" });
    },
  });

  const selectedData = mosaicsList.find((m) => m.id === selectedMosaic);
  const formatIcons: Record<string, string> = { document: "Doc", playlist: "Playlist", board: "Board", story: "Story" };

  return (
    <div className="flex h-full">
      <div className={`${selectedMosaic ? "w-72 border-r border-border" : "flex-1"} flex flex-col`}>
        <div className="px-4 py-3 flex items-center justify-between border-b border-border">
          <h2 className="font-headline text-sm text-muted-foreground">Mosaics</h2>
          {myMembership && myMembership.powerLevel >= POWER_LEVELS.MEMBER && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild><Button size="sm" variant="ghost" data-testid="button-new-mosaic"><Plus className="w-4 h-4" /></Button></DialogTrigger>
              <DialogContent className="bg-card">
                <DialogHeader><DialogTitle className="font-headline">New Mosaic</DialogTitle></DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); if (newTitle.trim()) createMutation.mutate({ title: newTitle.trim(), description: newDesc.trim(), format: newFormat, rules: newRules.trim() }); }} className="space-y-4">
                  <Input placeholder="Mosaic title" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} data-testid="input-mosaic-title" />
                  <Textarea placeholder="Description..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="resize-none" data-testid="input-mosaic-desc" />
                  <select value={newFormat} onChange={(e) => setNewFormat(e.target.value)} className="w-full px-3 py-2 rounded-md border border-border bg-card text-sm text-foreground" data-testid="select-mosaic-format">
                    <option value="board">Board</option>
                    <option value="document">Document</option>
                    <option value="playlist">Playlist</option>
                    <option value="story">Story</option>
                  </select>
                  <Textarea placeholder="Rules (optional)..." value={newRules} onChange={(e) => setNewRules(e.target.value)} className="resize-none" data-testid="input-mosaic-rules" />
                  <Button type="submit" className="w-full" disabled={createMutation.isPending || !newTitle.trim()} data-testid="button-create-mosaic">Create Mosaic</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
        <div className="flex-1 overflow-auto">
          {mosaicsList.length === 0 ? (
            <div className="p-8 text-center">
              <Puzzle className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-sm text-muted-foreground">No mosaics yet</p>
              <p className="text-xs text-muted-foreground mt-1 opacity-60">Create a collaborative canvas</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {mosaicsList.map((mosaic) => (
                <button key={mosaic.id} onClick={() => setSelectedMosaic(mosaic.id)} className={`w-full text-left px-4 py-3 transition-colors hover-elevate ${selectedMosaic === mosaic.id ? "bg-secondary" : ""}`} data-testid={`mosaic-${mosaic.id}`}>
                  <p className="text-sm font-medium text-foreground truncate">{mosaic.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{formatIcons[mosaic.format] || mosaic.format}</Badge>
                    {mosaic.isOpen ? <Badge variant="secondary" className="text-xs">Open</Badge> : <Badge variant="secondary" className="text-xs">Closed</Badge>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedMosaic && selectedData && (
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Button size="icon" variant="ghost" onClick={() => setSelectedMosaic(null)}><ArrowLeft className="w-4 h-4" /></Button>
              <div className="flex-1">
                <h3 className="font-headline text-sm text-foreground">{selectedData.title}</h3>
                {selectedData.description && <p className="text-xs text-muted-foreground mt-0.5">{selectedData.description}</p>}
              </div>
              <Badge variant="outline" className="text-xs">{formatIcons[selectedData.format] || selectedData.format}</Badge>
            </div>
            {selectedData.rules && (
              <div className="mt-2 p-2 bg-secondary/50 rounded-md">
                <p className="text-xs text-muted-foreground"><span className="font-medium">Rules:</span> {selectedData.rules}</p>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto p-4">
            {pieces.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground opacity-60">No pieces yet. Add the first one!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pieces.map((piece) => (
                  <div key={piece.id} className="p-3 rounded-md border border-border bg-card/50" data-testid={`piece-${piece.id}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <UserAvatar user={piece.user} />
                      <span className="text-xs text-muted-foreground">{piece.user?.username}</span>
                      <Badge variant="outline" className="text-xs ml-auto">{piece.pieceType}</Badge>
                    </div>
                    {piece.pieceType === "link" ? (
                      <a href={piece.content} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline break-all">{piece.content}</a>
                    ) : piece.pieceType === "image" ? (
                      <img src={piece.content} alt="" className="w-full rounded-md max-h-48 object-cover" />
                    ) : (
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{piece.content}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {myMembership && selectedData.isOpen && (
            <div className="px-4 py-3 border-t border-border">
              <form onSubmit={(e) => { e.preventDefault(); if (pieceContent.trim()) addPieceMutation.mutate({ pieceType, content: pieceContent.trim() }); }} className="flex gap-2">
                <div className="flex border border-border rounded-md overflow-hidden shrink-0">
                  {(["text", "link", "image"] as const).map((t) => (
                    <button key={t} type="button" onClick={() => setPieceType(t)} className={`px-2 py-1.5 text-xs ${pieceType === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`} data-testid={`button-piece-type-${t}`}>
                      {t === "text" ? <Type className="w-3 h-3" /> : t === "link" ? <Link className="w-3 h-3" /> : <Image className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
                <Input value={pieceContent} onChange={(e) => setPieceContent(e.target.value)} placeholder={pieceType === "link" ? "https://..." : pieceType === "image" ? "Image URL..." : "Your piece..."} className="flex-1" data-testid="input-piece-content" />
                <Button type="submit" size="icon" disabled={addPieceMutation.isPending || !pieceContent.trim()} data-testid="button-add-piece"><Send className="w-4 h-4" /></Button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
