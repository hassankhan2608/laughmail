'use client';

import { useState } from 'react';
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
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Trash2,
  Mail,
  Eye,
  EyeOff,
  AlertTriangle,
  Loader2,
  Activity,
} from 'lucide-react';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  password?: string;
  isTemporary: boolean;
  accountId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  storageUsed: number;
  storageQuota: number;
  messageCount: number;
  isDisabled?: boolean;
  isDeleted?: boolean;
  onClearAllEmails: () => Promise<void>;
  onDeleteAccount: () => Promise<void>;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  open,
  onOpenChange,
  email,
  password,
  isTemporary,
  accountId,
  createdAt,
  updatedAt,
  storageUsed,
  storageQuota,
  messageCount,
  isDisabled = false,
  isDeleted = false,
  onClearAllEmails,
  onDeleteAccount,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const formatBytes = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return 'N/A';
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleClearEmails = async () => {
    if (
      !confirm(`Delete all ${messageCount} messages? This cannot be undone.`)
    ) {
      return;
    }

    setLoading(true);
    try {
      await onClearAllEmails();
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!password || deleteConfirmPassword !== password) {
      alert('Please enter the correct password to confirm account deletion.');
      return;
    }

    setLoading(true);
    try {
      await onDeleteAccount();
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </ResponsiveModalTitle>
          <ResponsiveModalDescription>
            Manage your account settings and preferences.
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        <div className="space-y-6 py-4">
          {/* Account Details */}
          <Card className="p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Account Details
            </h3>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
                <span className="text-muted-foreground">Email Address:</span>
                <span className="font-mono text-xs break-all">{email}</span>
              </div>

              {password && (
                <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
                  <span className="text-muted-foreground">Password:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs">
                      {showPassword
                        ? password
                        : '•'.repeat(Math.min(password.length, 12))}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
                <span className="text-muted-foreground">Account Type:</span>
                <Badge
                  variant={isTemporary ? 'secondary' : 'default'}
                  className="w-fit"
                >
                  {isTemporary ? 'Temporary' : 'Custom'}
                </Badge>
              </div>

              <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
                <span className="text-muted-foreground">Account Status:</span>
                <Badge
                  variant={isDisabled || isDeleted ? 'destructive' : 'default'}
                  className="w-fit"
                >
                  {isDeleted ? 'Deleted' : isDisabled ? 'Disabled' : 'Active'}
                </Badge>
              </div>

              {accountId && (
                <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
                  <span className="text-muted-foreground">Account ID:</span>
                  <span className="font-mono text-xs break-all">
                    {accountId}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
                <span className="text-muted-foreground">Created At:</span>
                <span className="text-xs">{formatDate(createdAt)}</span>
              </div>

              {updatedAt && (
                <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span className="text-xs">{formatDate(updatedAt)}</span>
                </div>
              )}

              <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
                <span className="text-muted-foreground">Storage Used:</span>
                <span className="text-xs">
                  {formatBytes(storageUsed)} / {formatBytes(storageQuota)}
                </span>
              </div>

              <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
                <span className="text-muted-foreground">Total Messages:</span>
                <span className="text-xs">{messageCount}</span>
              </div>

              <div className="grid grid-cols-[120px_1fr] gap-2 items-center">
                <span className="text-muted-foreground">Storage %:</span>
                <span className="text-xs">
                  {((storageUsed / storageQuota) * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          </Card>

          {/* Polling Status */}
          <Card className="p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Email Polling
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="default" className="text-xs">
                  Polling (5s interval)
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                New messages are checked every 5 seconds automatically.
              </p>
            </div>
          </Card>

          {/* Clear All Emails */}
          <Card className="p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Clear All Emails
            </h3>
            <p className="text-sm text-muted-foreground">
              Delete all messages from your inbox. This action cannot be undone.
            </p>
            <Button
              variant="outline"
              onClick={handleClearEmails}
              disabled={loading || messageCount === 0}
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear {messageCount} Message{messageCount !== 1 ? 's' : ''}
            </Button>
          </Card>

          {/* Danger Zone - Delete Account */}
          {!isTemporary && (
            <Card className="p-4 space-y-3 border-destructive/50">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <h3 className="font-semibold">Danger Zone</h3>
              </div>

              <p className="text-sm text-muted-foreground">
                Permanently delete your Mail.tm account. All messages will be
                lost and this action cannot be undone.
              </p>

              {!showDeleteConfirm ? (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={loading}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              ) : (
                <div className="space-y-3 p-3 bg-destructive/10 rounded-md">
                  <p className="text-sm font-medium text-destructive">
                    ⚠️ Are you absolutely sure?
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="delete-confirm-password">
                      Enter your password to confirm:
                    </Label>
                    <Input
                      id="delete-confirm-password"
                      type="password"
                      placeholder="Enter password"
                      value={deleteConfirmPassword}
                      onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmPassword('');
                      }}
                      disabled={loading}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={loading || !deleteConfirmPassword}
                      className="flex-1"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Forever
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>

        <ResponsiveModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </ResponsiveModalFooter>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
};
