import Header from "@/components/layout/Header";
import LiveVideoStream from "@/components/rover-cam/LiveVideoStream";
import ControlPanel from "@/components/rover-cam/ControlPanel";
import BatteryMonitor from "@/components/rover-cam/BatteryMonitor";

export default function RoverCamPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Video Stream takes more space on larger screens */}
          <div className="lg:col-span-2">
            <LiveVideoStream />
          </div>

          {/* Controls and Battery Monitor in the sidebar-like column */}
          <div className="flex flex-col gap-6 lg:gap-8">
            <ControlPanel />
            <BatteryMonitor />
          </div>
        </div>
      </main>
      <footer className="text-center p-4 text-muted-foreground text-sm border-t border-border mt-auto">
        RoverCam &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
