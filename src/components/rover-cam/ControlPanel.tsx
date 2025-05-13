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

type ControlAction = "forward" | "backward" | "turn_left" | "turn_right" | "stop";

interface ControlButtonProps extends ComponentPropsWithoutRef<typeof Button> {
  action: ControlAction;
  icon: React.ElementType;
  label: string;
  onAction: (action: ControlAction, label: string) => void;
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

interface ControlsProps {
  sendRoverCommand: (action: ControlAction, label: string) => void;
}

const DesktopControls: React.FC<ControlsProps> = ({ sendRoverCommand }) => {
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
          action = "stop";
          label = "Stop";
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
      <ControlButton action="stop" icon={HandMetal} label="Stop" onAction={sendRoverCommand} variant="destructive" className="h-24 w-24 md:h-28 md:w-28" />
      <ControlButton action="turn_right" icon={RotateCw} label="Turn Right" onAction={sendRoverCommand} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground" />

      <div />
      <ControlButton action="backward" icon={ArrowDown} label="Backward" onAction={sendRoverCommand} />
      <div />
    </div>
  );
};

const MobileControls: React.FC<ControlsProps> = ({ sendRoverCommand }) => {
  // Mobile controls will now use buttons, similar to desktop but perhaps with a different layout
  return (
    <div className="flex flex-col items-center w-full space-y-6">
      <Alert>
        <Gamepad2 className="h-4 w-4" />
        <AlertTitle>Button Controls</AlertTitle>
        <AlertDescription>
          Tap the buttons to control the rover.
        </AlertDescription>
      </Alert>
      <div className="grid grid-cols-3 gap-3 justify-items-center items-center w-full max-w-xs">
        <div />
        <ControlButton action="forward" icon={ArrowUp} label="Forward" onAction={sendRoverCommand} className="h-16 w-16" />
        <div />

        <ControlButton action="turn_left" icon={RotateCcw} label="L" onAction={sendRoverCommand} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground h-16 w-16" />
        <ControlButton action="stop" icon={HandMetal} label="Stop" onAction={sendRoverCommand} variant="destructive" className="h-20 w-20" />
        <ControlButton action="turn_right" icon={RotateCw} label="R" onAction={sendRoverCommand} className="bg-secondary hover:bg-secondary/90 text-secondary-foreground h-16 w-16" />

        <div />
        <ControlButton action="backward" icon={ArrowDown} label="Backward" onAction={sendRoverCommand} className="h-16 w-16"/>
        <div />
      </div>
    </div>
  );
};


export default function ControlPanel() {
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const sendRoverCommand = useCallback((action: ControlAction, label: string) => {
    console.log(`Rover action: ${action}`);
    toast({
      title: "Rover Control",
      description: `Command sent: ${label}`,
    });
    // In a real application, this would send a command to the ESP32 rover
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
          <DesktopControls sendRoverCommand={sendRoverCommand} />
        )}
      </CardContent>
    </Card>
  );
}
