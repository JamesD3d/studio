"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { BatteryFull, BatteryMedium, BatteryLow, BatteryWarningIcon, Zap } from 'lucide-react'; // Renamed BatteryWarning to BatteryWarningIcon to avoid conflict

export default function BatteryMonitor() {
  const [batteryVoltage, setBatteryVoltage] = useState(8.4); // Start with a full 2S LiPo
  const [batteryPercentage, setBatteryPercentage] = useState(100);

  useEffect(() => {
    const interval = setInterval(() => {
      setBatteryVoltage(prev => {
        // Simulate voltage drop, more pronounced if percentage is high
        const drop = batteryPercentage > 10 ? Math.random() * 0.05 + 0.02 : Math.random() * 0.02;
        const newVal = prev - drop;
        return Math.max(5.8, newVal); // Min voltage before it's "critically low"
      });
    }, 3000); // Update every 3 seconds
    return () => clearInterval(interval);
  }, [batteryPercentage]); // Re-evaluate drop rate based on current percentage

  useEffect(() => {
    const maxVoltage = 8.4; // Max voltage for a 2S LiPo
    const minVoltage = 6.0; // Min safe voltage for a 2S LiPo
    const percentage = Math.max(0, Math.min(100, ((batteryVoltage - minVoltage) / (maxVoltage - minVoltage)) * 100));
    setBatteryPercentage(Math.round(percentage));
  }, [batteryVoltage]);

  const BatteryStatusIcon = () => {
    if (batteryPercentage > 75) return <BatteryFull className="h-7 w-7 text-green-500" aria-label="Battery full" />;
    if (batteryPercentage > 40) return <BatteryMedium className="h-7 w-7 text-yellow-500" aria-label="Battery medium" />;
    if (batteryPercentage > 10) return <BatteryLow className="h-7 w-7 text-orange-500" aria-label="Battery low" />;
    return <BatteryWarningIcon className="h-7 w-7 text-red-500" aria-label="Battery critically low" />;
  };
  
  // Determine progress bar color based on percentage
  let progressColorClass = "bg-primary"; // Default Teal
  if (batteryPercentage <= 40 && batteryPercentage > 10) {
    progressColorClass = "bg-orange-500";
  } else if (batteryPercentage <= 10) {
    progressColorClass = "bg-red-500";
  }


  return (
    <Card className="shadow-xl rounded-lg">
      <CardHeader className="bg-card/50 border-b border-border">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Zap className="h-6 w-6 text-primary" />
          Battery Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BatteryStatusIcon />
            <span className="text-2xl font-semibold tabular-nums">{batteryPercentage}%</span>
          </div>
          <span className="text-lg text-muted-foreground tabular-nums">{batteryVoltage.toFixed(2)}V</span>
        </div>
        <Progress 
          value={batteryPercentage} 
          aria-label={`Battery level: ${batteryPercentage}%`} 
          className="w-full h-3"
          indicatorClassName={progressColorClass} // Custom prop for indicator color
        />
         {batteryPercentage <= 10 && (
          <p className="text-sm text-red-500 text-center font-medium">Critical battery! Recharge soon.</p>
        )}
      </CardContent>
    </Card>
  );
}
