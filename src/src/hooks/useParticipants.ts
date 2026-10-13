import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  completeBaseline,
  completeFollowUp,
  createParticipant,
  getParticipant,
  listParticipants,
  randomizeParticipant,
  recordConsent,
  recordEnrolment,
  recordScreening,
  updateParticipantDetails,
  openDay15,
  type Participant,
} from "@/lib/participants.functions";

export const participantsKey = ["participants"] as const;
export const participantKey = (id: string) => ["participant", id] as const;

export function useParticipants() {
  const fetchAll = useServerFn(listParticipants);
  return useQuery<Participant[]>({
    queryKey: participantsKey,
    queryFn: () => fetchAll(),
    retry: false,
  });
}

export function useParticipant(id: string) {
  const fetchOne = useServerFn(getParticipant);
  return useQuery<Participant>({
    queryKey: participantKey(id),
    queryFn: () => fetchOne({ data: { id } }),
    retry: false,
  });
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

/** Shared success/error handling so every lifecycle action behaves the same. */
function useLifecycleMutation<TInput>(
  fn: (input: TInput) => Promise<Participant>,
  successMessage: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: async (participant) => {
      // The server returns the freshly re-read row; also revalidate so every
      // view reflects the persisted database state.
      queryClient.setQueryData(participantKey(participant.id), participant);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: participantKey(participant.id) }),
        queryClient.invalidateQueries({ queryKey: participantsKey }),
      ]);
      toast.success(successMessage);
    },
    onError: (error) => {
      console.error("[participants] action failed", error);
      toast.error(errorMessage(error));
    },
  });
}

export function useCreateParticipant() {
  const fn = useServerFn(createParticipant);
  return useLifecycleMutation(
    (data: { site?: string; notes?: string; screeningDate?: string; isTestRecord?: boolean }) =>
      fn({ data }),
    "Participant added to screening.",
  );
}

export function useRecordScreening() {
  const fn = useServerFn(recordScreening);
  return useLifecycleMutation(
    (data: {
      id: string;
      screeningDate: string | null;
      eligibilityStatus: "pending" | "eligible" | "not_eligible";
      inclusionCriteriaMet: boolean;
      exclusionCriteriaPresent: boolean;
      screeningNotes: string | null;
    }) => fn({ data }),
    "Screening saved.",
  );
}

export function useRecordConsent() {
  const fn = useServerFn(recordConsent);
  return useLifecycleMutation(
    (data: {
      id: string;
      consentStatus: "pending" | "obtained" | "not_obtained";
      consentDate: string | null;
      consentConfirmed: boolean;
      consentNotes: string | null;
    }) => fn({ data }),
    "Consent record saved.",
  );
}

export function useRecordEnrolment() {
  const fn = useServerFn(recordEnrolment);
  return useLifecycleMutation(
    (data: {
      id: string;
      enrolledAt: string;
      enrolmentConfirmed: boolean;
      enrolmentNotes: string | null;
    }) => fn({ data }),
    "Participant enrolled.",
  );
}

export function useCompleteBaseline() {
  const fn = useServerFn(completeBaseline);
  return useLifecycleMutation((data: { id: string }) => fn({ data }), "Baseline marked complete.");
}

export function useRandomize() {
  const fn = useServerFn(randomizeParticipant);
  return useLifecycleMutation(
    (data: { id: string }) => fn({ data }),
    "Participant randomised — allocation is permanent.",
  );
}

export function useCompleteFollowUp() {
  const fn = useServerFn(completeFollowUp);
  return useLifecycleMutation(
    (data: { id: string; milestone: "day_15" | "day_30" }) => fn({ data }),
    "Follow-up visit recorded.",
  );
}

export function useUpdateParticipantDetails() {
  const fn = useServerFn(updateParticipantDetails);
  return useLifecycleMutation(
    (data: { id: string; site: string | null; notes: string | null }) => fn({ data }),
    "Participant details updated.",
  );
}

export function useOpenDay15() {
  const fn = useServerFn(openDay15);
  return useLifecycleMutation((data: { id: string }) => fn({ data }), "Day 15 follow-up opened.");
}
