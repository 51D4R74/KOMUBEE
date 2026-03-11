import { useMutation, useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Clock, Flame, Headphones, Mic, Plus, Send } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { POWER_LEVELS, type Fogueira, type FogueiraBrasa, type User } from "@shared/schema";

import { UserAvatar } from "../components/user-avatar";
import type { CommunityTabProps } from "../types";

type FogueiraBrasaWithUser = FogueiraBrasa & { user: User };

export function FogueiraTab({ communityId, myMembership }: CommunityTabProps) {
  const { toast } = useToast();
  const [newTitle, setNewTitle] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedFogueira, setSelectedFogueira] = useState<string | null>(null);
  const [brasaText, setBrasaText] = useState("");

  const { data: fogueirasList = [] } = useQuery<Fogueira[]>({
    queryKey: ["/api/communities", communityId, "fogueiras"],
  });

  const { data: brasas = [] } = useQuery<FogueiraBrasaWithUser[]>({
    queryKey: ["/api/fogueiras", selectedFogueira, "brasas"],
    enabled: !!selectedFogueira,
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string }) => {
      const response = await apiRequest("POST", `/api/communities/${communityId}/fogueiras`, data);
      return response.json();
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
      const response = await apiRequest("POST", `/api/fogueiras/${id}/end`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities", communityId, "fogueiras"] });
      toast({ title: "Fogueira ended" });
    },
  });

  const brasaMutation = useMutation({
    mutationFn: async (data: { content: string }) => {
      const response = await apiRequest("POST", `/api/fogueiras/${selectedFogueira}/brasas`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/fogueiras", selectedFogueira, "brasas"] });
      setBrasaText("");
      toast({ title: "Brasa left!" });
    },
  });

  const joinMutation = useMutation({
    mutationFn: async ({ id, asSpeaker }: { id: string; asSpeaker: boolean }) => {
      const response = await apiRequest("POST", `/api/fogueiras/${id}/join`, { asSpeaker });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities", communityId, "fogueiras"] });
    },
  });

  const selectedData = fogueirasList.find((fogueira) => fogueira.id === selectedFogueira);
  const activeFogueiras = fogueirasList.filter((fogueira) => fogueira.isActive);
  const pastFogueiras = fogueirasList.filter((fogueira) => !fogueira.isActive);

  return (
    <div className="flex h-full">
      <div className={`${selectedFogueira ? "w-72 border-r border-border" : "flex-1"} flex flex-col`}>
        <div className="px-4 py-3 flex items-center justify-between border-b border-border">
          <h2 className="font-headline text-sm text-muted-foreground">Fogueiras</h2>
          {myMembership && myMembership.powerLevel >= POWER_LEVELS.CATALYST && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost" data-testid="button-new-fogueira">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card">
                <DialogHeader>
                  <DialogTitle className="font-headline">Light a Fogueira</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (newTitle.trim()) {
                      createMutation.mutate({ title: newTitle.trim() });
                    }
                  }}
                  className="space-y-4"
                >
                  <Input
                    placeholder="Topic..."
                    value={newTitle}
                    onChange={(event) => setNewTitle(event.target.value)}
                    data-testid="input-fogueira-title"
                  />
                  <p className="text-xs text-muted-foreground">Live audio room. Max 12 speakers, 2 hour limit. No recordings.</p>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createMutation.isPending || !newTitle.trim()}
                    data-testid="button-create-fogueira"
                  >
                    Light It
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="flex-1 overflow-auto">
          {activeFogueiras.length > 0 && (
            <div className="p-2">
              <p className="text-xs text-muted-foreground px-2 py-1 font-headline uppercase tracking-wider">Live Now</p>
              {activeFogueiras.map((fogueira) => (
                <button
                  key={fogueira.id}
                  onClick={() => setSelectedFogueira(fogueira.id)}
                  className={`w-full text-left px-3 py-3 rounded-md mb-1 transition-colors hover-elevate ${selectedFogueira === fogueira.id ? "bg-secondary" : ""}`}
                  data-testid={`fogueira-${fogueira.id}`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-sm font-medium text-foreground truncate">{fogueira.title}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mic className="w-3 h-3" />
                      {fogueira.speakerCount}/12
                    </span>
                    <span className="flex items-center gap-1">
                      <Headphones className="w-3 h-3" />
                      {fogueira.listenerCount}
                    </span>
                    {fogueira.endsAt && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Ends {formatDistanceToNow(new Date(fogueira.endsAt), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {pastFogueiras.length > 0 && (
            <div className="p-2">
              <p className="text-xs text-muted-foreground px-2 py-1 font-headline uppercase tracking-wider">Past</p>
              {pastFogueiras.map((fogueira) => (
                <button
                  key={fogueira.id}
                  onClick={() => setSelectedFogueira(fogueira.id)}
                  className={`w-full text-left px-3 py-2 rounded-md mb-1 opacity-60 transition-colors hover-elevate ${selectedFogueira === fogueira.id ? "bg-secondary" : ""}`}
                  data-testid={`fogueira-past-${fogueira.id}`}
                >
                  <p className="text-sm text-foreground truncate">{fogueira.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(fogueira.createdAt), { addSuffix: true })}
                  </p>
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
              <Button size="icon" variant="ghost" onClick={() => setSelectedFogueira(null)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex-1">
                <h3 className="font-headline text-sm text-foreground">{selectedData.title}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                  {selectedData.isActive && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                  <span className="text-xs text-muted-foreground">{selectedData.isActive ? "Live" : "Ended"}</span>
                  <span className="text-xs text-muted-foreground">
                    {selectedData.speakerCount} speakers, {selectedData.listenerCount} listeners
                  </span>
                </div>
              </div>
              {selectedData.isActive && (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => joinMutation.mutate({ id: selectedData.id, asSpeaker: false })}
                    data-testid="button-join-listener"
                  >
                    <Headphones className="w-3 h-3 mr-1" />
                    Listen
                  </Button>
                  {selectedData.speakerCount < 12 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => joinMutation.mutate({ id: selectedData.id, asSpeaker: true })}
                      data-testid="button-join-speaker"
                    >
                      <Mic className="w-3 h-3 mr-1" />
                      Speak
                    </Button>
                  )}
                  {myMembership && myMembership.powerLevel >= POWER_LEVELS.CATALYST && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => endMutation.mutate(selectedData.id)}
                      data-testid="button-end-fogueira"
                    >
                      End
                    </Button>
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
                brasas.map((brasa) => (
                  <div key={brasa.id} className="flex gap-2 items-start" data-testid={`brasa-${brasa.id}`}>
                    <UserAvatar user={brasa.user} />
                    <div>
                      <span className="text-xs text-muted-foreground">{brasa.user?.username}</span>
                      <p className="text-sm text-foreground">{brasa.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {myMembership && (
            <div className="px-4 py-3 border-t border-border">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (brasaText.trim()) {
                    brasaMutation.mutate({ content: brasaText.trim() });
                  }
                }}
                className="flex gap-2"
              >
                <Input
                  value={brasaText}
                  onChange={(event) => setBrasaText(event.target.value)}
                  placeholder="Leave a brasa (max 280 chars)..."
                  maxLength={280}
                  className="flex-1"
                  data-testid="input-brasa"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={brasaMutation.isPending || !brasaText.trim()}
                  data-testid="button-send-brasa"
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