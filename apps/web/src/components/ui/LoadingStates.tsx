import React from 'react';
import { Loader2 } from 'lucide-react';

interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  width = '100%', 
  height = '1rem',
  className = '' 
}) => {
  return (
    <div 
      className={`animate-pulse bg-gradient-to-r from-muted via-muted/50 to-muted rounded ${className}`}
      style={{ width, height }}
    />
  );
};

export const CardSkeleton: React.FC = () => (
  <div className="card p-6 space-y-4">
    <div className="flex items-center space-x-4">
      <Skeleton width="48px" height="48px" className="rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton height="1rem" />
        <Skeleton height="0.75rem" width="60%" />
      </div>
    </div>
    <Skeleton height="3rem" />
    <Skeleton height="3rem" />
  </div>
);

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="card p-6 space-y-4">
    <div className="flex justify-between items-center">
      <Skeleton width="200px" height="1.5rem" />
      <Skeleton width="100px" height="2rem" className="rounded-md" />
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex space-x-4 items-center">
        <Skeleton width="48px" height="48px" className="rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton width="40%" />
          <Skeleton width="60%" height="0.75rem" />
        </div>
        <Skeleton width="80px" height="2rem" className="rounded-md" />
      </div>
    ))}
  </div>
);

export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg', text?: string }> = ({ 
  size = 'md',
  text
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
};

export const InfiniteScrollTrigger: React.FC<{
  onIntersect: () => void;
  isLoading: boolean;
}> = ({ onIntersect, isLoading }) => {
  const observerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          onIntersect();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [isLoading, onIntersect]);

  return <div ref={observerRef} className="h-1" />;
};

