import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthUser } from '../models';

const KEYS = {
  ACCESS_TOKEN: 'nkapay_access_token',
  REFRESH_TOKEN: 'nkapay_refresh_token',
  USER: 'nkapay_user',
  THEME: 'nkapay_theme',
  LANGUAGE: 'nkapay_language'
};

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly platformId = inject(PLATFORM_ID);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  // Access Token
  getAccessToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(KEYS.ACCESS_TOKEN);
  }

  setAccessToken(token: string): void {
    if (this.isBrowser) {
      localStorage.setItem(KEYS.ACCESS_TOKEN, token);
    }
  }

  // Refresh Token
  getRefreshToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(KEYS.REFRESH_TOKEN);
  }

  setRefreshToken(token: string): void {
    if (this.isBrowser) {
      localStorage.setItem(KEYS.REFRESH_TOKEN, token);
    }
  }

  // User
  getUser(): AuthUser | null {
    if (!this.isBrowser) return null;
    const userStr = localStorage.getItem(KEYS.USER);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  }

  setUser(user: AuthUser): void {
    if (this.isBrowser) {
      localStorage.setItem(KEYS.USER, JSON.stringify(user));
    }
  }

  // Clear auth data
  clearAuth(): void {
    if (this.isBrowser) {
      localStorage.removeItem(KEYS.ACCESS_TOKEN);
      localStorage.removeItem(KEYS.REFRESH_TOKEN);
      localStorage.removeItem(KEYS.USER);
    }
  }

  // Theme
  getTheme(): 'light' | 'dark' {
    if (!this.isBrowser) return 'light';
    return (localStorage.getItem(KEYS.THEME) as 'light' | 'dark') || 'light';
  }

  setTheme(theme: 'light' | 'dark'): void {
    if (this.isBrowser) {
      localStorage.setItem(KEYS.THEME, theme);
    }
  }

  // Language
  getLanguage(): string {
    if (!this.isBrowser) return 'fr';
    return localStorage.getItem(KEYS.LANGUAGE) || 'fr';
  }

  setLanguage(lang: string): void {
    if (this.isBrowser) {
      localStorage.setItem(KEYS.LANGUAGE, lang);
    }
  }

  // Generic methods
  get<T>(key: string): T | null {
    if (!this.isBrowser) return null;
    const item = localStorage.getItem(key);
    if (item) {
      try {
        return JSON.parse(item);
      } catch {
        return null;
      }
    }
    return null;
  }

  set(key: string, value: unknown): void {
    if (this.isBrowser) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  remove(key: string): void {
    if (this.isBrowser) {
      localStorage.removeItem(key);
    }
  }

  clear(): void {
    if (this.isBrowser) {
      localStorage.clear();
    }
  }
}
