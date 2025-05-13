import { Rocket, Wifi } from 'lucide-react'; // Add Wifi
import WifiSettingsDialog from '@/components/wifi/WifiSettingsDialog'; // Import the new dialog

export default function Header() {
  return (
    <header className="bg-card shadow-lg border-b border-border sticky top-0 z-50">
      <div className="container mx-auto p-4 flex items-center justify-between"> {/* Changed to justify-between */}
        <div className="flex items-center gap-3"> {/* Grouped title and icon */}
          <Rocket className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">RoverCam</h1>
        </div>
        <WifiSettingsDialog /> {/* Add the dialog trigger here */}
      </div>
    </header>
  );
}
