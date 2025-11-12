import React from 'react';

export default function ShieldUser({ className = 'w-4 h-4', strokeWidth = 2, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Shield outline */}
      <path d="M12 2l7 3v5c0 5-3.8 9.7-7 11-3.2-1.3-7-6-7-11V5l7-3z" />
      {/* Head (filled to appear bolder) */}
      <circle cx="12" cy="9.5" r="2" fill="currentColor" stroke="none" />
      {/* Shoulders (thicker stroke for weight) */}
      <path d="M8 16c1.3-1 3-1 4-1s2.7 0 4 1" />
    </svg>
  );
}
