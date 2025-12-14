'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Session, Email } from '@/types/mail';
import {
  getMessages,
  getMessage,
  deleteMessage,
  markAsRead,
  quickRegister,
  loginWithCredentials,
  registerWithCredentials,
  deleteAccount,
  getDomains,
  getMessageSource,
  downloadAttachment,
} from '@/lib/api/mail-api';
import {
  saveSession,
  getSession,
  clearSession,
  isSessionValid,
} from '@/lib/session';
import { toast } from 'sonner';

const POLLING_INTERVAL = 5000; // 5 seconds

export function useMailSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize session from localStorage
  useEffect(() => {
    const stored = getSession();
    if (stored && isSessionValid(stored)) {
      setSession(stored);
    }
    setIsLoading(false);
  }, []);

  // Fetch emails
  const fetchEmails = useCallback(async () => {
    if (!session?.token) return;

    try {
      const messages = await getMessages(session.token);
      setEmails(messages);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch emails';
      setError(message);
    }
  }, [session?.token]);

  // Start polling
  const startPolling = useCallback(() => {
    if (pollingRef.current) return;

    setIsPolling(true);
    fetchEmails();

    pollingRef.current = setInterval(() => {
      fetchEmails();
    }, POLLING_INTERVAL);
  }, [fetchEmails]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // Auto-start polling when authenticated
  useEffect(() => {
    if (session?.token) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => stopPolling();
  }, [session?.token, startPolling, stopPolling]);

  // Quick register (generate random email)
  const handleQuickRegister = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const newSession = await quickRegister();
      setSession(newSession);
      saveSession(newSession);
      toast.success('Email created successfully!');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to create email';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Login with credentials
  const handleLogin = useCallback(async (address: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const newSession = await loginWithCredentials(address, password);
      setSession(newSession);
      saveSession(newSession);
      toast.success('Logged in successfully!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register with custom credentials
  const handleRegister = useCallback(
    async (address: string, password: string) => {
      setIsLoading(true);
      setError(null);

      try {
        const newSession = await registerWithCredentials(address, password);
        setSession(newSession);
        saveSession(newSession);
        toast.success('Account created successfully!');
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Registration failed';
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Logout
  const handleLogout = useCallback(() => {
    stopPolling();
    setSession(null);
    setEmails([]);
    setSelectedEmail(null);
    clearSession();
    toast.success('Logged out successfully');
  }, [stopPolling]);

  // Delete account
  const handleDeleteAccount = useCallback(async () => {
    if (!session) return;

    try {
      await deleteAccount(session.account.id, session.token);
      handleLogout();
      toast.success('Account deleted successfully');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to delete account';
      toast.error(message);
      throw err;
    }
  }, [session, handleLogout]);

  // Select and load full email
  const handleSelectEmail = useCallback(
    async (email: Email) => {
      if (!session?.token) return;

      try {
        const fullEmail = await getMessage(email.id, session.token);
        setSelectedEmail(fullEmail);

        // Mark as read if unread
        if (!email.seen) {
          await markAsRead(email.id, session.token);
          setEmails((prev) =>
            prev.map((e) => (e.id === email.id ? { ...e, seen: true } : e))
          );
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load email';
        toast.error(message);
      }
    },
    [session?.token]
  );

  // Delete email
  const handleDeleteEmail = useCallback(
    async (emailId: string) => {
      if (!session?.token) return;

      try {
        await deleteMessage(emailId, session.token);
        setEmails((prev) => prev.filter((e) => e.id !== emailId));
        if (selectedEmail?.id === emailId) {
          setSelectedEmail(null);
        }
        toast.success('Email deleted');
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to delete email';
        toast.error(message);
      }
    },
    [session?.token, selectedEmail?.id]
  );

  // Get email source
  const handleGetSource = useCallback(
    async (emailId: string): Promise<string> => {
      if (!session?.token) throw new Error('Not authenticated');
      return getMessageSource(emailId, session.token);
    },
    [session?.token]
  );

  // Download attachment
  const handleDownloadAttachment = useCallback(
    async (attachmentId: string, filename: string) => {
      if (!session?.token) return;

      try {
        const blob = await downloadAttachment(attachmentId, session.token);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to download attachment';
        toast.error(message);
      }
    },
    [session?.token]
  );

  // Refresh emails manually
  const handleRefresh = useCallback(async () => {
    await fetchEmails();
    toast.success('Inbox refreshed');
  }, [fetchEmails]);

  // Clear all emails
  const handleClearAllEmails = useCallback(async () => {
    if (!session?.token) return;

    try {
      // Delete all emails one by one
      await Promise.all(
        emails.map((email) => deleteMessage(email.id, session.token))
      );
      setEmails([]);
      setSelectedEmail(null);
      toast.success('All emails cleared');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to clear emails';
      toast.error(message);
      throw err;
    }
  }, [session?.token, emails]);

  // Get available domains
  const handleGetDomains = useCallback(async () => {
    return getDomains();
  }, []);

  return {
    // State
    session,
    emails,
    selectedEmail,
    isLoading,
    isPolling,
    error,
    isAuthenticated: !!session && isSessionValid(session),

    // Actions
    quickRegister: handleQuickRegister,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    deleteAccount: handleDeleteAccount,
    selectEmail: handleSelectEmail,
    deleteEmail: handleDeleteEmail,
    getSource: handleGetSource,
    downloadAttachment: handleDownloadAttachment,
    refresh: handleRefresh,
    getDomains: handleGetDomains,
    clearAllEmails: handleClearAllEmails,
    clearSelectedEmail: () => setSelectedEmail(null),
  };
}
