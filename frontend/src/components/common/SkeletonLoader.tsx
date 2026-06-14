import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rect',
  count = 1,
}) => {
  const getShapeClass = () => {
    switch (variant) {
      case 'circle':
        return 'rounded-full';
      case 'text':
        return 'h-4 rounded w-3/4';
      case 'rect':
      default:
        return 'rounded-xl';
    }
  };

  const skeletons = Array.from({ length: count });

  return (
    <>
      {skeletons.map((_, idx) => (
        <div
          key={idx}
          className={`animate-pulse bg-surface-container-high ${getShapeClass()} ${className}`}
          style={{ minHeight: variant === 'text' ? '1rem' : undefined }}
        />
      ))}
    </>
  );
};
