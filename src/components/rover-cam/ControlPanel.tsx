
"use client";

import type { ComponentPropsWithoutRef } from 'react';
import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUp, ArrowDown, RotateCcw, RotateCw, HandMetal, Gamepad2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import type { ControlAction } from '@/types/rover';
import Joystick from './Joystick';

interface ControlButtonProps extends ComponentPropsWithoutRef<typeof Button> {
  action: ControlAction;
  icon: React.ElementType;
  label: string;
  onAction: (action: ControlAction, label: string) => void; // Speed is not relevant for buttons
}

const ControlButton = ({ action, icon: Icon, label, className, onAction, ...props }: ControlButtonProps) => {
  const handleClick = () => {
    onAction(action, label);
  };

  return (
    <Button
      variant="default"
      className={cn(
        "flex flex-col items-center justify-center h-20 w-20 md:h-24 md:w-24 p-2 shadow-md hover:shadow-lg transform transition-all active:scale-95 hover:brightness-110",
        className
      )}
      onClick={handleClick}
      aria-label={label}
      {...props}
    >
      <Icon className="h-8 w-8 md:h-10 md:w-10 mb-1" />
      <span className="text-xs md:text-sm">{label}</span>
    </Button>
  );
};

interface DesktopControlsProps {
  sendRoverCommand: (action: ControlAction, label: string) => void;
}

const DesktopControls: React.FC<DesktopControlsProps> = ({ sendRoverCommand }) => {
  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      let action: ControlAction | null = null;
      let label: string | null = null;

      switch (event.key) {
        case "ArrowUp":
        case "w":
        case "W":
          action = "forward";
          label = "Forward";
          break;
        case "ArrowDown":
        case "s":
        case "S":
          action = "backward";
          label = "Backward";
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          action = "turn_left";
          label = "Turn Left";
          break;
        case "ArrowRight":
        case "d":
        case "D":
          action = "turn_right";
          label = "Turn Right";
          break;
        case " ": // Space bar
          action = "stop_all";
          label = "Stop All";
          break;
      }

      if (action && label) {
        event.preventDefault();
        sendRoverCommand(action, label);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [sendRoverCommand]);

  return (
    <div className="grid grid-cols-3 gap-3 md:gap-4 justify-items-center items-center">
      <div />
      <ControlButton action="forward" icon={ArrowUp} label="Forward" onAction={sendRoverCommand} />
      <div />

      <ControlButton action="turn_left" icon={RotateCcw} label="Turn Left" onAction={sendRoverCommand} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground" />
      <ControlButton action="stop_all" icon={HandMetal} label="Stop" onAction={sendRoverCommand} variant="destructive" className="h-24 w-24 md:h-28 md:w-28" />
      <ControlButton action="turn_right" icon={RotateCw} label="Turn Right" onAction={sendRoverCommand} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground" />

      <div />
      <ControlButton action="backward" icon={ArrowDown} label="Backward" onAction={sendRoverCommand} />
      <div />
    </div>
  );
};

interface MobileControlsProps {
  sendRoverCommand: (action: ControlAction, label: string, speed?: number) => void;
}

const MobileControls: React.FC<MobileControlsProps> = ({ sendRoverCommand }) => {
  const handleJoystickCommand = useCallback((motorSide: "left" | "right", direction: 'forward' | 'backward' | 'stop', speed: number) => {
    let action: ControlAction;
    let label: string;
    const motorName = motorSide.charAt(0).toUpperCase() + motorSide.slice(1);

    if (direction === 'forward') {
      action = motorSide === 'left' ? 'left_motor_forward' : 'right_motor_forward';
      label = `${motorName} Motor Forward`;
    } else if (direction === 'backward') {
      action = motorSide === 'left' ? 'left_motor_backward' : 'right_motor_backward';
      label = `${motorName} Motor Backward`;
    } else { // direction === 'stop'
      action = motorSide === 'left' ? 'left_motor_stop' : 'right_motor_stop';
      label = `${motorName} Motor Stop`;
    }
    sendRoverCommand(action, label, speed);
  }, [sendRoverCommand]);

  return (
    <div className="flex flex-col items-center w-full space-y-4">
      <Alert>
        <Gamepad2 className="h-4 w-4" />
        <AlertTitle>Joystick Controls</AlertTitle>
        <AlertDescription>
          Use joysticks for left/right motors. Speed is variable. Press Stop for all motors.
        </AlertDescription>
      </Alert>
      <div className="flex justify-around w-full max-w-xs items-center px-2">
        <Joystick motorSide="left" onCommand={(dir, spd) => handleJoystickCommand("left", dir, spd)} />
        <Joystick motorSide="right" onCommand={(dir, spd) => handleJoystickCommand("right", dir, spd)} />
      </div>
      <Button
          variant="destructive"
          className="h-16 w-32 p-2 shadow-md hover:shadow-lg transform transition-all active:scale-95 hover:brightness-110 flex flex-col items-center justify-center mt-4"
          onClick={() => sendRoverCommand("stop_all", "Stop All Motors")} // Speed is not applicable for stop_all from button
          aria-label="Stop All Motors"
        >
          <HandMetal className="h-6 w-6 mb-1" />
          <span className="text-xs">Stop All</span>
      </Button>
    </div>
  );
};


export default function ControlPanel() {
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const sendRoverCommand = useCallback((action: ControlAction, label: string, speed?: number) => {
    // Log the command with speed if available
    console.log(`Rover action: ${action} (${label})${speed !== undefined ? ` - Speed: ${speed}%` : ''}`);
    // In a real application, this function would translate 'action' and 'speed'
    // into specific commands for the ESP32 (e.g., using PWM).
    // e.g., if (action === 'left_motor_forward') { sendToEsp32Pwm('motor_left', speed, 'forward'); }
    
    toast({
      title: "Rover Control",
      description: `Command: ${label}${speed !== undefined ? ` (Speed: ${speed}%)` : ''}`,
      duration: 1500, // Shorter duration for control feedback
    });
  }, [toast]);

  if (isMobile === undefined) {
    return (
      <Card className="shadow-xl rounded-lg">
        <CardHeader className="bg-card/50 border-b border-border">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Gamepad2 className="h-6 w-6 text-primary" />
            Control Panel
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-6">
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xl rounded-lg">
      <CardHeader className="bg-card/50 border-b border-border">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Gamepad2 className="h-6 w-6 text-primary" />
          Control Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 py-6">
        {isMobile ? (
          <MobileControls sendRoverCommand={sendRoverCommand} />
        ) : (
          // Desktop controls don't use the speed parameter directly from buttons
          <DesktopControls sendRoverCommand={(act, lbl) => sendRoverCommand(act, lbl)} />
        )}
      </CardContent>
    </Card>
  );
}

