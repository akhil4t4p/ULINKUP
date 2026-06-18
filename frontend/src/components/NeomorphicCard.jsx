import React from 'react';

/**
 * NeomorphicCard - Reusable card container using neomorphic styling.
 * 
 * @param {('convex'|'concave'|'inset'|'flat')} elevation - The neomorphic style.
 * @param {string} className - Additional CSS class names.
 * @param {object} style - Inline styles.
 * @param {React.ReactNode} children - Contents of the card.
 */
export default function NeomorphicCard({ 
  elevation = 'convex', 
  className = '', 
  style = {}, 
  children,
  ...props 
}) {
  const shadowClass = {
    convex: 'neo-convex',
    concave: 'neo-concave',
    inset: 'neo-inset',
    flat: 'neo-flat'
  }[elevation] || 'neo-convex';

  return (
    <div 
      className={`${shadowClass} p-4 ${className}`}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
}
