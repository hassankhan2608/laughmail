'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const PlusIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    width={24}
    height={24}
    strokeWidth="1.5"
    stroke="currentColor"
    className={`text-foreground size-6 ${className}`}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
  </svg>
);

export const PlusCard: React.FC<{
  className?: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
}> = ({ className = '', title, description, icon }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(
        'relative border border-dashed rounded-lg p-6 bg-background min-h-[200px]',
        'flex flex-col justify-between hover:border-primary/50 transition-all',
        className
      )}
    >
      <PlusIcon className="absolute -top-3 -left-3" />
      <PlusIcon className="absolute -top-3 -right-3" />
      <PlusIcon className="absolute -bottom-3 -left-3" />
      <PlusIcon className="absolute -bottom-3 -right-3" />

      <div className="relative z-10 space-y-3">
        {icon && <div className="text-primary">{icon}</div>}
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </motion.div>
  );
};
