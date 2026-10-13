import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyAccount, type Account } from "@/lib/account.functions";

export const accountQueryKey = ["account"] as const;

export function useAccount() {
  const fetchAccount = useServerFn(getMyAccount);

  return useQuery<Account>({
    queryKey: accountQueryKey,
    queryFn: () => fetchAccount(),
    staleTime: 60_000,
    retry: false,
  });
}
