'use client';

import { LogIn, UserPlus, Settings, Mail, Database } from 'lucide-react';
import { UserProfileDropdown } from '@/components/ui/user-profile-dropdown';
import { Progress } from '@/components/ui/progress';

interface AccountMenuProps {
  email: string;
  isTemporary?: boolean;
  storageUsed?: number;
  storageQuota?: number;
  onLogin: () => void;
  onSignup: () => void;
  onSettings: () => void;
}

export const AccountMenu: React.FC<AccountMenuProps> = ({
  email,
  isTemporary = true,
  storageUsed = 0,
  storageQuota = 40000000,
  onLogin,
  onSignup,
  onSettings,
}) => {
  const formatBytes = (bytes: number) => {
    return `${(bytes / 1024 / 1024).toFixed(1)}`;
  };

  const storagePercentage = (storageUsed / storageQuota) * 100;
  const username = email.split('@')[0];

  const user = {
    name: username,
    handle: email,
    avatarUrl: '',
  };

  const menuItems = [
    {
      icon: Mail,
      label: `Account: ${isTemporary ? 'Temporary' : 'Custom'}`,
      description: isTemporary
        ? 'Random account, expires in 60 min'
        : 'Your custom account',
      hasArrow: false,
    },
    {
      icon: Database,
      label: 'Storage',
      customContent: (
        <div className="space-y-1.5 w-full">
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {formatBytes(storageUsed)} / {formatBytes(storageQuota)} MB
            </span>
            <span className="text-xs text-muted-foreground">
              {storagePercentage.toFixed(0)}%
            </span>
          </div>
          <Progress value={storagePercentage} className="h-1.5" />
        </div>
      ),
      hasArrow: false,
    },
    {
      icon: Settings,
      label: 'Settings',
      description: 'Account details, Clear emails, Delete account',
      onClick: onSettings,
      hasArrow: true,
    },
    {
      icon: LogIn,
      label: 'Login',
      description: 'Login to existing account',
      onClick: onLogin,
      hasArrow: false,
    },
    {
      icon: UserPlus,
      label: 'Sign Up',
      description: 'Create custom account',
      onClick: onSignup,
      hasArrow: false,
    },
  ];

  return <UserProfileDropdown user={user} actions={[]} menuItems={menuItems} />;
};
