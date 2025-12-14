'use client';

import * as React from 'react';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const ResponsiveModalContext = React.createContext<{
  isMobile: boolean;
} | null>(null);

function useResponsiveModalContext() {
  const context = React.useContext(ResponsiveModalContext);
  if (!context) {
    throw new Error(
      'ResponsiveModal components must be used within <ResponsiveModal>'
    );
  }
  return context;
}

type ResponsiveModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
};

const ResponsiveModal = ({
  open,
  onOpenChange,
  children,
}: ResponsiveModalProps) => {
  const isMobile = useIsMobile();
  const Component = isMobile ? Drawer : Dialog;

  return (
    <ResponsiveModalContext.Provider value={{ isMobile }}>
      <Component open={open} onOpenChange={onOpenChange}>
        {children}
      </Component>
    </ResponsiveModalContext.Provider>
  );
};

type ResponsiveModalTriggerProps = {
  className?: string;
  children: React.ReactNode;
  asChild?: boolean;
};

const ResponsiveModalTrigger = ({
  className,
  children,
  asChild,
}: ResponsiveModalTriggerProps) => {
  const { isMobile } = useResponsiveModalContext();
  const Component = isMobile ? DrawerTrigger : DialogTrigger;

  return (
    <Component asChild={asChild} className={className}>
      {children}
    </Component>
  );
};

type ResponsiveModalCloseProps = {
  className?: string;
  children?: React.ReactNode;
  asChild?: boolean;
};

const ResponsiveModalClose = ({
  className,
  children,
  asChild,
}: ResponsiveModalCloseProps) => {
  const { isMobile } = useResponsiveModalContext();
  const Component = isMobile ? DrawerClose : DialogClose;

  return (
    <Component asChild={asChild} className={className}>
      {children}
    </Component>
  );
};

type ResponsiveModalContentProps = {
  children: React.ReactNode;
  className?: string;
};

const ResponsiveModalContent = ({
  className,
  children,
}: ResponsiveModalContentProps) => {
  const { isMobile } = useResponsiveModalContext();

  if (isMobile) {
    return <DrawerContent className={className}>{children}</DrawerContent>;
  }

  return <DialogContent className={className}>{children}</DialogContent>;
};

const ResponsiveModalHeader = ({
  className,
  ...props
}: React.ComponentProps<'div'>) => {
  const { isMobile } = useResponsiveModalContext();
  const Component = isMobile ? DrawerHeader : DialogHeader;

  return <Component className={className} {...props} />;
};

type ResponsiveModalTitleProps = {
  className?: string;
  children: React.ReactNode;
};

const ResponsiveModalTitle = ({
  className,
  children,
}: ResponsiveModalTitleProps) => {
  const { isMobile } = useResponsiveModalContext();
  const Component = isMobile ? DrawerTitle : DialogTitle;

  return <Component className={className}>{children}</Component>;
};

type ResponsiveModalDescriptionProps = {
  className?: string;
  children: React.ReactNode;
};

const ResponsiveModalDescription = ({
  className,
  children,
}: ResponsiveModalDescriptionProps) => {
  const { isMobile } = useResponsiveModalContext();
  const Component = isMobile ? DrawerDescription : DialogDescription;

  return <Component className={className}>{children}</Component>;
};

const ResponsiveModalBody = ({
  className,
  ...props
}: React.ComponentProps<'div'>) => {
  return <div className={cn('p-4 pt-0', className)} {...props} />;
};

const ResponsiveModalFooter = ({
  className,
  ...props
}: React.ComponentProps<'div'>) => {
  const { isMobile } = useResponsiveModalContext();
  const Component = isMobile ? DrawerFooter : DialogFooter;
  return <Component className={className} {...props} />;
};

export {
  ResponsiveModal,
  ResponsiveModalTrigger,
  ResponsiveModalClose,
  ResponsiveModalContent,
  ResponsiveModalDescription,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
  ResponsiveModalBody,
  ResponsiveModalFooter,
};
