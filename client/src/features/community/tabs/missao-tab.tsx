import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, Plus, Send, Target } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { POWER_LEVELS, type Mission, type MissionContribution, type User } from "@shared/schema";

import { UserAvatar } from "../components/user-avatar";
import type { CommunityTabProps } from "../types";

type MissionContributionWithUser = MissionContribution & { user: User };

export function MissaoTab({ communityId, myMembership }: CommunityTabProps) {
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

  const { data: contributions = [] } = useQuery<MissionContributionWithUser[]>({
    queryKey: ["/api/missions", selectedMission, "contributions"],
    enabled: !!selectedMission,
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; targetCount: number }) => {
      const response = await apiRequest("POST", `/api/communities/${communityId}/missions`, data);
      return response.json();
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
      const response = await apiRequest("POST", `/api/missions/${selectedMission}/contributions`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/missions", selectedMission, "contributions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/communities", communityId, "missions"] });
      setContribText("");
      setContribAmount("1");
      toast({ title: "Contribution added!" });
    },
  });

  const selectedData = missionsList.find((mission) => mission.id === selectedMission);

  return (
    <div className="flex h-full">
      <div className={`${selectedMission ? "w-72 border-r border-border" : "flex-1"} flex flex-col`}>
        <div className="px-4 py-3 flex items-center justify-between border-b border-border">
          <h2 className="font-headline text-sm text-muted-foreground">Missions</h2>
          {myMembership && myMembership.powerLevel >= POWER_LEVELS.CATALYST && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost" data-testid="button-new-mission">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card">
                <DialogHeader>
                  <DialogTitle className="font-headline">New Mission</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (newTitle.trim()) {
                      createMutation.mutate({
                        title: newTitle.trim(),
                        description: newDesc.trim(),
                        targetCount: parseInt(newTarget, 10) || 100,
                      });
                    }
                  }}
                  className="space-y-4"
                >
                  <Input placeholder="Mission title" value={newTitle} onChange={(event) => setNewTitle(event.target.value)} data-testid="input-mission-title" />
                  <Textarea placeholder="Description..." value={newDesc} onChange={(event) => setNewDesc(event.target.value)} className="resize-none" data-testid="input-mission-desc" />
                  <Input type="number" placeholder="Target count" value={newTarget} onChange={(event) => setNewTarget(event.target.value)} min="1" max="100000" data-testid="input-mission-target" />
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
                const progress = Math.min(100, Math.round((mission.currentCount / mission.targetCount) * 100));

                return (
                  <button
                    key={mission.id}
                    onClick={() => setSelectedMission(mission.id)}
                    className={`w-full text-left px-4 py-3 transition-colors hover-elevate ${selectedMission === mission.id ? "bg-secondary" : ""}`}
                    data-testid={`mission-${mission.id}`}
                  >
                    <div className="flex items-center gap-2">
                      {mission.isCompleted && <Check className="w-4 h-4 text-green-400 shrink-0" />}
                      <p className="text-sm font-medium text-foreground truncate">{mission.title}</p>
                    </div>
                    <div className="mt-2">
                      <Progress value={progress} className="h-1.5" />
                      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                        <span>{mission.currentCount}/{mission.targetCount}</span>
                        <span>{progress}%</span>
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
              <Button size="icon" variant="ghost" onClick={() => setSelectedMission(null)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
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
              contributions.map((contribution) => (
                <div key={contribution.id} className="flex gap-2 items-start" data-testid={`contrib-${contribution.id}`}>
                  <UserAvatar user={contribution.user} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground">{contribution.user?.username}</span>
                      <Badge variant="outline" className="text-xs">+{contribution.amount}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{contribution.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {myMembership && !selectedData.isCompleted && (
            <div className="px-4 py-3 border-t border-border">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (contribText.trim()) {
                    contributeMutation.mutate({
                      content: contribText.trim(),
                      amount: parseInt(contribAmount, 10) || 1,
                    });
                  }
                }}
                className="flex gap-2"
              >
                <Input value={contribText} onChange={(event) => setContribText(event.target.value)} placeholder="What did you contribute?" className="flex-1" data-testid="input-contrib" />
                <Input type="number" value={contribAmount} onChange={(event) => setContribAmount(event.target.value)} className="w-16" min="1" data-testid="input-contrib-amount" />
                <Button type="submit" size="icon" disabled={contributeMutation.isPending || !contribText.trim()} data-testid="button-send-contrib">
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