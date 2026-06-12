"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { fetchSearchDojos } from "@/queries/dojoQueries";

export function useSearchDojos(searchTerm) {
  const query = searchTerm?.trim() || "";

  return useQuery({
    queryKey: ["dojos", "search", query],
    queryFn: () => fetchSearchDojos(query),
    enabled: query.length >= 2,
    placeholderData: keepPreviousData,
  });
}
