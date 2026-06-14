import React from 'react';
import { LuInbox } from 'react-icons/lu';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No data available',
  description = 'There is nothing to display here at the moment.',
  icon,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-surface-card border border-border-subtle rounded-2xl shadow-level-1 animate-fadeIn max-w-lg mx-auto my-6">
      <div className="bg-secondary/10 p-4 rounded-full text-secondary mb-4 text-3xl">
        {icon || <LuInbox />}
      </div>
      <h3 className="text-lg font-bold text-primary mb-1">{title}</h3>
      <p className="text-sm text-outline mb-6 leading-relaxed max-w-sm">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};
