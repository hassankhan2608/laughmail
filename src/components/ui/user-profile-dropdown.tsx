'use client';

import * as React from 'react';
import { ChevronRight, type LucideIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UserProfile {
  name: string;
  handle: string;
  avatarUrl: string;
}

interface ActionItem {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
}

interface MenuItem {
  icon: LucideIcon;
  label: string;
  description?: string;
  customContent?: React.ReactNode;
  onClick?: () => void;
  isDestructive?: boolean;
  hasArrow?: boolean;
}

interface UserProfileDropdownProps {
  user: UserProfile;
  actions: ActionItem[];
  menuItems: MenuItem[];
}

export const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({
  user,
  actions,
  menuItems,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);

  const contentVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring' as const,
        damping: 20,
        stiffness: 300,
        staggerChildren: 0.05,
      },
    },
    exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted cursor-pointer">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-foreground">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate max-w-[150px]">
              {user.handle}
            </p>
          </div>
        </div>
      </DropdownMenuTrigger>

      <AnimatePresence>
        {isOpen && (
          <DropdownMenuContent
            asChild
            forceMount
            className="w-64 p-2"
            align="end"
          >
            <motion.div
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={contentVariants}
            >
              <DropdownMenuLabel className="flex items-center gap-2 p-2">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {user.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate max-w-[180px]">
                    {user.handle}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="mx-2" />

              {actions.length > 0 && (
                <>
                  <DropdownMenuGroup>
                    <div className="grid grid-cols-3 gap-1 p-1">
                      {actions.map((action) => (
                        <Button
                          key={action.label}
                          variant="ghost"
                          className="flex flex-col h-16 items-center justify-center gap-1 text-muted-foreground"
                          onClick={action.onClick}
                        >
                          <action.icon className="h-5 w-5" />
                          <span className="text-xs">{action.label}</span>
                        </Button>
                      ))}
                    </div>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="mx-2 mb-1" />
                </>
              )}

              <DropdownMenuGroup>
                {menuItems.map((item) => (
                  <motion.div variants={itemVariants} key={item.label}>
                    <DropdownMenuItem
                      onMouseEnter={() => setHoveredItem(item.label)}
                      onMouseLeave={() => setHoveredItem(null)}
                      className={cn(
                        'flex items-center justify-between p-2 text-sm relative',
                        item.customContent && 'flex-col items-start gap-2',
                        item.isDestructive &&
                          'text-destructive focus:text-destructive-foreground focus:bg-destructive'
                      )}
                      onClick={item.onClick}
                    >
                      {hoveredItem === item.label && (
                        <motion.div
                          layoutId="dropdown-hover-bg"
                          className={cn(
                            'absolute inset-0 rounded-md -z-10',
                            item.isDestructive
                              ? 'bg-destructive/10'
                              : 'bg-muted'
                          )}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                        />
                      )}
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <item.icon className="h-4 w-4" />
                          <div className="flex flex-col">
                            <span>{item.label}</span>
                            {item.description && (
                              <span className="text-xs text-muted-foreground">
                                {item.description}
                              </span>
                            )}
                          </div>
                        </div>
                        {item.hasArrow && (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      {item.customContent && (
                        <div className="w-full pl-6">{item.customContent}</div>
                      )}
                    </DropdownMenuItem>
                  </motion.div>
                ))}
              </DropdownMenuGroup>
            </motion.div>
          </DropdownMenuContent>
        )}
      </AnimatePresence>
    </DropdownMenu>
  );
};
