import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
    Clipboard,
    Plus,
    Minus,
    RotateCcw,
    ChevronLeft,
    ChevronRight,
    Play,
    Pause,
    Users,
    Crosshair,
    Eye,
    EyeOff,
    Flag,
    SkipForward,
    SkipBack,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Interface definitions for your data types
interface Position {
    x: number;
    y: number;
}

interface PlayerPosition {
    playerName: string;
    teamId: number;
    position: Position;
    timestamp: number;
    health?: number;
    isAlive?: boolean;
}

interface PlayerAttack {
    attackerName: string;
    attackerPosition: Position;
    victimName?: string;
    victimPosition?: Position;
    attackTeamId: number;
    weaponName: string;
    timestamp: number;
    isKnockout?: boolean;
    isKill?: boolean;
}

interface PlayZone {
    position: Position;
    radius: number;
    timestamp: number;
}

interface PlayerStats {
    playerName: string;
    teamId: number;
    kills: number;
    damage: number;
    placement: number;
    isAlive: boolean;
    color?: string;
}

interface MatchData {
    mapName: string;
    playerPositions: PlayerPosition[];
    playerAttacks: PlayerAttack[];
    playZones: PlayZone[];
    players: PlayerStats[];
    startTime: number;
    endTime: number;
    duration: number;
}

interface MatchVisualizerProps {
    match: any;
    telemetryData?: MatchData;
    fullSize?: boolean;
}

// Map dimensions for coordinate conversion
const MAP_DIMENSIONS: { [key: string]: { width: number; height: number } } = {
    Baltic_Main: { width: 816000, height: 816000 },
    Desert_Main: { width: 816000, height: 816000 },
    Savage_Main: { width: 408000, height: 408000 },
    DihorOtok_Main: { width: 612000, height: 612000 },
    Summerland_Main: { width: 204000, height: 204000 },
    Tiger_Main: { width: 816000, height: 816000 },
    Kiki_Main: { width: 816000, height: 816000 },
    // Add other maps as needed
    default: { width: 816000, height: 816000 }, // Default fallback
};

// Map internal names to display names and file names
const MAP_NAME_MAPPING: { [key: string]: { display: string; file: string } } = {
    Baltic_Main: {
        display: 'Erangel',
        file: '/src/assets/Maps/Erangel_Main_Low_Res.png',
    },
    Neon_Main: {
        display: 'Rondo',
        file: '/src/assets/Maps/Rondo_Main_Low_Res.png',
    },
    Desert_Main: {
        display: 'Miramar',
        file: '/src/assets/Maps/Miramar_Main_Low_Res.png',
    },
    Savage_Main: {
        display: 'Sanhok',
        file: '/src/assets/Maps/Sanhok_Main_Low_Res.png',
    },
    Tiger_Main: {
        display: 'Taego',
        file: '/src/assets/Maps/Taego_Main_Low_Res.png',
    },
    Kiki_Main: {
        display: 'Deston',
        file: '/src/assets/Maps/Deston_Main_Low_Res.png',
    },
    Chimera_Main: {
        display: 'Paramo',
        file: '/src/assets/Maps/Paramo_Main_Low_Res.png',
    },
    DihorOtok_Main: {
        display: 'Vikendi',
        file: '/src/assets/Maps/Vikendi_Main_Low_Res.png',
    },
    Erangel_Main: {
        display: 'Erangel',
        file: '/src/assets/Maps/Erangel_Main_Low_Res.png',
    },
    Heaven_Main: {
        display: 'Haven',
        file: '/src/assets/Maps/Haven_Main_Low_Res.png',
    },
    Range_Main: {
        display: 'Camp Jackal',
        file: '/src/assets/Maps/Camp_Jackal_Main_Low_Res.png',
    },
    Summerland_Main: {
        display: 'Karakin',
        file: '/src/assets/Maps/Karakin_Main_Low_Res.png',
    },
};

// Team colors inspired by pubg.sh
const TEAM_COLORS = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-orange-500',
    'bg-emerald-500',
    'bg-sky-500',
    'bg-amber-500',
    'bg-lime-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-fuchsia-500',
    'bg-rose-500',
];

// Helper function to get map file name
const getMapFilename = (mapName: string) => {
    if (!mapName) return '/assets/Maps/Erangel_Main_Low_Res.png'; // Default fallback

    const normalizedName = mapName;
    return MAP_NAME_MAPPING[normalizedName].file;
};

// Helper function to get display name
const getMapDisplayName = (mapName: string) => {
    if (!mapName) return 'Unknown Map';

    return MAP_NAME_MAPPING[mapName]?.display || mapName;
};

// Helper function to convert game coordinates to screen position
const convertToScreenPosition = (position: Position, mapName: string) => {
    const mapDimensions = MAP_DIMENSIONS[mapName] || MAP_DIMENSIONS.default;

    return {
        x: position.x / mapDimensions.width,
        y: position.y / mapDimensions.height,
    };
};

// Component to render individual players
function PlayerMarker({
    playerPosition,
    mapName,
    isCurrentPlayer,
    teamId,
    isVisible,
    isAlive,
}) {
    const screenPos = convertToScreenPosition(playerPosition.position, mapName);

    if (!isVisible) return null;
    if (playerPosition.isAlive === false || isAlive === false) return null;

    // Generate a consistent color based on teamId
    const getTeamColor = (id: any) => {
        return isCurrentPlayer
            ? 'bg-primary'
            : TEAM_COLORS[id % TEAM_COLORS.length];
    };

    return (
        <div
            className={`absolute flex flex-col items-center`}
            style={{
                left: `${screenPos.x * 100}%`,
                top: `${screenPos.y * 100}%`,
                zIndex: isCurrentPlayer ? 10 : 5,
                transform: 'translate(-50%, -50%)',
            }}
        >
            <div
                className={`w-3 h-3 rounded-full ${getTeamColor(teamId)}`}
                title={playerPosition.playerName}
            />
            <div className="mt-1 text-xs font-semibold bg-background/70 px-1 rounded text-white">
                {playerPosition.playerName.substring(0, 8)}
            </div>
        </div>
    );
}

// Component to render play zone circles
function PlayZoneCircle({ zone, mapName, type = 'current' }) {
    const centerPos = convertToScreenPosition(zone.position, mapName);
    const mapDimensions = MAP_DIMENSIONS[mapName] || MAP_DIMENSIONS.default;

    // Convert radius to screen percentage
    const screenRadius = (zone.radius / mapDimensions.width) * 100;

    const borderColor = type === 'current' ? 'border-blue-400' : 'border-white';
    const opacity = type === 'current' ? 0.5 : 0.3;

    return (
        <div
            className={`absolute rounded-full border-2 ${borderColor}`}
            style={{
                left: `${centerPos.x * 100}%`,
                top: `${centerPos.y * 100}%`,
                width: `${screenRadius * 2}%`,
                height: `${screenRadius * 2}%`,
                transform: 'translate(-50%, -50%)',
                opacity,
                zIndex: 3,
            }}
        />
    );
}

// Component to render player attacks
function AttackMarker({ attack, mapName, showTracer = false }) {
    const attackerPos = convertToScreenPosition(
        attack.attackerPosition,
        mapName,
    );

    if (!showTracer || !attack.victimPosition) {
        return (
            <div
                className="absolute w-2 h-2 bg-orange-500 rounded-full"
                style={{
                    left: `${attackerPos.x * 100}%`,
                    top: `${attackerPos.y * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 4,
                }}
                title={`${attack.attackerName} - ${attack.weaponName}`}
            />
        );
    }

    // If we have victim position, show a tracer line
    const victimPos = convertToScreenPosition(attack.victimPosition, mapName);

    // Calculate angle for the tracer line
    const dx = victimPos.x - attackerPos.x;
    const dy = victimPos.y - attackerPos.y;
    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    // Calculate distance for the line
    const distance = Math.sqrt(dx * dx + dy * dy) * 100;

    return (
        <div
            className="absolute"
            style={{
                left: `${attackerPos.x * 100}%`,
                top: `${attackerPos.y * 100}%`,
                zIndex: 4,
                transformOrigin: 'left center',
                transform: `rotate(${angle}deg)`,
            }}
        >
            <div
                className={`h-0.5 ${
                    attack.isKill
                        ? 'bg-red-500'
                        : attack.isKnockout
                        ? 'bg-orange-400'
                        : 'bg-yellow-300'
                }`}
                style={{
                    width: `${distance}%`,
                    opacity: 0.7,
                }}
            />
        </div>
    );
}

// Component to render kill events
function KillMarker({ attack, mapName }) {
    if (!attack.isKill || !attack.victimPosition) return null;

    const victimPos = convertToScreenPosition(attack.victimPosition, mapName);

    return (
        <div
            className="absolute w-4 h-4 rounded-full"
            style={{
                left: `${victimPos.x * 100}%`,
                top: `${victimPos.y * 100}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 6,
                background:
                    'radial-gradient(circle, rgba(255,0,0,0.8) 0%, rgba(255,0,0,0) 70%)',
                boxShadow: '0 0 10px rgba(255, 0, 0, 0.8)',
            }}
            title={`${attack.attackerName} killed ${attack.victimName}`}
        />
    );
}

export default function MatchVisualizer({
    match,
    telemetryData,
    fullSize = false,
}: MatchVisualizerProps) {
    const { toast } = useToast();
    const mapRef = useRef<HTMLDivElement>(null);
    const [timeProgress, setTimeProgress] = useState(0);
    const [selectedMatch, setSelectedMatch] = useState(match?.id || '');
    const [zoom, setZoom] = useState(1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const playbackRef = useRef<NodeJS.Timeout | null>(null);
    const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const [currentZoneIndex, setCurrentZoneIndex] = useState(0);
    const [nextZoneIndex, setNextZoneIndex] = useState(1);
    const [showLabels, setShowLabels] = useState(true);
    const [showAttacks, setShowAttacks] = useState(true);
    const [showTracers, setShowTracers] = useState(true);
    const [filterTeams, setFilterTeams] = useState<number[]>([]);
    const [focusedPlayer, setFocusedPlayer] = useState<string | null>(null);
    const [eventLog, setEventLog] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState('map');

    // Track visible teams
    const [visibleTeams, setVisibleTeams] = useState<{
        [key: number]: boolean;
    }>({});

    // Fetch detailed match telemetry data if not provided as prop
    const {
        data: fetchedTelemetry,
        isLoading,
        isError,
    } = useQuery({
        queryKey: [`/api/matches/${selectedMatch}/telemetry`],
        enabled: !!selectedMatch && !telemetryData, // Only fetch if not provided as prop
    });

    // Use either prop data or fetched data
    const telemetry = telemetryData || fetchedTelemetry;

    // Set up visible teams initially
    useEffect(() => {
        if (telemetry?.players) {
            const uniqueTeams = [
                ...new Set(telemetry.players.map((p) => p.teamId)),
            ];
            const initialVisibility = {};
            uniqueTeams.forEach((teamId) => {
                initialVisibility[teamId] = true;
            });
            setVisibleTeams(initialVisibility);
        }
    }, [telemetry]);

    // Handle error state
    useEffect(() => {
        if (isError) {
            toast({
                title: 'Error loading match data',
                description: 'Could not load match telemetry data.',
                variant: 'destructive',
            });
        }
    }, [isError, toast]);

    // Get current timestamp based on progress
    const getCurrentTimestamp = () => {
        if (!telemetry) return 0;

        const startTime = telemetry.startTime || 0;
        const endTime =
            telemetry.endTime || startTime + (telemetry.duration || 0) * 1000;
        const duration = endTime - startTime;

        return startTime + duration * (timeProgress / 100);
    };

    // Extract relevant positions based on current time
    const getCurrentPositions = () => {
        if (!telemetry?.playerPositions) return [];

        const currentTimestamp = getCurrentTimestamp();

        // Group positions by player and find the latest position for each player before the current time
        const playerMap = new Map();

        telemetry.playerPositions.forEach((position) => {
            if (position.timestamp <= currentTimestamp) {
                // Keep track of the latest position for each player
                if (
                    !playerMap.has(position.playerName) ||
                    playerMap.get(position.playerName).timestamp <
                        position.timestamp
                ) {
                    playerMap.set(position.playerName, position);
                }
            }
        });

        return Array.from(playerMap.values());
    };

    // Get current and next play zones based on time
    useEffect(() => {
        if (telemetry?.playZones && telemetry.playZones.length > 0) {
            const currentTimestamp = getCurrentTimestamp();

            let current = 0;
            let next = 0;

            // Find current and next zones
            for (let i = 0; i < telemetry.playZones.length; i++) {
                if (telemetry.playZones[i].timestamp <= currentTimestamp) {
                    current = i;
                    next = Math.min(i + 1, telemetry.playZones.length - 1);
                }
            }

            setCurrentZoneIndex(current);
            setNextZoneIndex(next);
        }
    }, [timeProgress, telemetry]);

    // Handle playback control
    useEffect(() => {
        if (isPlaying) {
            playbackRef.current = setInterval(() => {
                setTimeProgress((prev) => {
                    if (prev >= 100) {
                        setIsPlaying(false);
                        return 100;
                    }
                    return prev + 0.5 * playbackSpeed;
                });
            }, 100);
        } else if (playbackRef.current) {
            clearInterval(playbackRef.current);
        }

        return () => {
            if (playbackRef.current) clearInterval(playbackRef.current);
        };
    }, [isPlaying, playbackSpeed]);

    // Get current attacks
    const getCurrentAttacks = () => {
        if (!telemetry?.playerAttacks) return [];

        const currentTimestamp = getCurrentTimestamp();
        // Show attacks within last 5 seconds of current timestamp
        const recentWindow = 5000;

        return telemetry.playerAttacks.filter(
            (attack) =>
                attack.timestamp <= currentTimestamp &&
                attack.timestamp >= currentTimestamp - recentWindow,
        );
    };

    // Get kill events
    const getKillEvents = () => {
        if (!telemetry?.playerAttacks) return [];

        const currentTimestamp = getCurrentTimestamp();

        return telemetry.playerAttacks.filter(
            (attack) => attack.isKill && attack.timestamp <= currentTimestamp,
        );
    };

    // Format time display (MM:SS)
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Calculate current time based on progress
    const getCurrentTime = () => {
        if (!telemetry?.duration) return '00:00';
        const currentSeconds = telemetry.duration * (timeProgress / 100);
        return formatDuration(currentSeconds);
    };

    // Update event log based on current time
    useEffect(() => {
        if (!telemetry?.playerAttacks) return;

        const currentTimestamp = getCurrentTimestamp();
        const recentEvents = telemetry.playerAttacks
            .filter((attack) => {
                return (
                    attack.timestamp <= currentTimestamp &&
                    attack.timestamp >= currentTimestamp - 5000
                );
            })
            .sort((a, b) => b.timestamp - a.timestamp)
            .map((attack) => {
                if (attack.isKill) {
                    return `${attack.attackerName} killed ${attack.victimName} with ${attack.weaponName}`;
                } else if (attack.isKnockout) {
                    return `${attack.attackerName} knocked ${attack.victimName} with ${attack.weaponName}`;
                } else {
                    return `${attack.attackerName} attacked with ${attack.weaponName}`;
                }
            });

        setEventLog(recentEvents);
    }, [timeProgress, telemetry]);

    // Map zoom controls
    const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
    const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
    const handleReset = () => {
        setZoom(1);
        setPanPosition({ x: 0, y: 0 });
    };

    // Map panning handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if (mapRef.current) {
            isDragging.current = true;
            dragStart.current = {
                x: e.clientX - panPosition.x,
                y: e.clientY - panPosition.y,
            };
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging.current && mapRef.current) {
            setPanPosition({
                x: e.clientX - dragStart.current.x,
                y: e.clientY - dragStart.current.y,
            });
        }
    };

    const handleMouseUp = () => {
        isDragging.current = false;
    };

    // Match selection handler
    const handleMatchChange = (value: string) => {
        setSelectedMatch(value);
        setTimeProgress(0);
        setIsPlaying(false);
    };

    // Timeline navigation
    const handleTimelineStep = (direction: 'forward' | 'backward') => {
        const step = 5; // 5% increment
        if (direction === 'forward') {
            setTimeProgress((prev) => Math.min(prev + step, 100));
        } else {
            setTimeProgress((prev) => Math.max(prev - step, 0));
        }
    };

    // Jump forward/backward
    const handleJump = (direction: 'forward' | 'backward') => {
        const jumpSize = 15; // 15% increment
        if (direction === 'forward') {
            setTimeProgress((prev) => Math.min(prev + jumpSize, 100));
        } else {
            setTimeProgress((prev) => Math.max(prev - jumpSize, 0));
        }
    };

    // Toggle playback
    const togglePlayback = () => {
        setIsPlaying(!isPlaying);
    };

    // Change playback speed
    const cyclePlaybackSpeed = () => {
        const speeds = [0.5, 1, 2, 4, 8];
        const currentIndex = speeds.indexOf(playbackSpeed);
        const nextIndex = (currentIndex + 1) % speeds.length;
        setPlaybackSpeed(speeds[nextIndex]);
    };

    // Toggle team visibility
    const toggleTeamVisibility = (teamId: number) => {
        setVisibleTeams((prev) => ({
            ...prev,
            [teamId]: !prev[teamId],
        }));
    };

    // Toggle all teams
    const toggleAllTeams = () => {
        const allTeams = Object.keys(visibleTeams).map(Number);
        const areAllVisible = allTeams.every((teamId) => visibleTeams[teamId]);

        const newVisibility = {};
        allTeams.forEach((teamId) => {
            newVisibility[teamId] = !areAllVisible;
        });

        setVisibleTeams(newVisibility);
    };

    // Focus on a specific player
    const handleFocusPlayer = (playerName: string) => {
        if (focusedPlayer === playerName) {
            setFocusedPlayer(null);
        } else {
            setFocusedPlayer(playerName);

            // Find player's position and center on it
            const positions = getCurrentPositions();
            const playerPos = positions.find(
                (p) => p.playerName === playerName,
            );

            if (playerPos && mapRef.current) {
                const screenPos = convertToScreenPosition(
                    playerPos.position,
                    match.map || telemetry?.mapName,
                );
                const mapWidth = mapRef.current.clientWidth;
                const mapHeight = mapRef.current.clientHeight;

                // Calculate centering offset
                setPanPosition({
                    x: (0.5 - screenPos.x) * mapWidth * zoom,
                    y: (0.5 - screenPos.y) * mapHeight * zoom,
                });
            }
        }
    };

    // Get map background image path
    const getMapBackground = () => {
        const mapName = match.map || telemetry?.mapName;
        if (!mapName) return '';

        return getMapFilename(mapName);
    };

    // Get teams info for the roster
    const getTeamsInfo = () => {
        if (!telemetry?.players) return [];

        const teamMap = new Map();

        telemetry.players.forEach((player) => {
            if (!teamMap.has(player.teamId)) {
                teamMap.set(player.teamId, []);
            }
            teamMap.get(player.teamId).push(player);
        });

        return Array.from(teamMap.entries())
            .map(([teamId, players]) => ({
                teamId,
                players,
                color: TEAM_COLORS[teamId % TEAM_COLORS.length],
            }))
            .sort((a, b) => {
                // Sort by having focused player first, then by team placement
                const aHasFocus =
                    focusedPlayer &&
                    a.players.some((p) => p.playerName === focusedPlayer);
                const bHasFocus =
                    focusedPlayer &&
                    b.players.some((p) => p.playerName === focusedPlayer);

                if (aHasFocus && !bHasFocus) return -1;
                if (!aHasFocus && bHasFocus) return 1;

                // Then sort by team's best placement
                const aPlacement = Math.min(
                    ...a.players.map((p) => p.placement || 100),
                );
                const bPlacement = Math.min(
                    ...b.players.map((p) => p.placement || 100),
                );
                return aPlacement - bPlacement;
            });
    };

    return (
        <Card className={fullSize ? 'w-full' : 'w-full max-w-5xl'}>
            <div className="p-4 border-b border-background flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center">
                    <Clipboard className="h-5 w-5 mr-2 text-primary" />
                    {match?.playerName || 'Player'}'s Match -{' '}
                    {getMapDisplayName(match?.map || telemetry?.mapName)}
                </h3>
                <div className="flex items-center space-x-2">
                    <Select
                        value={selectedMatch}
                        onValueChange={handleMatchChange}
                    >
                        <SelectTrigger className="bg-secondary/60 border border-muted rounded px-2 py-1 text-sm w-[140px]">
                            <SelectValue placeholder="Select match" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={match?.id || ''}>
                                Latest Match
                            </SelectItem>
                            {match?.previousMatches?.map((prevMatch: any) => (
                                <SelectItem
                                    key={prevMatch.id}
                                    value={prevMatch.id}
                                >
                                    Match #{prevMatch.id.substring(0, 6)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
            >
                <TabsList className="grid grid-cols-2 px-4 pt-2">
                    <TabsTrigger value="map">Map View</TabsTrigger>
                    <TabsTrigger value="roster">Roster</TabsTrigger>
                </TabsList>

                <TabsContent value="map">
                    <div
                        className="relative overflow-hidden h-[600px]"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    >
                        <div
                            ref={mapRef}
                            className="map-container w-full h-full relative bg-background cursor-grab"
                            style={{
                                transform: `scale(${zoom}) translate(${
                                    panPosition.x / zoom
                                }px, ${panPosition.y / zoom}px)`,
                                transformOrigin: 'center',
                                backgroundImage: getMapBackground()
                                    ? `url(${getMapBackground()})`
                                    : undefined,
                                backgroundSize: 'contain',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                            }}
                        >
                            {isLoading ? (
                                <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                        <p className="mt-2 text-sm">
                                            Loading match data...
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Render play zone circles */}
                                    {telemetry?.playZones && (
                                        <>
                                            {telemetry.playZones[
                                                currentZoneIndex
                                            ] && (
                                                <PlayZoneCircle
                                                    zone={
                                                        telemetry.playZones[
                                                            currentZoneIndex
                                                        ]
                                                    }
                                                    mapName={
                                                        match.map ||
                                                        telemetry.mapName
                                                    }
                                                    type="current"
                                                />
                                            )}
                                            {currentZoneIndex !==
                                                nextZoneIndex &&
                                                telemetry.playZones[
                                                    nextZoneIndex
                                                ] && (
                                                    <PlayZoneCircle
                                                        zone={
                                                            telemetry.playZones[
                                                                nextZoneIndex
                                                            ]
                                                        }
                                                        mapName={
                                                            match.map ||
                                                            telemetry.mapName
                                                        }
                                                        type="next"
                                                    />
                                                )}
                                        </>
                                    )}

                                    {/* Render player attacks */}
                                    {showAttacks &&
                                        getCurrentAttacks().map(
                                            (attack, index) => (
                                                <AttackMarker
                                                    key={`attack-${index}`}
                                                    attack={attack}
                                                    mapName={
                                                        match.map ||
                                                        telemetry?.mapName
                                                    }
                                                    showTracer={showTracers}
                                                />
                                            ),
                                        )}

                                    {/* Render kill events */}
                                    {getKillEvents().map((kill, index) => (
                                        <KillMarker
                                            key={`kill-${index}`}
                                            attack={kill}
                                            mapName={
                                                match.map || telemetry?.mapName
                                            }
                                        />
                                    ))}

                                    {/* Render player positions */}
                                    {getCurrentPositions().map(
                                        (position, index) => (
                                            <PlayerMarker
                                                key={`player-${position.playerName}-${index}`}
                                                playerPosition={position}
                                                mapName={
                                                    match.map ||
                                                    telemetry?.mapName
                                                }
                                                isCurrentPlayer={
                                                    position.playerName ===
                                                        match.playerName ||
                                                    position.playerName ===
                                                        focusedPlayer
                                                }
                                                teamId={position.teamId}
                                                isVisible={
                                                    visibleTeams[
                                                        position.teamId
                                                    ] !== false &&
                                                    (!focusedPlayer ||
                                                        position.playerName ===
                                                            focusedPlayer ||
                                                        telemetry?.players?.find(
                                                            (p) =>
                                                                p.playerName ===
                                                                    position.playerName &&
                                                                p.teamId ===
                                                                    telemetry?.players?.find(
                                                                        (fp) =>
                                                                            fp.playerName ===
                                                                            focusedPlayer,
                                                                    )?.teamId,
                                                        ))
                                                }
                                                isAlive={
                                                    position.isAlive !== false
                                                }
                                            />
                                        ),
                                    )}
                                </>
                            )}

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

                            {/* View Controls */}
                            <div className="absolute top-4 right-4 space-y-2 bg-background/80 p-2 rounded">
                                <div className="text-xs font-semibold mb-2">
                                    Visibility
                                </div>
                                <div className="flex items-center space-x-2 mb-2">
                                    <Checkbox
                                        id="show-labels"
                                        checked={showLabels}
                                        onCheckedChange={() =>
                                            setShowLabels(!showLabels)
                                        }
                                    />
                                    <label
                                        htmlFor="show-labels"
                                        className="text-xs cursor-pointer"
                                    >
                                        Player Labels
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2 mb-2">
                                    <Checkbox
                                        id="show-attacks"
                                        checked={showAttacks}
                                        onCheckedChange={() =>
                                            setShowAttacks(!showAttacks)
                                        }
                                    />
                                    <label
                                        htmlFor="show-attacks"
                                        className="text-xs cursor-pointer"
                                    >
                                        Show Attacks
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="show-tracers"
                                        checked={showTracers}
                                        onCheckedChange={() =>
                                            setShowTracers(!showTracers)
                                        }
                                    />
                                    <label
                                        htmlFor="show-tracers"
                                        className="text-xs cursor-pointer"
                                    >
                                        Show Tracers
                                    </label>
                                </div>
                            </div>

                            {/* Map Legend */}
                            <div className="absolute bottom-4 left-4 bg-background/80 p-3 rounded">
                                <div className="text-sm font-medium mb-2">
                                    Map Legend
                                </div>
                                <div className="flex items-center mb-1">
                                    <div className="w-3 h-3 rounded-full bg-primary mr-2"></div>
                                    <span className="text-xs">
                                        Your Position
                                    </span>
                                </div>
                                <div className="flex items-center mb-1">
                                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                                    <span className="text-xs">Teammates</span>
                                </div>
                                <div className="flex items-center mb-1">
                                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                                    <span className="text-xs">Enemies</span>
                                </div>
                                <div className="flex items-center mb-1">
                                    <div className="w-3 h-3 bg-orange-500 mr-2 rounded-full"></div>
                                    <span className="text-xs">Attacks</span>
                                </div>
                                <div className="flex items-center mb-1">
                                    <div className="w-4 h-4 rounded-full border-2 border-blue-400 mr-2"></div>
                                    <span className="text-xs">
                                        Current Zone
                                    </span>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-4 h-4 rounded-full border-2 border-white mr-2"></div>
                                    <span className="text-xs">Next Zone</span>
                                </div>
                            </div>

                            {/* Event Log */}
                            <div className="absolute bottom-4 right-4 bg-background/80 p-3 rounded max-w-xs max-h-40 overflow-auto">
                                <div className="text-sm font-medium mb-2">
                                    Recent Events
                                </div>
                                {eventLog.length > 0 ? (
                                    <div className="space-y-1">
                                        {eventLog.map((event, idx) => (
                                            <div key={idx} className="text-xs">
                                                {event}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-xs text-muted-foreground">
                                        No recent events
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="roster">
                    <div className="h-[600px] p-4">
                        <div className="flex justify-between mb-4">
                            <h3 className="text-lg font-bold flex items-center">
                                <Users className="h-5 w-5 mr-2 text-primary" />
                                Players Roster
                            </h3>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={toggleAllTeams}
                                className="text-xs"
                            >
                                {Object.values(visibleTeams).every((v) => v) ? (
                                    <>
                                        <EyeOff className="h-4 w-4 mr-1" /> Hide
                                        All
                                    </>
                                ) : (
                                    <>
                                        <Eye className="h-4 w-4 mr-1" /> Show
                                        All
                                    </>
                                )}
                            </Button>
                        </div>

                        <ScrollArea className="h-[520px] pr-4">
                            <div className="space-y-4">
                                {getTeamsInfo().map((team) => (
                                    <div
                                        key={`team-${team.teamId}`}
                                        className="border rounded-md p-3"
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center">
                                                <div
                                                    className={`w-3 h-3 rounded-full ${team.color} mr-2`}
                                                ></div>
                                                <h4 className="font-medium">
                                                    Team #{team.teamId}
                                                </h4>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() =>
                                                    toggleTeamVisibility(
                                                        team.teamId,
                                                    )
                                                }
                                            >
                                                {visibleTeams[team.teamId] ? (
                                                    <Eye className="h-4 w-4" />
                                                ) : (
                                                    <EyeOff className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>

                                        <div className="space-y-2">
                                            {team.players.map((player) => {
                                                const isCurrentPlayer =
                                                    player.playerName ===
                                                    match.playerName;
                                                const isFocused =
                                                    player.playerName ===
                                                    focusedPlayer;

                                                return (
                                                    <div
                                                        key={player.playerName}
                                                        className={`flex justify-between items-center p-2 rounded ${
                                                            isFocused
                                                                ? 'bg-primary/20'
                                                                : isCurrentPlayer
                                                                ? 'bg-secondary/40'
                                                                : ''
                                                        } cursor-pointer hover:bg-secondary/20`}
                                                        onClick={() =>
                                                            handleFocusPlayer(
                                                                player.playerName,
                                                            )
                                                        }
                                                    >
                                                        <div className="flex items-center">
                                                            {isCurrentPlayer && (
                                                                <Flag className="h-4 w-4 mr-1 text-primary" />
                                                            )}
                                                            <span
                                                                className={`${
                                                                    isCurrentPlayer
                                                                        ? 'font-semibold'
                                                                        : ''
                                                                } ${
                                                                    !player.isAlive
                                                                        ? 'line-through text-muted-foreground'
                                                                        : ''
                                                                }`}
                                                            >
                                                                {
                                                                    player.playerName
                                                                }
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center space-x-4">
                                                            <span className="text-sm">
                                                                <span className="text-accent">
                                                                    {
                                                                        player.kills
                                                                    }
                                                                </span>{' '}
                                                                kills
                                                            </span>
                                                            <span className="text-sm">
                                                                #
                                                                {
                                                                    player.placement
                                                                }
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Timeline Controls */}
            <div className="p-4 border-t border-background">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex space-x-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={togglePlayback}
                            className="text-primary hover:text-accent"
                            title={isPlaying ? 'Pause' : 'Play'}
                        >
                            {isPlaying ? (
                                <Pause className="h-5 w-5" />
                            ) : (
                                <Play className="h-5 w-5" />
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleJump('backward')}
                            className="text-primary hover:text-accent"
                            title="15 seconds backward"
                        >
                            <SkipBack className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleTimelineStep('backward')}
                            className="text-primary hover:text-accent"
                            title="5 seconds backward"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleTimelineStep('forward')}
                            className="text-primary hover:text-accent"
                            title="5 seconds forward"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleJump('forward')}
                            className="text-primary hover:text-accent"
                            title="15 seconds forward"
                        >
                            <SkipForward className="h-5 w-5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={cyclePlaybackSpeed}
                            className="text-xs"
                            title="Change playback speed"
                        >
                            {playbackSpeed}x
                        </Button>
                    </div>
                    <span className="text-sm font-medium">
                        {getCurrentTime()} /{' '}
                        {telemetry?.duration
                            ? formatDuration(telemetry.duration)
                            : match?.duration
                            ? formatDuration(match.duration)
                            : '00:00'}
                    </span>
                </div>

                {/* Timeline markers for zones */}
                <div className="relative w-full h-1 mb-1">
                    {telemetry?.playZones?.map((_, index) => {
                        const position =
                            (index / (telemetry.playZones.length - 1)) * 100;
                        return (
                            <div
                                key={`zone-marker-${index}`}
                                className={`absolute w-1 h-3 bg-blue-500 rounded-sm cursor-pointer hover:h-4 transition-all ${
                                    index <= currentZoneIndex
                                        ? 'opacity-100'
                                        : 'opacity-50'
                                }`}
                                style={{
                                    left: `${position}%`,
                                    transform: 'translateX(-50%)',
                                }}
                                title={`Circle ${index + 1}`}
                                onClick={() => {
                                    const newProgress =
                                        (index /
                                            (telemetry.playZones.length - 1)) *
                                        100;
                                    setTimeProgress(newProgress);
                                    if (isPlaying) setIsPlaying(false);
                                }}
                            />
                        );
                    })}
                </div>

                <Slider
                    value={[timeProgress]}
                    min={0}
                    max={100}
                    step={0.5}
                    onValueChange={(values) => {
                        setTimeProgress(values[0]);
                        if (isPlaying) setIsPlaying(false);
                    }}
                    className="w-full"
                />
                <div className="flex justify-between mt-2">
                    <span className="text-xs">Landing</span>
                    <span className="text-xs">Mid-Game</span>
                    <span className="text-xs">Final Circle</span>
                </div>
            </div>
        </Card>
    );
}
