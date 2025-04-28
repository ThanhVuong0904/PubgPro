import { CircleOff } from "lucide-react";

export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px]">
      <CircleOff className="h-12 w-12 text-primary animate-spin" />
      <p className="mt-4 text-muted-foreground">Loading...</p>
    </div>
  );
}
