import { Rocket } from 'lucide-react';
import WifiSettingsDialog from '@/components/wifi/WifiSettingsDialog';
import ThemeToggle from '@/components/layout/ThemeToggle';

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
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
