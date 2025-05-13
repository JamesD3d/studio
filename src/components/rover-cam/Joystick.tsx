
"use client";

import type { ControlAction } from '@/types/rover';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown } from 'lucide-react';

type JoystickProps = {
  motorSide: "left" | "right";
  onCommand: (action: ControlAction, label: string) => void;
};

const Joystick: React.FC<JoystickProps> = ({ motorSide, onCommand }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [knobPosition, setKnobPosition] = useState({ y: 0 }); // y relative to center, positive is down
  const baseRef = useRef<HTMLDivElement>(null);
  
  // Using a state for currentSentCommand to avoid sending redundant commands
  const [currentSentCommand, setCurrentSentCommand] = useState<ControlAction | null>(null);

  const baseSize = 100; // px, reduced size for better fit
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

    let command: ControlAction | null = null;
    let label = "";
    const motorName = motorSide.charAt(0).toUpperCase() + motorSide.slice(1);

    // Determine command based on knob position (deltaY)
    // Inverted Y: negative deltaY is up (forward), positive deltaY is down (backward)
    if (deltaY < -travelDistance * 0.25) { // Moved significantly forward (threshold reduced)
      command = motorSide === "left" ? "left_motor_forward" : "right_motor_forward";
      label = `${motorName} Motor Forward`;
    } else if (deltaY > travelDistance * 0.25) { // Moved significantly backward
      command = motorSide === "left" ? "left_motor_backward" : "right_motor_backward";
      label = `${motorName} Motor Backward`;
    } else { // Near center, consider it a stop
      command = motorSide === "left" ? "left_motor_stop" : "right_motor_stop";
      label = `${motorName} Motor Stop`;
    }
    
    if (command && command !== currentSentCommand) {
      onCommand(command, label);
      setCurrentSentCommand(command);
    }
  }, [isDragging, travelDistance, motorSide, onCommand, currentSentCommand]);

  const handleInteractionEnd = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    setKnobPosition({ y: 0 }); // Reset knob to center

    const stopCommand = motorSide === "left" ? "left_motor_stop" : "right_motor_stop";
    const stopLabel = `${motorSide.charAt(0).toUpperCase() + motorSide.slice(1)} Motor Stop`;
    
    // Only send stop command if not already stopped or if it's a different stop command
    if (currentSentCommand !== stopCommand) {
        onCommand(stopCommand, stopLabel);
        setCurrentSentCommand(stopCommand);
    }
  }, [isDragging, motorSide, onCommand, currentSentCommand]);
  
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
