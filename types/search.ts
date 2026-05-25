export type SearchStatus = "pending" | "running" | "completed" | "failed";

export type Search = {
  id: string;
  userId: string;
  query: string;
  status: SearchStatus;
  errorMessage?: string | null;
  createdAt: string;
  completedAt?: string | null;
};

export type CreateSearchDto = {
  query: string;
};
