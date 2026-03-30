import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** 
 * Utility functions for merging tailwind classes safely.
 * @param {...string} inputs - Tailwind classes
 * @returns {string} - Merged classes
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
