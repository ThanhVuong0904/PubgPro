import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import MatchVisualizer from '@/components/MatchVisualizer';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorDisplay from '@/components/ErrorDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
// utils/cn.ts
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: any[]) {
    return twMerge(clsx(inputs));
}

export default function MatchAnalysis() {
    const { matchId, targetAccountId } = useParams();
    const { toast } = useToast();
    const [mainTeamId, setMainTeamId] = useState(null);

    const {
        data: matchData,
        isLoading,
        isError,
    } = useQuery({
        queryKey: [`/api/matches/${matchId}`],
    });

    // Handle error state separately
    useEffect(() => {
        if (isError) {
            toast({
                title: 'Error loading match data',
                description:
                    'Failed to retrieve match details. Please try again later.',
                variant: 'destructive',
            });
        }
    }, [isError, toast]);

    useEffect(() => {
        if (matchData?.participants && targetAccountId) {
            const targetPlayer = matchData.participants.find((p: any) => {
                return p.playerId === targetAccountId;
            });

            console.log({ matchData, targetPlayer, targetAccountId });

            setMainTeamId(targetPlayer?.teamId);
        }
    }, [matchData, targetAccountId]);

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
                            <div className="text-sm text-muted-foreground">
                                Map
                            </div>
                            <div className="font-medium">{matchData.map}</div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">
                                Duration
                            </div>
                            <div className="font-medium">
                                {Math.floor(matchData.duration / 60)}:
                                {(matchData.duration % 60)
                                    .toString()
                                    .padStart(2, '0')}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">
                                Game Mode
                            </div>
                            <div className="font-medium">
                                {matchData.gameMode}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">
                                Players
                            </div>
                            <div className="font-medium">
                                {matchData.playerCount}
                            </div>
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
                            <div className="max-h-[500px] overflow-y-auto pr-2 space-y-6">
                                {matchData.participants ? (
                                    Object.entries(
                                        matchData.participants.reduce(
                                            (
                                                acc: Record<number, any[]>,
                                                player: any,
                                            ) => {
                                                if (!acc[player.teamId])
                                                    acc[player.teamId] = [];
                                                acc[player.teamId].push(player);
                                                return acc;
                                            },
                                            {},
                                        ),
                                    )
                                        .sort(([aTeamId], [bTeamId]) => {
                                            if (
                                                parseInt(aTeamId) === mainTeamId
                                            )
                                                return -1;
                                            if (
                                                parseInt(bTeamId) === mainTeamId
                                            )
                                                return 1;
                                            return (
                                                parseInt(aTeamId) -
                                                parseInt(bTeamId)
                                            );
                                        })
                                        .map(([teamId, players]) => {
                                            const totalKills = players.reduce(
                                                (sum, p) => sum + p.kills,
                                                0,
                                            );
                                            const totalDamage = players.reduce(
                                                (sum, p) => sum + p.damage,
                                                0,
                                            );

                                            const isMainTeam =
                                                parseInt(teamId) === mainTeamId;

                                            return (
                                                <div
                                                    key={teamId}
                                                    className={cn(
                                                        'rounded-lg border p-4 transition-all',
                                                        isMainTeam
                                                            ? 'bg-primary/10 border-primary'
                                                            : 'bg-muted',
                                                    )}
                                                >
                                                    <div className="flex justify-between items-center mb-2">
                                                        <h3
                                                            className={cn(
                                                                'font-semibold',
                                                                isMainTeam &&
                                                                    'text-primary',
                                                            )}
                                                        >
                                                            Team #{teamId}
                                                        </h3>
                                                        <div className="text-sm text-muted-foreground">
                                                            {totalKills} Kills •{' '}
                                                            {totalDamage} Damage
                                                        </div>
                                                    </div>

                                                    <div className="space-y-2">
                                                        {players.map(
                                                            (player: any) => (
                                                                <div
                                                                    key={
                                                                        player.id
                                                                    }
                                                                    className="flex justify-between items-center"
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <a
                                                                            href={`/player/${player.platform}/${player.name}`}
                                                                            className="font-medium hover:text-primary"
                                                                        >
                                                                            {
                                                                                player.name
                                                                            }
                                                                        </a>
                                                                        <span className="text-xs text-muted-foreground">
                                                                            (#
                                                                            {
                                                                                player.rank
                                                                            }
                                                                            )
                                                                        </span>
                                                                    </div>

                                                                    <div className="flex items-center gap-4 text-sm">
                                                                        <span className="text-accent font-medium">
                                                                            {
                                                                                player.kills
                                                                            }{' '}
                                                                            Kills
                                                                        </span>
                                                                        <span className="text-muted-foreground">
                                                                            {
                                                                                player.damage
                                                                            }{' '}
                                                                            dmg
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No participant data available for this
                                        match
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
