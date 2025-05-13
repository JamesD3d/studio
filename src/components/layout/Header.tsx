import { Rocket, Cog } from 'lucide-react'; // Changed Wifi to Cog for MotorPinConfig
import WifiSettingsDialog from '@/components/wifi/WifiSettingsDialog';
import ThemeToggle from '@/components/layout/ThemeToggle';
import MotorPinConfigDialog from '@/components/motor-pin-config/MotorPinConfigDialog'; // Import the new dialog

export default function Header() {
  return (
    <header className="bg-card shadow-lg border-b border-border sticky top-0 z-50">
      <div className="container mx-auto p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Rocket className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">RoverCam</h1>
        </div>
        <div className="flex items-center gap-2">
          <WifiSettingsDialog />
          <MotorPinConfigDialog /> {/* Add the new dialog trigger */}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
