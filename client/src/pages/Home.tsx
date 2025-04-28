import { useState } from "react";
import { useLocation } from "wouter";
import PlayerSearch from "@/components/PlayerSearch";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface RecentSearch {
  id: number;
  playerName: string;
  platform: string;
  timestamp: string;
}

export default function Home() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSearched, setIsSearched] = useState(false);

  const { data: recentSearches } = useQuery<RecentSearch[]>({
    queryKey: ["/api/recent-searches"],
    enabled: !isSearched
  });

  const handleSearchSuccess = (platform: string, playerName: string) => {
    setIsSearched(true);
    setLocation(`/player/${platform}/${playerName}`);
  };

  const handleSearchError = (error: string) => {
    toast({
      title: "Search Error",
      description: error,
      variant: "destructive"
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-primary mb-4">PUBG Analytics</h1>
        <p className="text-muted-foreground mb-8">
          Track your PUBG statistics and analyze match data with interactive visualizations
        </p>
      </div>

      <PlayerSearch 
        onSearchSuccess={handleSearchSuccess} 
        onSearchError={handleSearchError} 
      />

      {!isSearched && recentSearches && recentSearches.length > 0 && (
        <Card className="mt-12 bg-card">
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold mb-4">Recent Searches</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentSearches.map((search: RecentSearch) => (
                <Card 
                  key={search.id} 
                  className="bg-muted hover:border-primary cursor-pointer transition-all"
                  onClick={() => setLocation(`/player/${search.platform}/${search.playerName}`)}
                >
                  <CardContent className="p-4">
                    <div className="font-medium">{search.playerName}</div>
                    <div className="text-xs text-muted-foreground">
                      {search.platform.toUpperCase()} - {new Date(search.timestamp).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="bg-card">
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold mb-4 text-primary">Match Analysis</h2>
            <p className="text-muted-foreground mb-4">
              View detailed match data including player movement, kills, and engagement locations on interactive maps.
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-card">
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold mb-4 text-primary">Performance Metrics</h2>
            <p className="text-muted-foreground mb-4">
              Track your key statistics including K/D ratio, win rate, headshot percentage, and weapon performance.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
