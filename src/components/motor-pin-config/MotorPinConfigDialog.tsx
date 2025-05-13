
"use client";

import type { FormEvent } from 'react';
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Cog, Loader2, Save } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const L298N_PINS = ["IN1", "IN2", "IN3", "IN4"] as const;
type L298NPin = typeof L298N_PINS[number];

const AVAILABLE_GPIO_PINS: string[] = Array.from({ length: 34 }, (_, i) => i)
  .filter(pin => ![1, 3, 6, 7, 8, 9, 10, 11, 20, 24, 28, 29, 30, 31].includes(pin)) // Exclude common problematic pins
  .map(String);


type PinMappings = {
  [key in L298NPin]?: string;
};

export default function MotorPinConfigDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [pinMappings, setPinMappings] = useState<PinMappings>({});
  const [currentConfiguredPins, setCurrentConfiguredPins] = useState<PinMappings>({});

  useEffect(() => {
    // In a real app, load saved mappings from ESP32 or local storage
    // For now, using empty initial state.
    // Example of loading defaults:
    // const saved = localStorage.getItem('motorPinMappings');
    // if (saved) {
    //   const parsed = JSON.parse(saved);
    //   setPinMappings(parsed);
    //   setCurrentConfiguredPins(parsed);
    // }
  }, []);

  const handlePinChange = (l298nPin: L298NPin, gpioPin: string) => {
    setPinMappings(prev => ({ ...prev, [l298nPin]: gpioPin }));
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      // Reset to current saved config when opening, or clear if no saved config
      setPinMappings(currentConfiguredPins);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validation: Check if all pins are mapped
    const allPinsMapped = L298N_PINS.every(pin => pinMappings[pin] && pinMappings[pin] !== '');
    if (!allPinsMapped) {
      toast({
        variant: "destructive",
        title: "Incomplete Configuration",
        description: "Please map all L298N INx pins to a GPIO.",
      });
      setIsLoading(false);
      return;
    }

    // Validation: Check for duplicate GPIO assignments
    const selectedGpios = Object.values(pinMappings);
    const uniqueGpios = new Set(selectedGpios);
    if (selectedGpios.length !== uniqueGpios.size) {
      toast({
        variant: "destructive",
        title: "Duplicate GPIO Assignment",
        description: "Each L298N INx pin must be mapped to a unique GPIO.",
      });
      setIsLoading(false);
      return;
    }

    console.log("Saving motor pin configuration:", pinMappings);
    // Simulate API call to ESP32
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Assume success
    setCurrentConfiguredPins(pinMappings);
    // localStorage.setItem('motorPinMappings', JSON.stringify(pinMappings)); // Example of saving
    
    toast({
      title: "Motor Pin Configuration Saved",
      description: "Pin mappings have been updated.",
    });
    setIsLoading(false);
    setIsOpen(false);
  };

  const renderCurrentConfig = () => {
    const entries = Object.entries(currentConfiguredPins);
    if (entries.length === 0) {
      return "Not configured.";
    }
    return entries.map(([l298n, gpio]) => `${l298n}: GPIO${gpio}`).join(', ');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9">
          <Cog className="h-5 w-5" />
          <span className="sr-only">Motor Pin Configuration</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cog className="h-6 w-6 text-primary" />
            Motor Pin Configuration (L298N)
          </DialogTitle>
          <DialogDescription>
            Map L298N motor driver INx pins to ESP32 GPIO pins.
            <br />
            Current: <span className="font-semibold text-foreground">{renderCurrentConfig()}</span>
          </DialogDescription>
        </DialogHeader>
        
        <Separator className="my-4"/>

        <form onSubmit={handleSubmit} className="space-y-4">
          {L298N_PINS.map((l298nPin) => (
            <div key={l298nPin} className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor={`select-${l298nPin}`} className="col-span-1 text-right">
                {l298nPin}
              </Label>
              <div className="col-span-2">
                <Select
                  onValueChange={(value) => handlePinChange(l298nPin, value)}
                  value={pinMappings[l298nPin] || ""}
                  disabled={isLoading}
                >
                  <SelectTrigger id={`select-${l298nPin}`}>
                    <SelectValue placeholder="Select GPIO Pin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=""><em>Unassigned</em></SelectItem>
                    {AVAILABLE_GPIO_PINS.map((gpio) => (
                      <SelectItem key={gpio} value={gpio}>
                        GPIO {gpio}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Configuration
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
