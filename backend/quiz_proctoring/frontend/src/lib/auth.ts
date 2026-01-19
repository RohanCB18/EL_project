"use client";

import { User } from "@/lib/api";

const USER_KEY = "user";

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;

  const userData = sessionStorage.getItem(USER_KEY);
  if (!userData) return null;

  try {
    return JSON.parse(userData) as User;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredUser(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(USER_KEY);
}

export function requireAuth(redirectUrl: string): User | null {
  const user = getStoredUser();
  if (!user && typeof window !== "undefined") {
    window.location.href = redirectUrl;
    return null;
  }
  return user;
}
