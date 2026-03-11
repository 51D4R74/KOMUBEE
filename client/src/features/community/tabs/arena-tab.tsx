import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Plus, Send, Swords } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
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
import { POWER_LEVELS, type Arena, type ArenaArgument, type ArenaVote, type User } from "@shared/schema";

import { UserAvatar } from "../components/user-avatar";
import type { CommunityTabProps } from "../types";

type ArenaArgumentWithUser = ArenaArgument & { user: User };

export function ArenaTab({ communityId, myMembership }: CommunityTabProps) {
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

  const { data: arenaArgs = [] } = useQuery<ArenaArgumentWithUser[]>({
    queryKey: ["/api/arenas", selectedArena, "arguments"],
    enabled: !!selectedArena,
  });

  const { data: arenaVotes = [] } = useQuery<ArenaVote[]>({
    queryKey: ["/api/arenas", selectedArena, "votes"],
    enabled: !!selectedArena,
  });

  const createMutation = useMutation({
    mutationFn: async (data: { proposition: string; sideALabel: string; sideBLabel: string }) => {
      const response = await apiRequest("POST", `/api/communities/${communityId}/arenas`, data);
      return response.json();
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
      const response = await apiRequest("POST", `/api/arenas/${selectedArena}/arguments`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/arenas", selectedArena, "arguments"] });
      setArgText("");
      toast({ title: "Argument posted!" });
    },
  });

  const arenaTotalVoteMutation = useMutation({
    mutationFn: async (side: "a" | "b") => {
      const response = await apiRequest("POST", `/api/arenas/${selectedArena}/vote`, { side });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/arenas", selectedArena, "votes"] });
      toast({ title: "Vote cast!" });
    },
  });

  const selectedData = arenasList.find((arena) => arena.id === selectedArena);
  const sideAArgs = arenaArgs.filter((argument) => argument.side === "a");
  const sideBArgs = arenaArgs.filter((argument) => argument.side === "b");
  const sideAVotes = arenaVotes.filter((vote) => vote.side === "a").length;
  const sideBVotes = arenaVotes.filter((vote) => vote.side === "b").length;

  return (
    <div className="flex h-full">
      <div className={`${selectedArena ? "w-72 border-r border-border" : "flex-1"} flex flex-col`}>
        <div className="px-4 py-3 flex items-center justify-between border-b border-border">
          <h2 className="font-headline text-sm text-muted-foreground">Arena</h2>
          {myMembership && myMembership.powerLevel >= POWER_LEVELS.CATALYST && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost" data-testid="button-new-arena">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card">
                <DialogHeader>
                  <DialogTitle className="font-headline">New Arena Debate</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (proposition.trim()) {
                      createMutation.mutate({ proposition: proposition.trim(), sideALabel, sideBLabel });
                    }
                  }}
                  className="space-y-4"
                >
                  <Input placeholder="Proposition to debate" value={proposition} onChange={(event) => setProposition(event.target.value)} data-testid="input-arena-proposition" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Side A label" value={sideALabel} onChange={(event) => setSideALabel(event.target.value)} data-testid="input-arena-side-a" />
                    <Input placeholder="Side B label" value={sideBLabel} onChange={(event) => setSideBLabel(event.target.value)} data-testid="input-arena-side-b" />
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
              <Button size="icon" variant="ghost" onClick={() => setSelectedArena(null)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
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
                {sideAArgs.map((argument) => (
                  <div key={argument.id} className="p-2 rounded-md border border-green-800/20 bg-green-900/5" data-testid={`arg-a-${argument.id}`}>
                    <div className="flex items-center gap-1 mb-1">
                      <UserAvatar user={argument.user} />
                      <span className="text-xs text-muted-foreground">{argument.user?.username}</span>
                    </div>
                    <p className="text-sm text-foreground">{argument.content}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <h4 className="font-headline text-xs text-red-400 uppercase tracking-wider">{selectedData.sideBLabel}</h4>
                {sideBArgs.map((argument) => (
                  <div key={argument.id} className="p-2 rounded-md border border-red-800/20 bg-red-900/5" data-testid={`arg-b-${argument.id}`}>
                    <div className="flex items-center gap-1 mb-1">
                      <UserAvatar user={argument.user} />
                      <span className="text-xs text-muted-foreground">{argument.user?.username}</span>
                    </div>
                    <p className="text-sm text-foreground">{argument.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {myMembership && selectedData.status === "open" && (
            <div className="px-4 py-3 border-t border-border">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (argText.trim()) {
                    argMutation.mutate({ side: argSide, content: argText.trim() });
                  }
                }}
                className="flex gap-2"
              >
                <select value={argSide} onChange={(event) => setArgSide(event.target.value as "a" | "b")} className="px-2 py-1 rounded-md border border-border bg-card text-xs text-foreground" data-testid="select-arg-side">
                  <option value="a">{selectedData.sideALabel}</option>
                  <option value="b">{selectedData.sideBLabel}</option>
                </select>
                <Input value={argText} onChange={(event) => setArgText(event.target.value)} placeholder="Make your argument..." className="flex-1" data-testid="input-argument" />
                <Button type="submit" size="icon" disabled={argMutation.isPending || !argText.trim()} data-testid="button-send-argument">
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