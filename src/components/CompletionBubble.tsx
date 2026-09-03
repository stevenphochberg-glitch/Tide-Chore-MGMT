import React, { useState } from 'react';
import { Check } from 'lucide-react';
import type { TaskOwner, TaskStatus } from '../types';
import { useFlowSettings } from '../context/FlowSettingsContext';

interface CompletionBubbleProps {
  owner: TaskOwner;
  status: TaskStatus;
  completedBy?: TaskOwner | null;
  onToggle: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  gamificationOverride?: boolean;
}

export const CompletionBubble: React.FC<CompletionBubbleProps> = ({
  owner,
  status,
  completedBy,
  onToggle,
  size = 'md',
  className = '',
  disabled = false,
  gamificationOverride,
}) => {
  const { flowGamification } = useFlowSettings();
  const isGamified = gamificationOverride !== undefined ? gamificationOverride : flowGamification;

  const [isRippling, setIsRippling] = useState(false);
  const isDone = status === 'done';

  // Sizing dimensions
  const sizeClasses = {
    sm: 'w-4 h-4 text-[10px]',
    md: 'w-5 h-5 text-xs',
    lg: 'w-6 h-6 text-sm',
  }[size];

  const checkIconSizes = {
    sm: 'w-2.5 h-2.5 stroke-[3]',
    md: 'w-3.5 h-3.5 stroke-[3]',
    lg: 'w-4 h-4 stroke-[3]',
  }[size];

  const executor = completedBy || owner;

  // Colors per specification:
  // Steve: Sea Green (#2D6A4F)
  // Nicole: Light Pink (#FFB3C1)
  // Shared: Sand/Beige (#D2B48C)
  const getColors = () => {
    switch (executor) {
      case 'steve':
        return {
          fill: '#2D6A4F',
          border: '#2D6A4F',
          text: '#ffffff',
          ripple: 'rgba(45, 106, 79, 0.4)',
        };
      case 'nicole':
        return {
          fill: '#FFB3C1',
          border: '#FFB3C1',
          text: '#701a2f',
          ripple: 'rgba(255, 179, 193, 0.5)',
        };
      case 'shared':
      default:
        return {
          fill: '#D2B48C',
          border: '#D2B48C',
          text: '#442c13',
          ripple: 'rgba(210, 180, 140, 0.5)',
        };
    }
  };

  const colors = getColors();

  // Handle tap with haptic and micro-animation
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;

    if (isGamified) {
      // 1. Haptic feedback on supported mobile/touch devices
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          // Tactile oceanic pulse: light tap, brief pause, rolling wave tap
          navigator.vibrate([15, 30, 25]);
        } catch {
          // Safe ignore if vibration is blocked
        }
      }

      // 2. Trigger micro-animation ripple
      setIsRippling(true);
      setTimeout(() => setIsRippling(false), 600);
    }

    onToggle();
  };

  // Base outline style when uncompleted
  const getOutlineStyle = () => {
    switch (owner) {
      case 'steve':
        return 'border-2 border-[#2D6A4F] text-[#2D6A4F] bg-transparent hover:bg-[#2D6A4F]/15 focus:ring-[#2D6A4F]/30';
      case 'nicole':
        return 'border-2 border-[#FFB3C1] dark:border-[#f48fb1] text-[#c04e6c] bg-transparent hover:bg-[#FFB3C1]/25 focus:ring-[#FFB3C1]/40';
      case 'shared':
      default:
        return 'border-2 border-[#D2B48C] dark:border-[#c49a6c] text-[#966b36] bg-transparent hover:bg-[#D2B48C]/25 focus:ring-[#D2B48C]/40';
    }
  };

  const getOwnerLabel = (o: TaskOwner) => {
    if (o === 'steve') return 'Steve';
    if (o === 'nicole') return 'Nicole';
    return 'Shared';
  };

  const tooltip = isDone
    ? `Completed by ${getOwnerLabel(executor)} — click to undo`
    : `Assigned to ${getOwnerLabel(owner)} — click to mark complete`;

  // WHEN GAMIFICATION IS OFF: Standard, instant color-fill (minimalist checklist)
  if (!isGamified) {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        title={tooltip}
        aria-label={tooltip}
        className={`rounded-full flex items-center justify-center shrink-0 focus:outline-hidden focus:ring-1 ${sizeClasses} ${
          isDone
            ? 'shadow-none'
            : getOutlineStyle()
        } ${className}`}
        style={
          isDone
            ? {
                backgroundColor: colors.fill,
                borderColor: colors.border,
                borderWidth: '2px',
                borderStyle: 'solid',
                color: colors.text,
              }
            : undefined
        }
      >
        {isDone && <Check className={checkIconSizes} />}
      </button>
    );
  }

  // WHEN GAMIFICATION IS ON: Fluid, liquid-filling micro-animation & haptics
  return (
    <div className="relative inline-flex items-center justify-center shrink-0 select-none">
      {/* Expanding oceanic ripple ring on completion tap */}
      {isRippling && (
        <span
          className="absolute inset-0 rounded-full animate-oceanic-ripple pointer-events-none"
          style={{ backgroundColor: colors.ripple }}
        />
      )}

      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        title={tooltip}
        aria-label={tooltip}
        className={`relative rounded-full flex items-center justify-center shrink-0 overflow-hidden transition-transform duration-150 active:scale-85 focus:outline-hidden focus:ring-2 ${sizeClasses} ${
          !isDone ? getOutlineStyle() : 'border-2 shadow-xs'
        } ${className}`}
        style={
          isDone
            ? {
                borderColor: colors.border,
                color: colors.text,
              }
            : undefined
        }
      >
        {/* Oceanic Liquid-Filling Wave Layer */}
        {isDone && (
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden animate-liquid-rise z-0"
            style={{ backgroundColor: colors.fill }}
          >
            {/* Fluid sinusoidal surface wave crest */}
            <svg
              className="absolute -top-1.5 left-0 w-[200%] h-2.5 opacity-40 animate-liquid-sway pointer-events-none"
              viewBox="0 0 100 20"
              preserveAspectRatio="none"
            >
              <path
                d="M 0 10 Q 25 20 50 10 T 100 10 L 100 20 L 0 20 Z"
                fill="#ffffff"
              />
            </svg>
          </div>
        )}

        {/* Checkmark with fluid pop */}
        {isDone && (
          <span className="relative z-10 animate-checkmark-pop">
            <Check className={checkIconSizes} />
          </span>
        )}
      </button>
    </div>
  );
};
