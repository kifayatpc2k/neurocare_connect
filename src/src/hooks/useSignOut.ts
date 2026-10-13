import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/** Ordered sign-out: cancel, clear cache, end session, replace history. */
export function useSignOut() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/", replace: true });
  };
}
