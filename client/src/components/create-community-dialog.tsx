import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, COMMUNITY_COLORS } from "@shared/schema";
import { Plus } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function CreateCommunityDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(COMMUNITY_COLORS[0]);
  const [category, setCategory] = useState("general");
  const [entryType, setEntryType] = useState("open");
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      color: string;
      category: string;
      entryType: string;
    }) => {
      const res = await apiRequest("POST", "/api/communities", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/communities/mine"] });
      setOpen(false);
      resetForm();
      toast({ title: "Community created!" });
    },
    onError: (err: any) => {
      toast({ title: "Failed to create community", description: err.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setColor(COMMUNITY_COLORS[0]);
    setCategory("general");
    setEntryType("open");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({ name: name.trim(), description, color, category, entryType });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid="button-create-community">
          <Plus className="w-4 h-4 mr-1" />
          Create
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card" data-testid="dialog-create-community">
        <DialogHeader>
          <DialogTitle className="font-headline">Create Community</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="community-name">Name</Label>
            <Input
              id="community-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your community name"
              data-testid="input-community-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="community-desc">Description</Label>
            <Textarea
              id="community-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this community about?"
              data-testid="input-community-description"
              className="resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COMMUNITY_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`w-8 h-8 rounded-md transition-all ${
                    color === c ? "ring-2 ring-foreground ring-offset-2 ring-offset-card scale-110" : ""
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  data-testid={`button-color-${c}`}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger data-testid="select-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Entry Type</Label>
              <Select value={entryType} onValueChange={setEntryType}>
                <SelectTrigger data-testid="select-entry-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="question">Question</SelectItem>
                  <SelectItem value="invite">Invite Only</SelectItem>
                  <SelectItem value="approval">Approval</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={createMutation.isPending || !name.trim()}
            data-testid="button-submit-community"
          >
            {createMutation.isPending ? "Creating..." : "Create Community"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
