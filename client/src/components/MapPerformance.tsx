import { Map } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface MapData {
    name: string;
    wins: number;
    matches: number;
    kd: number;
    avgRank: string;
}

interface MapPerformanceProps {
    maps: MapData[];
}

export default function MapPerformance({ maps = [] }: MapPerformanceProps) {
    console.log({ maps });
    // If no map data is provided, show placeholder
    if (!maps.length) {
        return (
            <Card className="stat-card">
                <CardContent className="p-5">
                    <h3 className="text-lg font-bold mb-4 flex items-center">
                        <Map className="h-5 w-5 mr-2 text-primary" />
                        Map Performance
                    </h3>
                    <div className="text-center text-muted-foreground py-4">
                        No map data available
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="stat-card">
            <CardContent className="p-5">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                    <Map className="h-5 w-5 mr-2 text-primary" />
                    Map Performance
                </h3>
                <div className="space-y-4">
                    {maps.map((map, index) => (
                        <div key={index} className="bg-background rounded p-3">
                            <div className="flex justify-between mb-2">
                                <span className="font-medium">{map.name}</span>
                                <Badge
                                    variant="outline"
                                    className="bg-primary/20 text-primary text-xs px-2 py-0.5"
                                >
                                    {map.wins} Wins
                                </Badge>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-center text-sm">
                                <div>
                                    <div className="text-muted-foreground">
                                        Matches
                                    </div>
                                    <div className="font-medium">
                                        {map.matches}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">
                                        K/D
                                    </div>
                                    <div className="font-medium text-accent">
                                        {map.kd}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">
                                        Avg. Rank
                                    </div>
                                    <div className="font-medium">
                                        {map.avgRank}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
