import { useMutation, useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, BarChart3, Plus, Send, X } from "lucide-react";
import { useMemo, useState } from "react";

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
import { POWER_LABELS, POWER_LEVELS, VOTE_WEIGHTS, type Poll, type PollOption, type PollVote } from "@shared/schema";

import type { CommunityTabProps } from "../types";

export function QuizTab({ communityId, communityColor, myMembership }: CommunityTabProps) {
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
      const response = await apiRequest("POST", `/api/communities/${communityId}/polls`, {
        question: data.question,
        options: data.options,
        pollType: "multiple",
        isAnonymous: true,
      });
      return response.json();
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
      const response = await apiRequest("POST", `/api/polls/${selectedPoll}/vote`, { optionId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/polls", selectedPoll, "votes"] });
      toast({ title: "Vote cast!" });
    },
  });

  const selectedData = pollsList.find((poll) => poll.id === selectedPoll);

  const voteTotals = useMemo(() => {
    const totals: Record<string, number> = {};

    for (const vote of votes) {
      totals[vote.optionId] = (totals[vote.optionId] || 0) + vote.weight;
    }

    return totals;
  }, [votes]);

  const totalVoteWeight = Object.values(voteTotals).reduce((accumulator, value) => accumulator + value, 0);

  return (
    <div className="flex h-full">
      <div className={`${selectedPoll ? "w-72 border-r border-border" : "flex-1"} flex flex-col`}>
        <div className="px-4 py-3 flex items-center justify-between border-b border-border">
          <h2 className="font-headline text-sm text-muted-foreground">Quiz / Votes</h2>
          {myMembership && myMembership.powerLevel >= POWER_LEVELS.MEMBER && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost" data-testid="button-new-poll">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card">
                <DialogHeader>
                  <DialogTitle className="font-headline">New Quiz</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    const validOptions = optionTexts.filter(Boolean);

                    if (question.trim() && validOptions.length >= 2) {
                      createMutation.mutate({ question: question.trim(), options: validOptions });
                    }
                  }}
                  className="space-y-4"
                >
                  <Input placeholder="Question" value={question} onChange={(event) => setQuestion(event.target.value)} data-testid="input-poll-question" />
                  <div className="space-y-2">
                    {optionTexts.map((optionText, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder={`Option ${index + 1}`}
                          value={optionText}
                          onChange={(event) => {
                            const nextOptions = [...optionTexts];
                            nextOptions[index] = event.target.value;
                            setOptionTexts(nextOptions);
                          }}
                          data-testid={`input-poll-option-${index}`}
                        />
                        {index >= 2 && (
                          <Button type="button" size="icon" variant="ghost" onClick={() => setOptionTexts(optionTexts.filter((_, itemIndex) => itemIndex !== index))}>
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {optionTexts.length < 10 && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setOptionTexts([...optionTexts, ""])} data-testid="button-add-option">
                        <Plus className="w-3 h-3 mr-1" />
                        Add Option
                      </Button>
                    )}
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
              <Button size="icon" variant="ghost" onClick={() => setSelectedPoll(null)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h3 className="font-headline text-sm text-foreground flex-1">{selectedData.question}</h3>
              {!selectedData.isActive && <Badge variant="secondary">Closed</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedData.isAnonymous ? "Anonymous voting" : "Open voting"} | Weight by power level | {votes.length} vote{votes.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-3">
            {options.map((option) => {
              const optionWeight = voteTotals[option.id] || 0;
              const percentage = totalVoteWeight > 0 ? Math.round((optionWeight / totalVoteWeight) * 100) : 0;

              return (
                <button
                  key={option.id}
                  onClick={() => {
                    if (selectedData.isActive && myMembership) {
                      voteMutation.mutate(option.id);
                    }
                  }}
                  className="w-full text-left p-3 rounded-md border border-border hover-elevate transition-colors"
                  disabled={!selectedData.isActive || voteMutation.isPending}
                  data-testid={`option-${option.id}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-foreground">{option.text}</span>
                    <span className="text-xs font-data" style={{ color: communityColor }}>{percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%`, backgroundColor: communityColor + "aa" }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{optionWeight} weighted votes</p>
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