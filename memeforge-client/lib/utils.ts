import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateMemeHash(): string {
  return `0x${Array.from({ length: 32 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('')}`
}

export function formatHash(hash: string): string {
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`
}