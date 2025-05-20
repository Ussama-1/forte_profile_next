// Timeline.tsx
import React from 'react';

interface TimelineProps {
  /**
   * Total number of circles to display in the timeline
   */
  count: number;
  /**
   * Index of the circle to highlight (1-based)
   */
  highlight?: number;
  /**
   * Optional className for additional styling
   */
  className?: string;
  /**
   * Primary color for highlighted elements (Tailwind color class without the prefix)
   * Examples: 'blue-600', 'green-500', 'purple-700'
   */
  activeColor?: string;
  /**
   * Background color for non-highlighted elements (Tailwind color class without the prefix)
   * Examples: 'gray-300', 'slate-200', 'neutral-300'
   */
  inactiveColor?: string;
  /**
   * Text color for highlighted elements (Tailwind color class without prefix)
   */
  activeTextColor?: string;
  /**
   * Text color for non-highlighted elements (Tailwind color class without prefix)
   */
  inactiveTextColor?: string;
}

const Timeline: React.FC<TimelineProps> = ({ 
  count, 
  highlight = 0, 
  className = '',
  activeColor = 'blue-600',
  inactiveColor = 'gray-300',
  activeTextColor = 'white',
  inactiveTextColor = 'gray-500'
}) => {
  // Ensure count is positive and highlight is within valid range
  const circleCount = Math.max(1, count);
  const highlightIndex = Math.min(Math.max(0, highlight), circleCount);

  return (
    <div className={`w-full flex flex-wrap items-center mb-4 ${className}`}>
      {Array.from({ length: circleCount }).map((_, index) => {
        const position = index + 1;
        const isHighlighted = position <= highlightIndex;
        const isLast = position === circleCount;
        
        // Dynamic styles based on props
        const circleBgClass = isHighlighted ? `bg-${activeColor}` : 'bg-white';
        const circleBorderClass = isHighlighted ? `border-${activeColor}` : `border-${inactiveColor}`;
        const circleTextClass = isHighlighted ? `text-${activeTextColor}` : `text-${inactiveTextColor}`;
        const lineClass = index < highlightIndex - 1 ? `bg-${activeColor}` : `bg-${inactiveColor}`;
        
        return (
          <React.Fragment key={position}>
            {/* Circle with number */}
            <div className="flex flex-col items-center">
              <div 
                className={`
                  flex items-center justify-center
                  w-8 h-8 md:w-10 md:h-10 rounded-full
                  border-2 font-semibold text-base md:text-lg
                  ${circleBgClass} ${circleBorderClass} ${circleTextClass}
                  transition-all duration-300
                `}
              >
                {position}
              </div>
            </div>
            
            {/* Connecting line (except after the last circle) */}
            {!isLast && (
              <div className="flex-1 h-1 mx-1 md:mx-2 min-w-8">
                <div 
                  className={`
                    h-full rounded-full
                    ${lineClass}
                    transition-all duration-300
                  `}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default Timeline;