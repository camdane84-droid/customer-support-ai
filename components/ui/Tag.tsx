import { X } from 'lucide-react';
import type { Tag as TagType } from '@/lib/utils/auto-tagging';

interface TagProps {
  tag: TagType;
  onRemove?: () => void;
  size?: 'sm' | 'md';
}

export default function Tag({ tag, onRemove, size = 'md' }: TagProps) {
  const sizeClasses = size === 'sm'
    ? 'text-xs px-2 py-0.5'
    : 'text-sm px-2.5 py-1';

  return (
    <span
      className={`
        inline-flex items-center rounded-full border font-medium
        ${tag.color}
        ${sizeClasses}
      `}
    >
      {tag.label}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:bg-black hover:bg-opacity-10 rounded-full p-0.5 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}
