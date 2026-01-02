'use client';

interface SkeletonLoaderProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle' | 'card';
  width?: string;
  height?: string;
  count?: number;
}

export default function SkeletonLoader({
  className = '',
  variant = 'rect',
  width,
  height,
  count = 1
}: SkeletonLoaderProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'text':
        return 'h-4 rounded';
      case 'circle':
        return 'rounded-full aspect-square';
      case 'card':
        return 'h-32 rounded-lg';
      case 'rect':
      default:
        return 'rounded-lg';
    }
  };

  const style = {
    width: width || (variant === 'circle' ? height : undefined),
    height: height,
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`
            bg-gradient-to-r from-gray-200 via-blue-200 to-gray-200 dark:from-slate-700 dark:via-blue-900 dark:to-slate-700
            animate-shimmer bg-[length:200%_100%]
            ${getVariantClasses()}
            ${className}
          `}
          style={style}
        />
      ))}
    </>
  );
}
