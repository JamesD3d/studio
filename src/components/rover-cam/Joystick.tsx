"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown } from 'lucide-react';

type JoystickProps = {
  motorSide: "left" | "right"; // Used for labeling, but command logic is now direction/speed based
  onCommand: (direction: 'forward' | 'backward' | 'stop', speed: number) => void;
};

const JOYSTICK_SENSITIVITY_THRESHOLD = 0.15; // Percentage of travelDistance to trigger movement

const Joystick: React.FC<JoystickProps> = ({ motorSide, onCommand }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [knobPosition, setKnobPosition] = useState({ y: 0 }); // y relative to center, positive is down
  const baseRef = useRef<HTMLDivElement>(null);
  
  const [currentSentDirectionAndSpeed, setCurrentSentDirectionAndSpeed] = useState<{ direction: 'forward' | 'backward' | 'stop', speed: number } | null>(null);

  const baseSize = 100; // px
  const knobSize = 40; // px
  const travelDistance = (baseSize - knobSize) / 2; // Max distance from center

  const handleInteractionStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    if ('touches' in e) {
      e.preventDefault(); // Prevent scrolling on touch devices
    }
  }, []);

  const handleInteractionMove = useCallback((clientY: number) => {
    if (!isDragging || !baseRef.current) return;

    const baseRect = baseRef.current.getBoundingClientRect();
    const baseYCenter = baseRect.top + baseRect.height / 2;
    
    let deltaY = clientY - baseYCenter;
    // Constrain movement vertically
    deltaY = Math.max(-travelDistance, Math.min(travelDistance, deltaY));
    
    setKnobPosition({ y: deltaY });

    let direction: 'forward' | 'backward' | 'stop';
    // Speed is calculated as a percentage (0-100) of maximum travel
    // deltaY is negative for up (forward), positive for down (backward)
    let currentSpeed = Math.round(Math.abs(deltaY / travelDistance) * 100);
    currentSpeed = Math.min(100, Math.max(0, currentSpeed)); // Clamp between 0 and 100

    // Determine direction based on knob position (deltaY)
    // Inverted Y: negative deltaY is up (forward), positive deltaY is down (backward)
    if (deltaY < -travelDistance * JOYSTICK_SENSITIVITY_THRESHOLD) { // Moved significantly forward
      direction = 'forward';
    } else if (deltaY > travelDistance * JOYSTICK_SENSITIVITY_THRESHOLD) { // Moved significantly backward
      direction = 'backward';
    } else { // Near center, consider it a stop
      direction = 'stop';
      currentSpeed = 0; // Ensure speed is 0 when stopping
    }
    
    if (direction !== currentSentDirectionAndSpeed?.direction || currentSpeed !== currentSentDirectionAndSpeed?.speed) {
      onCommand(direction, currentSpeed);
      setCurrentSentDirectionAndSpeed({ direction, speed: currentSpeed });
    }
  }, [isDragging, travelDistance, onCommand, currentSentDirectionAndSpeed]);

  const handleInteractionEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    setKnobPosition({ y: 0 }); // Reset knob to center
    
    if (currentSentDirectionAndSpeed?.direction !== 'stop' || currentSentDirectionAndSpeed?.speed !== 0) {
        onCommand('stop', 0); // Send stop command with 0 speed
        setCurrentSentDirectionAndSpeed({ direction: 'stop', speed: 0 });
    }
  }, [isDragging, onCommand, currentSentDirectionAndSpeed]);
  
  useEffect(() => {
    const moveHandler = (e: MouseEvent) => handleInteractionMove(e.clientY);
    const touchMoveHandler = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleInteractionMove(e.touches[0].clientY);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', moveHandler);
      window.addEventListener('mouseup', handleInteractionEnd);
      window.addEventListener('touchmove', touchMoveHandler, { passive: false });
      window.addEventListener('touchend', handleInteractionEnd);
    }
    return () => {
      window.removeEventListener('mousemove', moveHandler);
      window.removeEventListener('mouseup', handleInteractionEnd);
      window.removeEventListener('touchmove', touchMoveHandler);
      window.removeEventListener('touchend', handleInteractionEnd);
    };
  }, [isDragging, handleInteractionMove, handleInteractionEnd]);

  return (
    <div className="flex flex-col items-center space-y-1 select-none">
      <div
        ref={baseRef}
        className={cn(
          "relative rounded-full bg-card/60 flex items-center justify-center border-2 border-primary/30",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        style={{ width: `${baseSize}px`, height: `${baseSize}px` }}
        onMouseDown={handleInteractionStart}
        onTouchStart={handleInteractionStart}
      >
        <ChevronUp className="absolute top-1 text-muted-foreground opacity-60 h-5 w-5" />
        <div
          className="absolute rounded-full bg-primary shadow-lg flex items-center justify-center text-primary-foreground"
          style={{
            width: `${knobSize}px`,
            height: `${knobSize}px`,
            transform: `translateY(${knobPosition.y}px)`,
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          }}
        >
          {/* Optional: Icon inside knob if needed */}
        </div>
        <ChevronDown className="absolute bottom-1 text-muted-foreground opacity-60 h-5 w-5" />
      </div>
       <p className="text-xs font-medium text-muted-foreground mt-1">
        {motorSide.charAt(0).toUpperCase() + motorSide.slice(1)}
      </p>
    </div>
  );
};

export default Joystick;
