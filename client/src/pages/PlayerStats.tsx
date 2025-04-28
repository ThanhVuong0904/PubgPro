import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import PlayerProfileHeader from '@/components/PlayerProfileHeader';
import OverallStats from '@/components/OverallStats';
import WeaponStats from '@/components/WeaponStats';
import MapPerformance from '@/components/MapPerformance';
import MatchVisualizer from '@/components/MatchVisualizer';
import MatchHistory from '@/components/MatchHistory';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorDisplay from '@/components/ErrorDisplay';
import PlayerSearch from '@/components/PlayerSearch';

export default function PlayerStats() {
    const params = useParams();
    const [, setLocation] = useLocation();
    const { playerName, platform } = params;

    const {
        data: playerData,
        isLoading: playerLoading,
        error: playerError,
    } = useQuery({
        queryKey: [`/api/players/${platform}/${playerName}`],
    });

    const {
        data: matchesData,
        isLoading: matchesLoading,
        error: matchesError,
    } = useQuery({
        queryKey: [`/api/players/${platform}/${playerName}/matches`],
        enabled: !!playerData,
    });

    const {
        data: statsData,
        isLoading: statsLoading,
        error: statsError,
    } = useQuery({
        queryKey: [`/api/players/${platform}/${playerName}/stats`],
        enabled: !!playerData,
    });

    const isLoading = playerLoading || matchesLoading || statsLoading;
    const hasError = playerError || matchesError || statsError;

    const handleSearchSuccess = (platform: string, playerName: string) => {
        setLocation(`/player/${platform}/${playerName}`);
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    if (hasError) {
        return (
            <div className="max-w-3xl mx-auto">
                <PlayerSearch onSearchSuccess={handleSearchSuccess} />
                <ErrorDisplay
                    title="Failed to load player data"
                    description="Could not retrieve the player statistics. Please try again or search for a different player."
                />
            </div>
        );
    }

    // Select the latest match for visualization
    const latestMatch =
        matchesData && matchesData.length > 0 ? matchesData[0] : null;

    return (
        <>
            <div className="mb-8">
                <PlayerSearch
                    onSearchSuccess={handleSearchSuccess}
                    defaultPlayer={playerName}
                    defaultPlatform={platform}
                />
            </div>

            {playerData && (
                <PlayerProfileHeader
                    playerName={playerData.name}
                    stats={statsData}
                />
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Stats Column */}
                <div className="lg:col-span-1 space-y-6">
                    {statsData && <OverallStats stats={statsData} />}
                    {statsData && <WeaponStats weapons={statsData.weapons} />}
                    {statsData && <MapPerformance maps={statsData.maps} />}
                </div>

                {/* Match & Map Column */}
                <div className="lg:col-span-2 space-y-6">
                    {/* {latestMatch && <MatchVisualizer match={latestMatch} />} */}
                    {matchesData && (
                        <MatchHistory
                            matches={matchesData}
                            targetAccountId={playerData.id}
                        />
                    )}
                </div>
            </div>
        </>
    );
}
