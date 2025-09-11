import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export interface PaginatedResponse<T> {
  data(data: boolean): unknown;
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}
