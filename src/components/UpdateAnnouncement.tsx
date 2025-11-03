import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Check } from "lucide-react";

export interface Update {
  id: string;
  version: string;
  title: string;
  description: string;
  features: string[];
  date: string;
}

// Define your major updates here
const UPDATES: Update[] = [
  {
    id: "update-v1.0.0",
    version: "1.0.0",
    title: "Welcome to the New Era! 🎉",
    description: "We've been working hard to bring you amazing new features and improvements.",
    features: [
      "Enhanced WebRTC calling with improved connection handling",
      "Better video chat interface with real-time connection status",
      "YouTube player improvements with seamless playback",
      "Modern UI with beautiful design system",
      "Secure encrypted chat features",
      "Real-time collaboration tools"
    ],
    date: "2025-01-01"
  },
];

const STORAGE_KEY = "seen-updates";

export const UpdateAnnouncement = () => {
  const [open, setOpen] = useState(false);
  const [currentUpdate, setCurrentUpdate] = useState<Update | null>(null);

  useEffect(() => {
    // Get seen updates from localStorage
    const seenUpdates = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    
    // Find the first unseen update
    const unseenUpdate = UPDATES.find(update => !seenUpdates.includes(update.id));
    
    if (unseenUpdate) {
      setCurrentUpdate(unseenUpdate);
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    if (currentUpdate) {
      // Mark this update as seen
      const seenUpdates = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const updatedSeen = [...seenUpdates, currentUpdate.id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSeen));
    }
    setOpen(false);
  };

  if (!currentUpdate) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-[600px] border-primary/20">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-lg bg-gradient-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              Version {currentUpdate.version}
            </span>
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            {currentUpdate.title}
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            {currentUpdate.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <h4 className="font-semibold text-sm text-muted-foreground mb-3">
              What's New
            </h4>
            <ul className="space-y-2">
              {currentUpdate.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="mt-0.5 p-1 rounded-full bg-primary/10">
                    <Check className="h-3 w-3 text-primary" />
                  </div>
                  <span className="text-sm flex-1">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button 
            onClick={handleClose}
            className="bg-gradient-primary hover:opacity-90 transition-opacity"
          >
            Got it, thanks!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
