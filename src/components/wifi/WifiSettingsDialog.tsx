"use client";

import type { ChangeEvent, FormEvent } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Wifi, Loader2, Scan } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

type WifiMode = 'sta' | 'ap';

// Mock data for available networks
const MOCK_AVAILABLE_NETWORKS = ["MyHomeNetwork_2.4G", "CoffeeShopWiFi_Public", "NeighborNet_5G_Secure", "OfficeGuest"];

export default function WifiSettingsDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [wifiMode, setWifiMode] = useState<WifiMode>('sta');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // STA Mode State
  const [availableNetworks, setAvailableNetworks] = useState<string[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState<string>('');
  const [staPassword, setStaPassword] = useState<string>('');

  // AP Mode State
  const [apSsid, setApSsid] = useState<string>('RoverCam-Hotspot');
  const [apPassword, setApPassword] = useState<string>('');

  const [currentWifiStatus, setCurrentWifiStatus] = useState<string>("Not Connected");

  const resetForms = useCallback(() => {
    setSelectedNetwork('');
    setStaPassword('');
    setApSsid('RoverCam-Hotspot');
    setApPassword('');
    // Do not clear availableNetworks here, allow user to reuse scan results
  }, []);

  const handleScanNetworks = useCallback(async () => {
    setIsScanning(true);
    console.log("Scanning for Wi-Fi networks...");
    // Simulate API call to ESP32 to scan networks
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    setAvailableNetworks(MOCK_AVAILABLE_NETWORKS);
    setSelectedNetwork(''); // Reset selected network after new scan
    setIsScanning(false);
    toast({
      title: "Scan Complete",
      description: `${MOCK_AVAILABLE_NETWORKS.length} networks found.`,
    });
  }, [toast]);

  useEffect(() => {
    // Scan for networks when dialog opens in STA mode and no networks are loaded yet.
    if (isOpen && wifiMode === 'sta' && availableNetworks.length === 0 && !isScanning) {
      handleScanNetworks();
    }
  }, [isOpen, wifiMode, availableNetworks.length, isScanning, handleScanNetworks]);


  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetForms();
    }
  };

  const handleStaSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedNetwork) {
      toast({
        variant: "destructive",
        title: "No Network Selected",
        description: "Please select a Wi-Fi network to connect.",
      });
      return;
    }
    setIsLoading(true);
    console.log(`Attempting to connect to SSID: ${selectedNetwork} with Password: ${staPassword ? '********' : '(empty)'}`);
    // Simulate API call to ESP32
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    // Assume success for now
    setCurrentWifiStatus(`Connected to ${selectedNetwork}`);
    toast({
      title: "Wi-Fi Connection",
      description: `Successfully initiated connection to ${selectedNetwork}.`,
    });
    setIsOpen(false); 
  };

  const handleApSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!apSsid) {
      toast({
        variant: "destructive",
        title: "SSID Required",
        description: "Please enter an SSID for the hotspot.",
      });
      return;
    }
    if (apPassword && apPassword.length < 8) {
        toast({
            variant: "destructive",
            title: "Password Too Short",
            description: "Hotspot password must be at least 8 characters or blank for an open network.",
        });
        return;
    }
    setIsLoading(true);
    console.log(`Attempting to start AP with SSID: ${apSsid} and Password: ${apPassword ? '********' : '(open)'}`);
    // Simulate API call to ESP32
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    // Assume success for now
    setCurrentWifiStatus(`Hotspot "${apSsid}" Active`);
    toast({
      title: "Hotspot Mode",
      description: `Hotspot "${apSsid}" is now active.`,
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="ml-auto h-9 w-9">
          <Wifi className="h-5 w-5" />
          <span className="sr-only">Wi-Fi Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-popover">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wifi className="h-6 w-6 text-primary" />
            Wi-Fi Configuration
          </DialogTitle>
          <DialogDescription>
            Manage rover Wi-Fi connection. Current Status: <span className="font-semibold text-foreground">{currentWifiStatus}</span>
          </DialogDescription>
        </DialogHeader>

        <RadioGroup
          onValueChange={(value: string) => setWifiMode(value as WifiMode)}
          className="my-4 grid grid-cols-2 gap-4"
          value={wifiMode}
        >
          <div>
            <RadioGroupItem value="sta" id="sta" className="peer sr-only" />
            <Label
              htmlFor="sta"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
            >
              Join Network
            </Label>
          </div>
          <div>
            <RadioGroupItem value="ap" id="ap" className="peer sr-only" />
            <Label
              htmlFor="ap"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
            >
              Create Hotspot
            </Label>
          </div>
        </RadioGroup>
        
        <Separator className="my-4"/>

        {wifiMode === 'sta' && (
          <form onSubmit={handleStaSubmit} className="space-y-4">
            <div>
              <Label htmlFor="network-select">Available Networks</Label>
              <div className="flex items-center gap-2 mt-1">
                <Select
                  onValueChange={setSelectedNetwork}
                  value={selectedNetwork}
                  disabled={isScanning || (availableNetworks.length === 0 && !isScanning) }
                >
                  <SelectTrigger id="network-select" className="flex-grow">
                    <SelectValue placeholder={isScanning ? "Scanning..." : (availableNetworks.length === 0 && !isScanning ? "Scan to see networks" : "Select a network")} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableNetworks.map((network) => (
                      <SelectItem key={network} value={network}>
                        {network}
                      </SelectItem>
                    ))}
                    {availableNetworks.length === 0 && !isScanning && (
                        <div className="p-2 text-sm text-muted-foreground text-center">No networks found. Try scanning.</div>
                    )}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" size="icon" onClick={handleScanNetworks} disabled={isScanning}>
                  {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scan className="h-4 w-4" />}
                  <span className="sr-only">Scan Networks</span>
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="sta-password">Password</Label>
              <Input
                id="sta-password"
                type="password"
                value={staPassword}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setStaPassword(e.target.value)}
                placeholder="Enter network password"
                disabled={isLoading || !selectedNetwork}
                className="mt-1"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="submit" disabled={isLoading || !selectedNetwork}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Connect
              </Button>
            </DialogFooter>
          </form>
        )}

        {wifiMode === 'ap' && (
          <form onSubmit={handleApSubmit} className="space-y-4">
            <div>
              <Label htmlFor="ap-ssid">Hotspot Name (SSID)</Label>
              <Input
                id="ap-ssid"
                value={apSsid}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setApSsid(e.target.value)}
                placeholder="e.g., RoverCam-Hotspot"
                disabled={isLoading}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="ap-password">Hotspot Password (optional)</Label>
              <Input
                id="ap-password"
                type="password"
                value={apPassword}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setApPassword(e.target.value)}
                placeholder="Leave blank for open network"
                disabled={isLoading}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Min. 8 characters if set.</p>
            </div>
            <DialogFooter className="pt-2">
              <Button type="submit" disabled={isLoading || !apSsid}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Start Hotspot
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
