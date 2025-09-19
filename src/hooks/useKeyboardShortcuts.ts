import { useEffect } from 'react';

interface KeyboardShortcutsProps {
  onPlayPause?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onVolumeUp?: () => void;
  onVolumeDown?: () => void;
  onMute?: () => void;
  isEnabled?: boolean;
}

export const useKeyboardShortcuts = ({
  onPlayPause,
  onNext,
  onPrevious,
  onVolumeUp,
  onVolumeDown,
  onMute,
  isEnabled = true
}: KeyboardShortcutsProps) => {
  useEffect(() => {
    if (!isEnabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in input fields
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return;
      }

      // Prevent default behavior for our shortcuts
      const shouldPreventDefault = [
        ' ', // Spacebar
        'ArrowRight',
        'ArrowLeft', 
        'ArrowUp',
        'ArrowDown',
        'm',
        'M'
      ].includes(event.key);

      if (shouldPreventDefault) {
        event.preventDefault();
      }

      switch (event.key) {
        case ' ': // Spacebar for play/pause
          onPlayPause?.();
          break;
        case 'ArrowRight': // Right arrow for next track
          if (event.shiftKey) {
            onNext?.();
          }
          break;
        case 'ArrowLeft': // Left arrow for previous track
          if (event.shiftKey) {
            onPrevious?.();
          }
          break;
        case 'ArrowUp': // Up arrow for volume up
          if (event.shiftKey) {
            onVolumeUp?.();
          }
          break;
        case 'ArrowDown': // Down arrow for volume down
          if (event.shiftKey) {
            onVolumeDown?.();
          }
          break;
        case 'm':
        case 'M': // M for mute/unmute
          onMute?.();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onPlayPause, onNext, onPrevious, onVolumeUp, onVolumeDown, onMute, isEnabled]);
};