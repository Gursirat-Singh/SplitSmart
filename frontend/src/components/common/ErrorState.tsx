import React from 'react';
import { LuInfo } from 'react-icons/lu';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Something went wrong. Please try again.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 bg-error-light/5 border border-error/20 rounded-2xl max-w-lg mx-auto my-6 animate-fadeIn">
      <div className="bg-error-light p-3.5 rounded-full text-error mb-4 text-2xl">
        <LuInfo />
      </div>
      <h3 className="text-lg font-bold text-error mb-2">Error Loading Data</h3>
      <p className="text-sm text-outline mb-6 leading-relaxed max-w-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-error hover:bg-error/90 text-white font-semibold px-4 py-2 rounded-lg text-sm btn-transition cursor-pointer"
        >
          Retry Request
        </button>
      )}
    </div>
  );
};
