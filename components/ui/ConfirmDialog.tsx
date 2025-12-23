'use client';

import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'blue' | 'red';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'blue',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel, onConfirm]);

  // Focus management - focus cancel button when dialog opens
  useEffect(() => {
    if (isOpen && cancelButtonRef.current) {
      cancelButtonRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const confirmButtonClasses = confirmColor === 'red'
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-indigo-600 hover:bg-indigo-700 text-white';

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby="dialog-description"
      onClick={(e) => {
        // Close when clicking backdrop
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start space-x-4">
            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
              confirmColor === 'red' ? 'bg-red-100' : 'bg-blue-100'
            }`}>
              <AlertTriangle
                className={`w-6 h-6 ${
                  confirmColor === 'red' ? 'text-red-600' : 'text-indigo-600'
                }`}
                aria-hidden="true"
              />
            </div>
            <div className="flex-1">
              <h3 id="dialog-title" className="text-lg font-semibold text-gray-900 mb-2">
                {title}
              </h3>
              <p id="dialog-description" className="text-sm text-gray-600">
                {message}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3">
          <button
            ref={cancelButtonRef}
            onClick={onCancel}
            aria-label={cancelText}
            className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {cancelText}
          </button>
          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            aria-label={confirmText}
            className={`px-4 py-2 rounded-lg transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${confirmButtonClasses}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
