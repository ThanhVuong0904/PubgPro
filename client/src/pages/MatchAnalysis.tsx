import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import MatchVisualizer from "@/components/MatchVisualizer";
import LoadingSpinner from "@/components/LoadingSpinner";
import ErrorDisplay from "@/components/ErrorDisplay";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function MatchAnalysis() {
  const { matchId } = useParams();
  const { toast } = useToast();

  const { data: matchData, isLoading, isError } = useQuery({
    queryKey: [`/api/matches/${matchId}`]
  });
  
  // Handle error state separately
  useEffect(() => {
    if (isError) {
      toast({
        title: "Error loading match data",
        description: "Failed to retrieve match details. Please try again later.",
        variant: "destructive"
      });
    }
  }, [isError, toast]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError || !matchData) {
    return (
      <ErrorDisplay 
        title="Match not found" 
        description="The match you're looking for could not be found or has expired."
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Match Analysis</h1>
      
      <Card className="mb-8 bg-card">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Match Details: {matchData.id}</span>
            <span className="text-sm font-normal bg-primary/20 text-primary px-2 py-1 rounded">
              {new Date(matchData.createdAt).toLocaleString()}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Map</div>
              <div className="font-medium">{matchData.map}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Duration</div>
              <div className="font-medium">{Math.floor(matchData.duration / 60)}:{(matchData.duration % 60).toString().padStart(2, '0')}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Game Mode</div>
              <div className="font-medium">{matchData.gameMode}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Players</div>
              <div className="font-medium">{matchData.playerCount}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2">
          <MatchVisualizer match={matchData} fullSize={true} />
        </div>
        
        <div>
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Match Participants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-[500px] overflow-y-auto pr-2">
                {matchData.participants ? (
                  // Render players if available
                  matchData.participants.map((player: any) => (
                    <div key={player.id} className="mb-3">
                      <div className="flex justify-between items-center">
                        <a href={`/player/${player.platform}/${player.name}`} 
                           className="font-medium hover:text-primary transition-colors">
                          {player.name}
                        </a>
                        <div className="text-accent font-medium">
                          {player.kills} Kills
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Rank: #{player.rank}</span>
                        <span>Damage: {player.damage}</span>
                      </div>
                      <Separator className="mt-2" />
                    </div>
                  ))
                ) : (
                  // Show message if no participant data
                  <div className="text-center py-8 text-muted-foreground">
                    No participant data available for this match
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
