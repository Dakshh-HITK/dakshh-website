import React from 'react';

interface HandDrawnCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Allow overflow for sticky children (e.g. MDEditor toolbar) */
  overflowVisible?: boolean;
}

export default function HandDrawnCard({ children, className = '', style, overflowVisible }: HandDrawnCardProps) {
  return (
    <div className={`hand-drawn-card ${className}`} style={{ ...style, ...(overflowVisible && { overflow: 'visible' }) }}>
      {children}
    </div>
  );
}
