import { useState } from "react";
import { Star, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface PlayerProfileHeaderProps {
  playerName: string;
  stats: any;
}

export default function PlayerProfileHeader({
  playerName,
  stats,
}: PlayerProfileHeaderProps) {
  const { toast } = useToast();
  const [isFavorite, setIsFavorite] = useState(stats?.isFavorite || false);
  const [isLoading, setIsLoading] = useState(false);
  const toggleFavorite = async () => {
    setIsLoading(true);
    try {
      await apiRequest("POST", "/api/favorites", {
        playerName,
        favorite: !isFavorite,
      });

      setIsFavorite(!isFavorite);
      queryClient.invalidateQueries({ queryKey: ["/api/recent-searches"] });

      toast({
        title: !isFavorite ? "Added to favorites" : "Removed from favorites",
        description: !isFavorite
          ? `${playerName} has been added to your favorites`
          : `${playerName} has been removed from your favorites`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update favorite status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  console.log('PlayerProfileHeader rendered', stats)

  return (
    <div className="mb-8 bg-secondary rounded-lg p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
        <div className="flex items-center mb-4 md:mb-0">
          <div className="w-20 h-20 rounded-full bg-background border-2 border-primary flex items-center justify-center overflow-hidden">
            {/* Display player avatar if available, otherwise show initials */}
            {stats?.avatar ? (
              <img
                src={stats.avatar}
                alt={`${playerName}'s Avatar`}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl font-bold text-primary">
                {playerName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="ml-4">
            <h2 className="text-2xl font-bold text-foreground">{playerName}</h2>
            <div className="flex items-center mt-1">
              <Badge
                variant="outline"
                className="bg-primary/20 text-primary text-xs font-medium px-2 py-1"
              >
                {stats?.level ? `Level ${stats.level}` : "Unknown Level"}
              </Badge>
              <span className="ml-2 text-muted-foreground text-sm">
                Last active: {stats?.lastActive ? stats.lastActive : "Unknown"}
              </span>
            </div>
            <div className="mt-2 flex items-center space-x-3">
              <Button
                variant="link"
                size="sm"
                className={
                  isFavorite
                    ? "text-primary"
                    : "text-muted-foreground hover:text-primary"
                }
                onClick={toggleFavorite}
                disabled={isLoading}
              >
                <Star
                  className={`h-4 w-4 mr-1 ${isFavorite ? "fill-primary" : ""}`}
                />
                {isFavorite ? "Favorited" : "Add Favorite"}
              </Button>
              <Button
                variant="link"
                size="sm"
                className="text-muted-foreground hover:text-primary"
              >
                <UserPlus className="h-4 w-4 mr-1" />
                Compare
              </Button>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <div className="flex space-x-4 mb-2">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Matches</div>
              <div className="text-lg font-bold">
                {stats?.totalMatches || 0}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Win Rate</div>
              <div className="text-lg font-bold text-primary">
                {stats?.winRate || "0%"}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">K/D Ratio</div>
              <div className="text-lg font-bold text-accent">
                {stats?.kd || "0"}
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Badge
              variant="outline"
              className="text-xs bg-secondary/60 hover:bg-secondary border border-muted"
            >
              {stats?.season || "Current Season"}
            </Badge>
            <Badge
              variant="outline"
              className="text-xs bg-secondary/60 hover:bg-secondary border border-muted"
            >
              {stats?.gameMode || "Squad FPP"}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
