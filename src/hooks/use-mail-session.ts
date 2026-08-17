'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { TempMessage, TempProvider, TempSession } from '@/types/mail';
import {
  checkInbox,
  generateAddress,
  attachmentProxyUrl,
} from '@/lib/api/tf-api';
import {
  saveSession,
  getSession,
  isSessionValid,
} from '@/lib/session';
import { toast } from 'sonner';

const POLLING_INTERVAL = 5000; // 5 seconds

export function useMailSession() {
  const [session, setSession] = useState<TempSession | null>(null);
  const [emails, setEmails] = useState<TempMessage[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<TempMessage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-recover last used address on load
  useEffect(() => {
    const stored = getSession();
    if (stored && isSessionValid(stored)) {
      setSession(stored);
      checkInbox(stored.address)
        .then((result) => {
          setEmails(result.data);
          setError(null);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Failed to fetch inbox');
        });
    }
    setIsLoading(false);
  }, []);

  const fetchEmails = useCallback(async () => {
    if (!session?.address) return;

    try {
      const result = await checkInbox(session.address);
      setEmails(result.data);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to fetch emails';
      setError(message);
    }
  }, [session?.address]);

  const startPolling = useCallback(() => {
    if (pollingRef.current) return;
    setIsPolling(true);
    fetchEmails();
    pollingRef.current = setInterval(fetchEmails, POLLING_INTERVAL);
  }, [fetchEmails]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsPolling(false);
  }, []);

  useEffect(() => {
    if (session?.address) {
      startPolling();
    } else {
      stopPolling();
    }
    return () => stopPolling();
  }, [session?.address, startPolling, stopPolling]);

  const handleGenerate = useCallback(
    async (providers: TempProvider[], dot: boolean, plus: boolean) => {
      setIsLoading(true);
      setError(null);
      try {
        const address = await generateAddress(providers, dot, plus);
        const newSession: TempSession = { address };
        setSession(newSession);
        saveSession(newSession);
        setEmails([]);
        setSelectedEmail(null);
        toast.success('Email created successfully!');
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to create email';
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const handleRecover = useCallback(async (address: string) => {
    if (!address) {
      setError('Enter an address.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await checkInbox(address);
      const newSession: TempSession = { address };
      setSession(newSession);
      saveSession(newSession);
      setEmails(result.data);
      setSelectedEmail(null);
      toast.success('Address recovered');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to recover address';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSelectEmail = useCallback((email: TempMessage) => {
    setSelectedEmail(email);
  }, []);

  const handleRefresh = useCallback(async () => {
    await fetchEmails();
    toast.success('Inbox refreshed');
  }, [fetchEmails]);

  const handleDownloadAttachment = useCallback(
    async (messageId: string, attachmentId: string, filename: string) => {
      if (!session?.address) return;
      try {
        const res = await fetch(
          attachmentProxyUrl(session.address, messageId, attachmentId)
        );
        if (!res.ok) throw new Error('Failed to download attachment');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'attachment';
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to download attachment';
        toast.error(message);
      }
    },
    [session?.address]
  );

  const handleClearSelected = useCallback(() => setSelectedEmail(null), []);

  return {
    session,
    emails,
    selectedEmail,
    isLoading,
    isPolling,
    error,
    isAuthenticated: isSessionValid(session),

    generate: handleGenerate,
    recover: handleRecover,
    selectEmail: handleSelectEmail,
    refresh: handleRefresh,
    downloadAttachment: handleDownloadAttachment,
    clearSelectedEmail: handleClearSelected,
  };
}
