"use client";
import type { ComponentPropsWithoutRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUp, ArrowDown, RotateCcw, RotateCw, HandMetal, Gamepad2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from "@/hooks/use-toast";


type ControlAction = "forward" | "backward" | "turn_left" | "turn_right" | "stop";

interface ControlButtonProps extends ComponentPropsWithoutRef<typeof Button> {
  action: ControlAction;
  icon: React.ElementType;
  label: string;
}

const ControlButton = ({ action, icon: Icon, label, className, ...props }: ControlButtonProps) => {
  const { toast } = useToast();

  const handleClick = () => {
    console.log(`Rover action: ${action}`);
    toast({
      title: "Rover Control",
      description: `Command sent: ${label}`,
    });
    // In a real application, this would send a command to the rover
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

export default function ControlPanel() {
  return (
    <Card className="shadow-xl rounded-lg">
      <CardHeader className="bg-card/50 border-b border-border">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Gamepad2 className="h-6 w-6 text-primary" />
          Control Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4 py-6">
        <div className="grid grid-cols-3 gap-3 md:gap-4 justify-items-center items-center">
          <div /> 
          <ControlButton action="forward" icon={ArrowUp} label="Forward" />
          <div /> 

          <ControlButton action="turn_left" icon={RotateCcw} label="Turn Left" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"/>
          <ControlButton action="stop" icon={HandMetal} label="Stop" variant="destructive" className="h-24 w-24 md:h-28 md:w-28" />
          <ControlButton action="turn_right" icon={RotateCw} label="Turn Right" className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"/>

          <div /> 
          <ControlButton action="backward" icon={ArrowDown} label="Backward" />
          <div /> 
        </div>
      </CardContent>
    </Card>
  );
}
