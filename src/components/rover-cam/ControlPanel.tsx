
"use client";

import type { ComponentPropsWithoutRef } from 'react';
import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { HandMetal, Gamepad2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { ControlAction } from '@/types/rover';


export default function ControlPanel() {
  const { toast } = useToast();
  const [leftMotorSpeed, setLeftMotorSpeed] = useState(0);
  const [rightMotorSpeed, setRightMotorSpeed] = useState(0);

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

  const handleMotorSliderChange = (motor: 'left' | 'right', newValue: number) => {
    let action: ControlAction;
    const motorName = motor.charAt(0).toUpperCase() + motor.slice(1);
    const currentSpeed = Math.round(newValue); // Ensure integer value

    if (currentSpeed > 0) {
      action = motor === 'left' ? 'left_motor_forward' : 'right_motor_forward';
    } else if (currentSpeed < 0) {
      action = motor === 'left' ? 'left_motor_backward' : 'right_motor_backward';
    } else {
      action = motor === 'left' ? 'left_motor_stop' : 'right_motor_stop';
    }

    if (motor === 'left') {
      setLeftMotorSpeed(currentSpeed);
    } else {
      setRightMotorSpeed(currentSpeed);
    }
    sendRoverCommand(action, `${motorName} Motor: ${currentSpeed}%`, Math.abs(currentSpeed));
  };

  const handleStopAll = () => {
    sendRoverCommand("stop_all", "Stop All Motors");
    setLeftMotorSpeed(0);
    setRightMotorSpeed(0);
    // The slider components will re-render with these new values.
  };


  return (
    <Card className="shadow-xl rounded-lg">
      <CardHeader className="bg-card/50 border-b border-border">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Gamepad2 className="h-6 w-6 text-primary" />
          Control Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-8 py-6 px-4 md:px-6"> {/* Increased gap & padding */}
        {/* Left Motor Slider */}
        <div className="w-full max-w-xs space-y-3">
          <Label htmlFor="left-motor-slider" className="text-center block font-medium text-lg">
            Left Motor: {leftMotorSpeed}%
          </Label>
          <Slider
            id="left-motor-slider"
            min={-100}
            max={100}
            step={10} // Step by 10 for distinct speed levels
            value={[leftMotorSpeed]}
            onValueChange={(value) => handleMotorSliderChange('left', value[0])}
            className="w-full [&>span:first-child]:h-3 [&>span>span]:h-3 [&>span>span]:bg-primary [&>span:last-child]:h-6 [&>span:last-child]:w-6 [&>span:last-child]:border-2"
            aria-label="Left motor speed control"
          />
        </div>

        {/* Right Motor Slider */}
        <div className="w-full max-w-xs space-y-3">
          <Label htmlFor="right-motor-slider" className="text-center block font-medium text-lg">
            Right Motor: {rightMotorSpeed}%
          </Label>
          <Slider
            id="right-motor-slider"
            min={-100}
            max={100}
            step={10} // Step by 10 for distinct speed levels
            value={[rightMotorSpeed]}
            onValueChange={(value) => handleMotorSliderChange('right', value[0])}
            className="w-full [&>span:first-child]:h-3 [&>span>span]:h-3 [&>span>span]:bg-primary [&>span:last-child]:h-6 [&>span:last-child]:w-6 [&>span:last-child]:border-2"
            aria-label="Right motor speed control"
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
