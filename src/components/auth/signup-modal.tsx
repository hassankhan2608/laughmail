'use client';

import { useState, useEffect } from 'react';
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from '@/components/ui/responsive-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus, Loader2, RefreshCw } from 'lucide-react';

interface SignupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignup: (
    username: string,
    domain: string,
    password: string
  ) => Promise<void>;
  getDomains: () => Promise<string[]>;
}

export const SignupModal: React.FC<SignupModalProps> = ({
  open,
  onOpenChange,
  onSignup,
  getDomains,
}) => {
  const [username, setUsername] = useState('');
  const [domain, setDomain] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [availableDomains, setAvailableDomains] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && availableDomains.length === 0) {
      handleRefreshDomains();
    }
  }, [open]);

  useEffect(() => {
    if (availableDomains.length > 0 && !domain) {
      setDomain(availableDomains[0]);
    }
  }, [availableDomains, domain]);

  const handleRefreshDomains = async () => {
    setRefreshing(true);
    try {
      const domains = await getDomains();
      setAvailableDomains(domains);
    } catch {
      setError('Failed to load domains');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (!/^[a-z0-9._-]+$/.test(username)) {
      setError(
        'Username can only contain lowercase letters, numbers, dots, underscores, and hyphens'
      );
      return;
    }

    if (!domain) {
      setError('Please select a domain');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await onSignup(username, domain, password);
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const fullEmail = username && domain ? `${username}@${domain}` : '';

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent className="sm:max-w-[500px]">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create Custom Account
          </ResponsiveModalTitle>
          <ResponsiveModalDescription>
            Create your own Mail.tm account with a custom username.
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="signup-username">Username</Label>
              <Input
                id="signup-username"
                type="text"
                placeholder="johndoe"
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '')
                  )
                }
                required
                disabled={loading}
                minLength={3}
              />
              <p className="text-xs text-muted-foreground">
                At least 3 characters. Letters, numbers, dots, underscores, and
                hyphens only.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="signup-domain">Domain</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshDomains}
                  disabled={loading || refreshing}
                  className="h-auto p-1"
                >
                  <RefreshCw
                    className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`}
                  />
                </Button>
              </div>
              <Select
                value={domain}
                onValueChange={setDomain}
                disabled={loading}
              >
                <SelectTrigger id="signup-domain">
                  <SelectValue placeholder="Select a domain" />
                </SelectTrigger>
                <SelectContent>
                  {availableDomains.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {fullEmail && (
              <div className="p-3 rounded-md bg-muted">
                <p className="text-sm font-medium">Your email will be:</p>
                <p className="text-sm text-muted-foreground font-mono">
                  {fullEmail}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">
                At least 8 characters.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-confirm-password">Confirm Password</Label>
              <Input
                id="signup-confirm-password"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </div>
            )}
          </div>

          <ResponsiveModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || availableDomains.length === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create Account
                </>
              )}
            </Button>
          </ResponsiveModalFooter>
        </form>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
};
