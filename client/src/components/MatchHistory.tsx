import { useState } from 'react';
import { useLocation } from 'wouter';
import { Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

interface Match {
    id: string;
    map: string;
    gameMode: string;
    createdAt: string;
    placement: number;
    kills: number;
    damage: number;
    duration: number;
    assists: number;
    revives: number;
}

interface MatchHistoryProps {
    matches: Match[];
}

export default function MatchHistory({
    matches = [],
    targetAccountId,
}: MatchHistoryProps) {
    const [, setLocation] = useLocation();
    const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [displayedMatches, setDisplayedMatches] = useState(5);
    console.log({ targetAccountId });

    const handleMatchSelect = (matchId: string) => {
        setSelectedMatchId(matchId);
        setLocation(`/match/${matchId}/${targetAccountId}`);
    };

    const loadMoreMatches = async () => {
        setIsLoading(true);
        try {
            // In a real app this would load more matches from the API
            // Here we'll just show more of the already loaded matches
            setDisplayedMatches((prev) => Math.min(prev + 5, matches.length));
            // This simulates calling the API to load more matches
            await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
            console.error('Error loading more matches:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Format relative time (e.g. "Today, 18:45" or "Yesterday, 20:15")
    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const isToday =
            date.getDate() === now.getDate() &&
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear();

        const isYesterday =
            date.getDate() === now.getDate() - 1 &&
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear();

        const timeStr = date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });

        if (isToday) {
            return `Today, ${timeStr}`;
        } else if (isYesterday) {
            return `Yesterday, ${timeStr}`;
        } else {
            return date.toLocaleDateString();
        }
    };

    // Return placeholder if no matches
    if (!matches.length) {
        return (
            <Card className="stat-card p-5">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-primary" />
                    Recent Matches
                </h3>
                <div className="text-center text-muted-foreground py-8">
                    No match history available
                </div>
            </Card>
        );
    }

    return (
        <Card className="stat-card p-5">
            <h3 className="text-lg font-bold mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-primary" />
                Recent Matches
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {matches.slice(0, displayedMatches).map((match) => (
                    <div
                        key={match.id}
                        className={`bg-background rounded p-3 hover:border hover:border-primary transition-colors cursor-pointer ${
                            selectedMatchId === match.id
                                ? 'border border-primary'
                                : ''
                        }`}
                        onClick={() => handleMatchSelect(match.id)}
                    >
                        <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center">
                                <div className="text-primary font-medium text-sm mr-2">
                                    #{match.placement}
                                </div>
                                <div>
                                    <div className="text-sm font-medium">
                                        {match.map} - {match.gameMode}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {formatRelativeTime(match.createdAt)}
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-accent font-medium">
                                    {match.kills} Kills
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {match.damage} Damage
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center text-xs">
                            <Badge
                                variant="outline"
                                className="bg-primary/20 text-primary px-2 py-0.5 rounded mr-2"
                            >
                                {Math.floor(match.duration / 60)} min
                            </Badge>
                            <Badge
                                variant="outline"
                                className="bg-background/60 px-2 py-0.5 rounded mr-2 border border-muted"
                            >
                                {match.assists} Assists
                            </Badge>
                            <Badge
                                variant="outline"
                                className="bg-background/60 px-2 py-0.5 rounded border border-muted"
                            >
                                {match.revives} Revives
                            </Badge>
                        </div>
                    </div>
                ))}
            </div>
            {displayedMatches < matches.length && (
                <div className="mt-4 text-center">
                    <Button
                        variant="secondary"
                        className="hover:bg-secondary/80 text-foreground"
                        onClick={loadMoreMatches}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Loading...' : 'Load More Matches'}
                    </Button>
                </div>
            )}
        </Card>
    );
}
