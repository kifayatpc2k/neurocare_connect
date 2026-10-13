import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { generateStudyReport } from "@/lib/report.functions";

export function DownloadStudyReport({ participantId }: { participantId: string }) {
  const generate = useServerFn(generateStudyReport);
  const mutation = useMutation({
    mutationFn: () => generate({ data: { participantId } }),
    onSuccess: (result) => {
      const bin = atob(result.fileBase64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success("Study report downloaded.");
    },
    onError: () => toast.error("Unable to generate study report. Please try again."),
  });

  return (
    <Button
      size="sm"
      className="rounded-full"
      disabled={mutation.isPending}
      onClick={() => mutation.mutate()}
    >
      {mutation.isPending ? (
        <Loader2 aria-hidden="true" className="size-4 animate-spin" />
      ) : (
        <FileText aria-hidden="true" className="size-4" />
      )}
      {mutation.isPending ? "Generating report…" : "Download Study Report"}
    </Button>
  );
}
