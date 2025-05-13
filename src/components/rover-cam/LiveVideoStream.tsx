
import Image from "next/legacy/image";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Video } from 'lucide-react';

export default function LiveVideoStream() {
  return (
    <Card className="w-full h-full shadow-xl rounded-lg overflow-hidden">
      <CardHeader className="bg-card/50 border-b border-border">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Video className="h-6 w-6 text-primary" />
          Live Video Stream
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative w-full bg-muted flex items-center justify-center 
                        aspect-video 
                        landscape:h-[calc(100vh-180px)] landscape:lg:h-auto 
                        landscape:aspect-auto landscape:lg:aspect-video">
          <Image
            src="https://picsum.photos/1280/720"
            alt="Live video stream placeholder"
            layout="fill"
            objectFit="contain" 
            data-ai-hint="rover Mars"
            priority
          />
           <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <p className="text-foreground/80 text-lg bg-black/50 px-4 py-2 rounded">Stream Offline - Placeholder</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
