
"use client";

import { useState } from 'react';
import { Rocket, Cog } from 'lucide-react'; 
import WifiSettingsDialog from '@/components/wifi/WifiSettingsDialog';
import type { WifiSettingsDialogProps } from '@/components/wifi/WifiSettingsDialog'; // Import props type
import ThemeToggle from '@/components/layout/ThemeToggle';
import MotorPinConfigDialog from '@/components/motor-pin-config/MotorPinConfigDialog'; 

export default function Header() {
  const [roverIp, setRoverIp] = useState<string>("N/A");

  const handleIpChange: WifiSettingsDialogProps['onIpChange'] = (ip) => {
    setRoverIp(ip);
  };

  return (
    <header className="bg-card shadow-lg border-b border-border sticky top-0 z-50">
      <div className="container mx-auto p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Rocket className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">RoverCam</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground mr-3">Rover IP: {roverIp}</span>
          <WifiSettingsDialog onIpChange={handleIpChange} />
          <MotorPinConfigDialog /> 
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
