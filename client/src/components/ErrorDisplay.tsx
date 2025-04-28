import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface ErrorDisplayProps {
  title: string;
  description: string;
  actionText?: string;
  actionPath?: string;
}

export default function ErrorDisplay({ 
  title, 
  description, 
  actionText = "Return Home", 
  actionPath = "/" 
}: ErrorDisplayProps) {
  const [, setLocation] = useLocation();

  return (
    <div className="flex justify-center items-center min-h-[400px]">
      <Card className="w-full max-w-md mx-4 bg-card border-destructive">
        <CardContent className="pt-6 pb-6">
          <div className="flex mb-4 gap-2 items-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <h1 className="text-2xl font-bold">{title}</h1>
          </div>

          <p className="mt-4 text-muted-foreground mb-6">
            {description}
          </p>

          <Button 
            onClick={() => setLocation(actionPath)}
            className="w-full"
          >
            {actionText}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
