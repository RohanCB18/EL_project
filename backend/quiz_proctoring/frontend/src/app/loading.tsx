import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
        <p className="mt-4 text-muted-foreground font-medium">Loading...</p>
      </div>
    </div>
  );
}
