import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface DropdownColumnLayout {
  key: string;
  headerLabel: string;
  widthPercent: number;
  renderType?: "text" | "thumbnail";
}

export const CUSTOM_DROPDOWN_CONFIGS: Record<string, DropdownColumnLayout[]> =
  {};
