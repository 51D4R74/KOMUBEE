import { useMutation, useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Clock, MessageCircle, Pin, Plus, Send } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { POWER_LEVELS, type Thread, type ThreadMessage, type User } from "@shared/schema";

import { PowerIcon } from "../components/power-icon";
import { UserAvatar } from "../components/user-avatar";
import type { ColmeiaTabProps } from "../types";
import { getPowerLevelTextColor, isThreadStale } from "../utils";

type ThreadMessageWithAuthor = ThreadMessage & { author: User };

export function ColmeiaTab({ communityId, members, myMembership }: ColmeiaTabProps) {
  const { toast } = useToast();
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [newThreadContent, setNewThreadContent] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [createThreadOpen, setCreateThreadOpen] = useState(false);

  const { data: threads = [], isLoading: threadsLoading } = useQuery<Thread[]>({
    queryKey: ["/api/communities", communityId, "threads"],
  });

  const { data: messages = [] } = useQuery<ThreadMessageWithAuthor[]>({
    queryKey: ["/api/threads", selectedThread, "messages"],
    enabled: !!selectedThread,
  });

  const createThreadMutation = useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const response = await apiRequest("POST", `/api/communities/${communityId}/threads`, data);
      return response.json();
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
      const response = await apiRequest("POST", `/api/threads/${selectedThread}/messages`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/threads", selectedThread, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/communities", communityId, "threads"] });
      setNewMessage("");
    },
  });

  const selectedThreadData = threads.find((thread) => thread.id === selectedThread);

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
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (newThreadTitle.trim()) {
                      createThreadMutation.mutate({
                        title: newThreadTitle.trim(),
                        content: newThreadContent.trim(),
                      });
                    }
                  }}
                  className="space-y-4"
                >
                  <Input
                    placeholder="Thread title"
                    value={newThreadTitle}
                    onChange={(event) => setNewThreadTitle(event.target.value)}
                    data-testid="input-thread-title"
                  />
                  <Textarea
                    placeholder="Start the conversation..."
                    value={newThreadContent}
                    onChange={(event) => setNewThreadContent(event.target.value)}
                    className="resize-none"
                    data-testid="input-thread-content"
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createThreadMutation.isPending || !newThreadTitle.trim()}
                    data-testid="button-submit-thread"
                  >
                    Create Thread
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="flex-1 overflow-auto">
          {threadsLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((item) => (
                <Skeleton key={item} className="h-16 w-full" />
              ))}
            </div>
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
                  className={`w-full text-left px-4 py-3 transition-colors hover-elevate ${selectedThread === thread.id ? "bg-secondary" : ""} ${isThreadStale(thread) ? "opacity-50" : ""}`}
                  data-testid={`button-thread-${thread.id}`}
                >
                  <div className="flex items-start gap-2">
                    {thread.isPinned && <Pin className="w-3 h-3 text-amber-400 mt-1 shrink-0" />}
                    {isThreadStale(thread) && <Clock className="w-3 h-3 text-red-400 mt-1 shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{thread.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {thread.messageCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(thread.lastActivityAt), { addSuffix: true })}
                        </span>
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
                <h3 className="font-headline text-sm text-foreground truncate" data-testid="text-thread-title">
                  {selectedThreadData.title}
                </h3>
                {isThreadStale(selectedThreadData) && <span className="text-xs text-red-400">Inactive 7+ days</span>}
              </div>
            </div>
            {selectedThreadData.content && (
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{selectedThreadData.content}</p>
            )}
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground opacity-60">No messages yet</p>
              </div>
            ) : (
              messages.map((message) => {
                const messageMembership = members.find((member) => member.userId === message.authorId);

                return (
                  <div key={message.id} className="flex gap-3 animate-float-in" data-testid={`message-${message.id}`}>
                    <UserAvatar user={message.author} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium" style={{ color: getPowerLevelTextColor(messageMembership?.powerLevel || 2) }}>
                          {message.author?.username || "Unknown"}
                        </span>
                        <PowerIcon level={messageMembership?.powerLevel || 2} />
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {myMembership && myMembership.powerLevel >= POWER_LEVELS.MEMBER && (
            <div className="px-4 py-3 border-t border-border">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (newMessage.trim()) {
                    sendMessageMutation.mutate({ content: newMessage.trim() });
                  }
                }}
                className="flex gap-2"
              >
                <Input
                  value={newMessage}
                  onChange={(event) => setNewMessage(event.target.value)}
                  placeholder="Write a message..."
                  data-testid="input-message"
                  className="flex-1"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={sendMessageMutation.isPending || !newMessage.trim()}
                  data-testid="button-send-message"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}