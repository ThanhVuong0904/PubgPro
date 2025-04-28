import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clipboard, Plus, Minus, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface MatchVisualizerProps {
  match: any;
  fullSize?: boolean;
}

export default function MatchVisualizer({ match, fullSize = false }: MatchVisualizerProps) {
  const { toast } = useToast();
  const mapRef = useRef<HTMLDivElement>(null);
  const [timeProgress, setTimeProgress] = useState(0);
  const [selectedMatch, setSelectedMatch] = useState(match.id);
  const [zoom, setZoom] = useState(1);

  // Fetch detailed match telemetry data
  const { data: telemetry, isLoading, isError } = useQuery({
    queryKey: [`/api/matches/${match.id}/telemetry`]
  });
  
  // Handle error state separately
  useEffect(() => {
    if (isError) {
      toast({
        title: "Error loading match data",
        description: "Could not load match telemetry data.",
        variant: "destructive"
      });
    }
  }, [isError, toast]);

  // Calculate match duration in formatted time
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate current match time based on progress
  const getCurrentTime = () => {
    if (!match.duration) return "00:00";
    const totalSeconds = match.duration;
    const currentSeconds = totalSeconds * (timeProgress / 100);
    return formatDuration(currentSeconds);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleReset = () => setZoom(1);

  // Handle match selection change
  const handleMatchChange = (value: string) => {
    setSelectedMatch(value);
  };

  // Handle timeline controls
  const handleTimelineStep = (direction: "forward" | "backward") => {
    const step = 5; // 5% increment
    if (direction === "forward") {
      setTimeProgress(prev => Math.min(prev + step, 100));
    } else {
      setTimeProgress(prev => Math.max(prev - step, 0));
    }
  };

  return (
    <Card className={fullSize ? "w-full" : "stat-card"}>
      <div className="p-5 border-b border-background">
        <h3 className="text-lg font-bold flex items-center justify-between">
          <span className="flex items-center">
            <Clipboard className="h-5 w-5 mr-2 text-primary" />
            Match Analysis
          </span>
          <Select value={selectedMatch} onValueChange={handleMatchChange}>
            <SelectTrigger className="bg-secondary/60 border border-muted rounded px-2 py-1 text-sm w-[140px]">
              <SelectValue placeholder="Select match" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={match.id}>Latest Match</SelectItem>
              {match.previousMatches?.map((prevMatch: any) => (
                <SelectItem key={prevMatch.id} value={prevMatch.id}>
                  Match #{prevMatch.id.substring(0, 6)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </h3>
      </div>
      
      <div className="relative overflow-hidden">
        <div ref={mapRef} className="map-container w-full relative bg-background" style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}>
          {/* Map visualization would be created using Canvas or SVG */}
          {isLoading ? (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm">Loading match data...</p>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 bg-background/60">
              {/* This would be replaced with proper map visualization */}
              <svg className="w-full h-full" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
                {/* Player Movement Path - would be dynamically generated from telemetry */}
                <path d="M250,780 C300,700 350,650 450,600 C550,550 650,500 750,400 C850,300 780,250 700,200" 
                      stroke="hsl(var(--primary))" strokeWidth="3" fill="none" strokeDasharray="5,5" />
                
                {/* Combat Events */}
                <circle cx="450" cy="600" r="8" fill="hsl(var(--accent))" />
                <circle cx="650" cy="500" r="8" fill="hsl(var(--accent))" />
                <circle cx="780" cy="250" r="8" fill="hsl(var(--accent))" />
                
                {/* Kill Locations */}
                <g transform="translate(450, 600)">
                  <rect x="-10" y="-10" width="20" height="20" fill="hsl(var(--primary))" transform="rotate(45)" />
                </g>
                <g transform="translate(700, 200)">
                  <rect x="-10" y="-10" width="20" height="20" fill="hsl(var(--primary))" transform="rotate(45)" />
                </g>
                
                {/* Player Final Position */}
                <circle cx="700" cy="200" r="12" stroke="hsl(var(--primary))" strokeWidth="3" fill="none" />
              </svg>
            </div>
          )}
          
          {/* Map Legend */}
          <div className="absolute bottom-4 left-4 bg-background/80 p-3 rounded">
            <div className="text-sm font-medium mb-2">Map Legend</div>
            <div className="flex items-center mb-1">
              <div className="w-4 h-0.5 bg-primary mr-2 border-dashed"></div>
              <span className="text-xs">Movement Path</span>
            </div>
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 rounded-full bg-accent mr-2"></div>
              <span className="text-xs">Combat Engagement</span>
            </div>
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 bg-primary mr-2 transform rotate-45"></div>
              <span className="text-xs">Elimination</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full border-2 border-primary mr-2"></div>
              <span className="text-xs">Final Position</span>
            </div>
          </div>
          
          {/* Match Info */}
          <div className="absolute top-4 right-4 bg-background/80 p-3 rounded">
            <div className="text-sm font-medium mb-2">Match Details</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Map:</span>
                <span>{match.map || "Unknown"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Match ID:</span>
                <span>#{match.id?.substring(0, 6) || "Unknown"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date:</span>
                <span>{match.createdAt ? new Date(match.createdAt).toLocaleDateString() : "Unknown"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Placement:</span>
                <span className="text-primary">#{match.placement || "?"} / {match.playerCount || match.participants?.length || "100"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kills:</span>
                <span className="text-accent">{match.kills || "0"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Damage:</span>
                <span>{match.damage || "0"}</span>
              </div>
            </div>
          </div>
          
          {/* Map Controls */}
          <div className="absolute top-4 left-4 space-y-2">
            <Button 
              size="icon" 
              variant="secondary" 
              className="w-8 h-8 bg-background/80 hover:bg-primary hover:text-primary-foreground"
              onClick={handleZoomIn}
            >
              <Plus className="h-5 w-5" />
            </Button>
            <Button 
              size="icon" 
              variant="secondary" 
              className="w-8 h-8 bg-background/80 hover:bg-primary hover:text-primary-foreground"
              onClick={handleZoomOut}
            >
              <Minus className="h-5 w-5" />
            </Button>
            <Button 
              size="icon" 
              variant="secondary" 
              className="w-8 h-8 bg-background/80 hover:bg-primary hover:text-primary-foreground"
              onClick={handleReset}
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* Timeline Controls */}
        <div className="p-4 border-t border-background">
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleTimelineStep("backward")}
              className="text-primary hover:text-accent"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <span className="text-sm font-medium">
              Match Progress: {getCurrentTime()} / {match.duration ? formatDuration(match.duration) : "00:00"}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleTimelineStep("forward")}
              className="text-primary hover:text-accent"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
          <Slider
            value={[timeProgress]}
            min={0}
            max={100}
            step={1}
            onValueChange={(values) => setTimeProgress(values[0])}
            className="w-full"
          />
          <div className="flex justify-between mt-2">
            <span className="text-xs">Landing</span>
            <span className="text-xs">First Circle</span>
            <span className="text-xs">Final Circle</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
