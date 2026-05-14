import React, { useEffect } from 'react';

export default function CopyrightProtection({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Disable right-click for the entire application to deter casual scraping
    const handleContextMenu = (e: MouseEvent) => {
      // Allow right click only on inputs if needed, otherwise block
      const target = e.target as HTMLElement;
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
    };

    // Disable common dev-tool shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
        (e.ctrlKey && e.key === 'U')
      ) {
        // e.preventDefault(); // Optional: Usually annoying for devs but good for "locked down" prod apps
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="select-none cursor-default">
      {children}
    </div>
  );
}
