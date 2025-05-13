
"use client";

import type { ComponentPropsWithoutRef, MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { HandMetal, Gamepad2, MoveVertical } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { ControlAction } from '@/types/rover';
import { cn } from '@/lib/utils';


interface JoystickProps {
  onMove: (y: number) => void; // y is -1 (full backward) to 1 (full forward)
  onRelease: () => void;
  label: string;
  currentSpeed: number; // -100 to 100 for display
}

const Joystick: React.FC<JoystickProps> = ({ onMove, onRelease, label, currentSpeed }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const getTrackBounds = useCallback(() => {
    if (!trackRef.current) return null;
    return trackRef.current.getBoundingClientRect();
  }, []);

  const handleInteractionStart = (clientY: number) => {
    const bounds = getTrackBounds();
    if (!bounds || !knobRef.current) return;
    setIsDragging(true);
    processMove(clientY);
  };

  const processMove = useCallback((clientY: number) => {
    const bounds = getTrackBounds();
    if (!bounds || !knobRef.current) return;

    let relativeY = clientY - bounds.top;
    // Normalize y: -1 for top of track, 0 for center, 1 for bottom of track (DOM coordinates)
    let y = (relativeY / bounds.height) * 2 - 1; 
    y = Math.max(-1, Math.min(1, y)); // Clamp

    // User wants up (DOM top, y = -1) to be positive speed (forward = 1 for onMove)
    // User wants down (DOM bottom, y = 1) to be negative speed (reverse = -1 for onMove)
    // So, invertedY = -y maps DOM coordinates to desired speed direction.
    const invertedY = -y; 
    onMove(invertedY);

    // Position knob:
    // If y = -1 (DOM top, forward), knob style.top should be 0%.
    // If y = 1 (DOM bottom, reverse), knob style.top should be 100%.
    // If y = 0 (DOM center, stop), knob style.top should be 50%.
    // Formula: (y + 1) / 2 * 100%
    knobRef.current.style.top = `${(y + 1) / 2 * 100}%`;

  }, [getTrackBounds, onMove]);


  const handleInteractionMove = (clientY: number) => {
    if (!isDragging) return;
    processMove(clientY);
  };

  const handleInteractionEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    onRelease();
    if (knobRef.current) {
      knobRef.current.style.top = '50%'; // Reset to center
    }
  };

  // Mouse events
  const onMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => handleInteractionStart(e.clientY);
  const onMouseMove = (e: MouseEvent) => handleInteractionMove(e.clientY);
  const onMouseUp = () => handleInteractionEnd();

  // Touch events
  const onTouchStart = (e: ReactTouchEvent<HTMLDivElement>) => handleInteractionStart(e.touches[0].clientY);
  const onTouchMove = (e: TouchEvent) => handleInteractionMove(e.touches[0].clientY);
  const onTouchEnd = () => handleInteractionEnd();

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      document.addEventListener('touchmove', onTouchMove);
      document.addEventListener('touchend', onTouchEnd);
    } else {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    }
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, onMouseMove, onMouseUp, onTouchMove, onTouchEnd]);


  return (
    <div className="flex flex-col items-center space-y-2 w-full max-w-[120px]">
      <Label htmlFor={`joystick-${label.toLowerCase().replace(' ', '-')}`} className="text-center block font-medium text-md">
        {label}: {Math.round(currentSpeed)}%
      </Label>
      <div
        ref={trackRef}
        id={`joystick-${label.toLowerCase().replace(' ', '-')}`}
        className="relative w-12 h-48 bg-muted rounded-full cursor-grab active:cursor-grabbing select-none touch-none shadow-inner"
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        <div
          ref={knobRef}
          className="absolute w-10 h-10 bg-primary rounded-full left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-md border-2 border-primary-foreground/50"
          style={{ top: '50%' }} // Start at center
        >
            <MoveVertical className="w-full h-full p-2 text-primary-foreground" />
        </div>
      </div>
    </div>
  );
};


export default function ControlPanel() {
  const { toast } = useToast();
  const [leftMotorSpeed, setLeftMotorSpeed] = useState(0); // -100 to 100
  const [rightMotorSpeed, setRightMotorSpeed] = useState(0); // -100 to 100

  const sendRoverCommand = useCallback((action: ControlAction, label: string, speed?: number) => {
    console.log(`Rover action: ${action} (${label})${speed !== undefined ? ` - Speed: ${speed}%` : ''}`);
    // toast({
    //   title: "Rover Control",
    //   description: `Command: ${label}${speed !== undefined ? ` (Speed: ${Math.round(speed)}%)` : ''}`,
    //   duration: 1500,
    // });
  }, [toast]);

  const handleMotorMove = (motor: 'left' | 'right', joystickY: number) => {
    // joystickY is already -1 (full backward) to 1 (full forward)
    const speedPercent = Math.round(joystickY * 100);
    let action: ControlAction;
    const motorLabel = motor === 'left' ? 'L' : 'R';

    if (speedPercent > 0) {
      action = motor === 'left' ? 'left_motor_forward' : 'right_motor_forward';
    } else if (speedPercent < 0) {
      action = motor === 'left' ? 'left_motor_backward' : 'right_motor_backward';
    } else {
      action = motor === 'left' ? 'left_motor_stop' : 'right_motor_stop';
    }

    if (motor === 'left') {
      setLeftMotorSpeed(speedPercent);
    } else {
      setRightMotorSpeed(speedPercent);
    }
    // Pass the actual speedPercent (which can be negative) to the command
    sendRoverCommand(action, `${motorLabel} Motor: ${speedPercent}%`, speedPercent);
  };

  const handleMotorRelease = (motor: 'left' | 'right') => {
    const motorLabel = motor === 'left' ? 'L' : 'R';
    const action: ControlAction = motor === 'left' ? 'left_motor_stop' : 'right_motor_stop';
    
    if (motor === 'left') {
      setLeftMotorSpeed(0);
    } else {
      setRightMotorSpeed(0);
    }
    sendRoverCommand(action, `${motorLabel} Motor Stop`);
  };

  const handleStopAll = () => {
    sendRoverCommand("stop_all", "Stop All Motors");
    setLeftMotorSpeed(0);
    setRightMotorSpeed(0);
    // Joysticks will visually reset via their onRelease calling and setting knob style
  };


  return (
    <Card className="shadow-xl rounded-lg">
      <CardHeader className="bg-card/50 border-b border-border">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Gamepad2 className="h-6 w-6 text-primary" />
          Control Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 py-6 px-4 md:px-6">
        <div className="flex w-full justify-around items-start gap-4">
          <Joystick
            label="L"
            onMove={(y) => handleMotorMove('left', y)}
            onRelease={() => handleMotorRelease('left')}
            currentSpeed={leftMotorSpeed}
          />
          <Joystick
            label="R"
            onMove={(y) => handleMotorMove('right', y)}
            onRelease={() => handleMotorRelease('right')}
            currentSpeed={rightMotorSpeed}
          />
        </div>

        <Button
          variant="destructive"
          className="h-16 w-40 p-2 shadow-md hover:shadow-lg transform transition-all active:scale-95 hover:brightness-110 flex flex-col items-center justify-center mt-4 text-base"
          onClick={handleStopAll}
          aria-label="Stop All Motors"
        >
          <HandMetal className="h-7 w-7 mb-1" />
          <span>Stop All</span>
        </Button>
      </CardContent>
    </Card>
  );
}

