
"use client";

import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { HandMetal, Gamepad2, MoveVertical, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { ControlAction } from '@/types/rover';
import { useIsMobile } from '@/hooks/use-mobile';
import { Skeleton } from '@/components/ui/skeleton';

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
    let y = (relativeY / bounds.height) * 2 - 1; 
    y = Math.max(-1, Math.min(1, y)); 

    const invertedY = -y; 
    onMove(invertedY);

    // Calculate knob position based on invertedY for intuitive visual feedback
    // invertedY = 1 (forward) => knob at top (0%)
    // invertedY = -1 (backward) => knob at bottom (100%)
    // invertedY = 0 (neutral) => knob at middle (50%)
    const knobPositionPercent = (1 - invertedY) / 2 * 100;
    knobRef.current.style.top = `${knobPositionPercent}%`;

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
      knobRef.current.style.top = '50%'; 
    }
  };

  const onMouseDownJoystick = (e: ReactMouseEvent<HTMLDivElement>) => handleInteractionStart(e.clientY);
  const onMouseMoveDocument = (e: MouseEvent) => handleInteractionMove(e.clientY);
  const onMouseUpDocument = () => handleInteractionEnd();

  const onTouchStartJoystick = (e: ReactTouchEvent<HTMLDivElement>) => handleInteractionStart(e.touches[0].clientY);
  const onTouchMoveDocument = (e: TouchEvent) => handleInteractionMove(e.touches[0].clientY);
  const onTouchEndDocument = () => handleInteractionEnd();

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', onMouseMoveDocument);
      document.addEventListener('mouseup', onMouseUpDocument);
      document.addEventListener('touchmove', onTouchMoveDocument, { passive: false });
      document.addEventListener('touchend', onTouchEndDocument);
    } else {
      document.removeEventListener('mousemove', onMouseMoveDocument);
      document.removeEventListener('mouseup', onMouseUpDocument);
      document.removeEventListener('touchmove', onTouchMoveDocument);
      document.removeEventListener('touchend', onTouchEndDocument);
    }
    return () => {
      document.removeEventListener('mousemove', onMouseMoveDocument);
      document.removeEventListener('mouseup', onMouseUpDocument);
      document.removeEventListener('touchmove', onTouchMoveDocument);
      document.removeEventListener('touchend', onTouchEndDocument);
    };
  }, [isDragging, onMouseMoveDocument, onMouseUpDocument, onTouchMoveDocument, onTouchEndDocument]);


  return (
    <div className="flex flex-col items-center space-y-2 w-full max-w-[120px]">
      <Label htmlFor={`joystick-${label.toLowerCase().replace(' ', '-')}`} className="text-center block font-medium text-md">
        {label}: {Math.round(currentSpeed)}%
      </Label>
      <div
        ref={trackRef}
        id={`joystick-${label.toLowerCase().replace(' ', '-')}`}
        className="relative w-12 h-48 bg-muted rounded-full cursor-grab active:cursor-grabbing select-none touch-none shadow-inner"
        onMouseDown={onMouseDownJoystick}
        onTouchStart={onTouchStartJoystick}
      >
        <div
          ref={knobRef}
          className="absolute w-10 h-10 bg-primary rounded-full left-1/2 transform -translate-x-1/2 -translate-y-1/2 shadow-md border-2 border-primary-foreground/50"
          style={{ top: '50%' }} 
        >
            <MoveVertical className="w-full h-full p-2 text-primary-foreground" />
        </div>
      </div>
    </div>
  );
};


export default function ControlPanel() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [leftMotorSpeed, setLeftMotorSpeed] = useState(0); 
  const [rightMotorSpeed, setRightMotorSpeed] = useState(0);
  const [activeDesktopCommand, setActiveDesktopCommand] = useState<ControlAction | null>(null);

  const sendRoverCommand = useCallback((action: ControlAction, label: string, speed?: number) => {
    console.log(`Rover action: ${action} (${label})${speed !== undefined ? ` - Speed: ${speed}%` : ''}`);
    // toast({ 
    //   title: "Rover Control",
    //   description: `Command: ${label}${speed !== undefined ? ` (Speed: ${Math.round(speed)}%)` : ''}`,
    //   duration: 1500,
    // });
  }, []);

  // Mobile Joystick Handlers
  const handleMotorMove = (motor: 'left' | 'right', joystickY: number) => {
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

    if (motor === 'left') setLeftMotorSpeed(speedPercent);
    else setRightMotorSpeed(speedPercent);
    
    sendRoverCommand(action, `${motorLabel}: ${speedPercent > 0 ? 'Fwd' : speedPercent < 0 ? 'Bwd' : 'Stop'} ${Math.abs(speedPercent)}%`, speedPercent);
  };

  const handleMotorRelease = (motor: 'left' | 'right') => {
    const motorLabel = motor === 'left' ? 'L' : 'R';
    const action: ControlAction = motor === 'left' ? 'left_motor_stop' : 'right_motor_stop';
    
    if (motor === 'left') setLeftMotorSpeed(0);
    else setRightMotorSpeed(0);

    sendRoverCommand(action, `${motorLabel} Stop`);
  };

  // Desktop Button/Key Handlers
  const handleDesktopActionStart = (action: ControlAction, label: string) => {
    if (activeDesktopCommand === action) return; 
    sendRoverCommand(action, label);
    setActiveDesktopCommand(action);
  };

  const handleDesktopActionEnd = () => {
    if (activeDesktopCommand === null && (leftMotorSpeed !== 0 || rightMotorSpeed !==0) && !isMobile ) {
       sendRoverCommand("stop_all", "Stop All (Release)");
    } else if (activeDesktopCommand !== null){
       sendRoverCommand("stop_all", "Stop All (Release)");
    }
    setActiveDesktopCommand(null);
    setLeftMotorSpeed(0); 
    setRightMotorSpeed(0);
  };
  
  const handleStopAll = () => {
    sendRoverCommand("stop_all", "Stop All Motors");
    setLeftMotorSpeed(0);
    setRightMotorSpeed(0);
    setActiveDesktopCommand(null);
  };

  useEffect(() => {
    if (isMobile === false) { 
      const handleKeyDown = (event: globalThis.KeyboardEvent) => {
        if (event.repeat) return; 
        let action: ControlAction | null = null;
        let label: string | null = null;

        switch (event.key.toLowerCase()) {
          case 'w': case 'arrowup': action = 'forward'; label = 'Forward'; break;
          case 's': case 'arrowdown': action = 'backward'; label = 'Backward'; break;
          case 'a': case 'arrowleft': action = 'turn_left'; label = 'Turn Left'; break;
          case 'd': case 'arrowright': action = 'turn_right'; label = 'Turn Right'; break;
        }

        if (action && label) {
          event.preventDefault();
          handleDesktopActionStart(action, label);
        }
      };

      const handleKeyUp = (event: globalThis.KeyboardEvent) => {
        const keyMap: Record<string, ControlAction> = {
          'w': 'forward', 'arrowup': 'forward',
          's': 'backward', 'arrowdown': 'backward',
          'a': 'turn_left', 'arrowleft': 'turn_left',
          'd': 'turn_right', 'arrowright': 'turn_right',
        };
        if (keyMap[event.key.toLowerCase()] && activeDesktopCommand) {
           event.preventDefault();
           handleDesktopActionEnd();
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('keyup', handleKeyUp);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        if(activeDesktopCommand) {
            sendRoverCommand("stop_all", "Stop All (Cleanup)");
        }
      };
    }
  }, [isMobile, sendRoverCommand, activeDesktopCommand, handleDesktopActionStart, handleDesktopActionEnd]);


  const renderControls = () => {
    if (isMobile === undefined) {
      return (
        <div className="flex flex-col items-center gap-4 p-8">
          <Skeleton className="h-8 w-3/4" />
          <div className="flex w-full justify-around items-start gap-4">
            <Skeleton className="w-12 h-48 rounded-full" />
            <Skeleton className="w-12 h-48 rounded-full" />
          </div>
          <Skeleton className="h-16 w-40" />
        </div>
      );
    }

    if (isMobile) {
      return (
        <div className="flex flex-col items-center gap-6">
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
        </div>
      );
    }

    // Desktop Controls
    return (
      <div className="flex flex-col items-center gap-4">
        <p className="text-sm text-muted-foreground">Use WASD or Arrow Keys to control</p>
        <div className="grid grid-cols-3 gap-2 w-48">
          <div /> {/* Placeholder for top-left */}
          <Button
            variant="outline"
            className="h-16 w-16 shadow-md hover:shadow-lg"
            onMouseDown={() => handleDesktopActionStart('forward', 'Forward (Button)')}
            onMouseUp={handleDesktopActionEnd}
            onTouchStart={() => handleDesktopActionStart('forward', 'Forward (Button)')}
            onTouchEnd={handleDesktopActionEnd}
            aria-label="Move Forward"
          >
            <ArrowUp className="h-8 w-8" />
          </Button>
          <div /> {/* Placeholder for top-right */}

          <Button
            variant="outline"
            className="h-16 w-16 shadow-md hover:shadow-lg"
            onMouseDown={() => handleDesktopActionStart('turn_left', 'Turn Left (Button)')}
            onMouseUp={handleDesktopActionEnd}
            onTouchStart={() => handleDesktopActionStart('turn_left', 'Turn Left (Button)')}
            onTouchEnd={handleDesktopActionEnd}
            aria-label="Turn Left"
          >
            <ArrowLeft className="h-8 w-8" />
          </Button>
          <Button
            variant="destructive"
            className="h-16 w-16 shadow-md hover:shadow-lg"
            onClick={handleStopAll}
            aria-label="Stop All Motors"
          >
            <HandMetal className="h-8 w-8" />
          </Button>
          <Button
            variant="outline"
            className="h-16 w-16 shadow-md hover:shadow-lg"
            onMouseDown={() => handleDesktopActionStart('turn_right', 'Turn Right (Button)')}
            onMouseUp={handleDesktopActionEnd}
            onTouchStart={() => handleDesktopActionStart('turn_right', 'Turn Right (Button)')}
            onTouchEnd={handleDesktopActionEnd}
            aria-label="Turn Right"
          >
            <ArrowRight className="h-8 w-8" />
          </Button>

          <div /> {/* Placeholder for bottom-left */}
          <Button
            variant="outline"
            className="h-16 w-16 shadow-md hover:shadow-lg"
            onMouseDown={() => handleDesktopActionStart('backward', 'Backward (Button)')}
            onMouseUp={handleDesktopActionEnd}
            onTouchStart={() => handleDesktopActionStart('backward', 'Backward (Button)')}
            onTouchEnd={handleDesktopActionEnd}
            aria-label="Move Backward"
          >
            <ArrowDown className="h-8 w-8" />
          </Button>
          <div /> {/* Placeholder for bottom-right */}
        </div>
      </div>
    );
  };

  return (
    <Card className="shadow-xl rounded-lg">
      <CardHeader className="bg-card/50 border-b border-border">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Gamepad2 className="h-6 w-6 text-primary" />
          Control Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6 py-6 px-4 md:px-6
                          landscape:flex-row landscape:justify-around landscape:py-4 landscape:px-2">
        {renderControls()}
      </CardContent>
    </Card>
  );
}

    