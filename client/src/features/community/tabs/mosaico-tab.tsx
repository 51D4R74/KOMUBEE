import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Image, Link, Plus, Puzzle, Send, Type } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { POWER_LEVELS, type Mosaic, type MosaicPiece, type User } from "@shared/schema";

import { UserAvatar } from "../components/user-avatar";
import type { CommunityTabProps } from "../types";

type MosaicPieceWithUser = MosaicPiece & { user: User };

export function MosaicoTab({ communityId, myMembership }: CommunityTabProps) {
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

  const { data: pieces = [] } = useQuery<MosaicPieceWithUser[]>({
    queryKey: ["/api/mosaics", selectedMosaic, "pieces"],
    enabled: !!selectedMosaic,
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; format: string; rules: string }) => {
      const response = await apiRequest("POST", `/api/communities/${communityId}/mosaics`, data);
      return response.json();
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
      const response = await apiRequest("POST", `/api/mosaics/${selectedMosaic}/pieces`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mosaics", selectedMosaic, "pieces"] });
      setPieceContent("");
      toast({ title: "Piece added!" });
    },
  });

  const selectedData = mosaicsList.find((mosaic) => mosaic.id === selectedMosaic);
  const formatLabels: Record<string, string> = { document: "Doc", playlist: "Playlist", board: "Board", story: "Story" };

  return (
    <div className="flex h-full">
      <div className={`${selectedMosaic ? "w-72 border-r border-border" : "flex-1"} flex flex-col`}>
        <div className="px-4 py-3 flex items-center justify-between border-b border-border">
          <h2 className="font-headline text-sm text-muted-foreground">Mosaics</h2>
          {myMembership && myMembership.powerLevel >= POWER_LEVELS.MEMBER && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="ghost" data-testid="button-new-mosaic">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card">
                <DialogHeader>
                  <DialogTitle className="font-headline">New Mosaic</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (newTitle.trim()) {
                      createMutation.mutate({
                        title: newTitle.trim(),
                        description: newDesc.trim(),
                        format: newFormat,
                        rules: newRules.trim(),
                      });
                    }
                  }}
                  className="space-y-4"
                >
                  <Input placeholder="Mosaic title" value={newTitle} onChange={(event) => setNewTitle(event.target.value)} data-testid="input-mosaic-title" />
                  <Textarea placeholder="Description..." value={newDesc} onChange={(event) => setNewDesc(event.target.value)} className="resize-none" data-testid="input-mosaic-desc" />
                  <select value={newFormat} onChange={(event) => setNewFormat(event.target.value)} className="w-full px-3 py-2 rounded-md border border-border bg-card text-sm text-foreground" data-testid="select-mosaic-format">
                    <option value="board">Board</option>
                    <option value="document">Document</option>
                    <option value="playlist">Playlist</option>
                    <option value="story">Story</option>
                  </select>
                  <Textarea placeholder="Rules (optional)..." value={newRules} onChange={(event) => setNewRules(event.target.value)} className="resize-none" data-testid="input-mosaic-rules" />
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
                    <Badge variant="outline" className="text-xs">{formatLabels[mosaic.format] || mosaic.format}</Badge>
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
              <Button size="icon" variant="ghost" onClick={() => setSelectedMosaic(null)}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <div className="flex-1">
                <h3 className="font-headline text-sm text-foreground">{selectedData.title}</h3>
                {selectedData.description && <p className="text-xs text-muted-foreground mt-0.5">{selectedData.description}</p>}
              </div>
              <Badge variant="outline" className="text-xs">{formatLabels[selectedData.format] || selectedData.format}</Badge>
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
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (pieceContent.trim()) {
                    addPieceMutation.mutate({ pieceType, content: pieceContent.trim() });
                  }
                }}
                className="flex gap-2"
              >
                <div className="flex border border-border rounded-md overflow-hidden shrink-0">
                  {(["text", "link", "image"] as const).map((type) => (
                    <button key={type} type="button" onClick={() => setPieceType(type)} className={`px-2 py-1.5 text-xs ${pieceType === type ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"}`} data-testid={`button-piece-type-${type}`}>
                      {type === "text" ? <Type className="w-3 h-3" /> : type === "link" ? <Link className="w-3 h-3" /> : <Image className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
                <Input value={pieceContent} onChange={(event) => setPieceContent(event.target.value)} placeholder={pieceType === "link" ? "https://..." : pieceType === "image" ? "Image URL..." : "Your piece..."} className="flex-1" data-testid="input-piece-content" />
                <Button type="submit" size="icon" disabled={addPieceMutation.isPending || !pieceContent.trim()} data-testid="button-add-piece">
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