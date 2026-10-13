import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateParticipant } from "@/hooks/useParticipants";

/**
 * Screening intake only — a study group is never assigned at creation time.
 */
export function AddParticipantDialog() {
  const [open, setOpen] = useState(false);
  const [site, setSite] = useState("");
  const [screeningDate, setScreeningDate] = useState("");
  const [notes, setNotes] = useState("");
  const create = useCreateParticipant();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl">
          <UserPlus aria-hidden="true" className="size-4" />
          Add participant
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add participant for screening</DialogTitle>
          <DialogDescription>
            A unique Study Participant ID is generated automatically. Group allocation happens
            later, only after baseline is complete.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            create.mutate(
              {
                ...(site.trim() ? { site: site.trim() } : {}),
                ...(notes.trim() ? { notes: notes.trim() } : {}),
                ...(screeningDate ? { screeningDate } : {}),
              },
              {
                onSuccess: () => {
                  setOpen(false);
                  setSite("");
                  setNotes("");
                  setScreeningDate("");
                },
              },
            );
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="site">Site</Label>
            <Input
              id="site"
              value={site}
              onChange={(event) => setSite(event.target.value)}
              placeholder="Study site or clinic"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="screening-date">Planned screening date</Label>
            <Input
              id="screening-date"
              type="date"
              value={screeningDate}
              onChange={(event) => setScreeningDate(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="intake-notes">Screening notes</Label>
            <Textarea
              id="intake-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Referral source, contact arrangements…"
            />
          </div>
          <DialogFooter>
            <Button type="submit" className="rounded-xl" disabled={create.isPending}>
              {create.isPending ? "Adding…" : "Add participant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
