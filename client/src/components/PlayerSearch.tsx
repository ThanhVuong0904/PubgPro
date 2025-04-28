import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface PlayerSearchProps {
  onSearchSuccess?: (platform: string, playerName: string) => void;
  onSearchError?: (error: string) => void;
  defaultPlayer?: string;
  defaultPlatform?: string;
}

export default function PlayerSearch({ 
  onSearchSuccess, 
  onSearchError,
  defaultPlayer = "",
  defaultPlatform = "steam"
}: PlayerSearchProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState(defaultPlayer);
  const [platform, setPlatform] = useState(defaultPlatform);
  const [region, setRegion] = useState("pc-na");
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a player name",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await apiRequest("POST", "/api/search", {
        playerName: searchQuery,
        platform,
        region
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({
        queryKey: [`/api/players/${platform}/${searchQuery}`]
      });
      
      if (onSearchSuccess) {
        onSearchSuccess(platform, searchQuery);
      } else {
        setLocation(`/player/${platform}/${searchQuery}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to search player";
      
      if (onSearchError) {
        onSearchError(errorMessage);
      } else {
        toast({
          title: "Search Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="mb-8">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-center">Find Player Statistics</h2>
        <div className="relative">
          <Input
            type="text"
            placeholder="Enter PUBG player name..."
            className="w-full bg-secondary border border-secondary/80 focus:border-primary rounded-lg px-4 py-6 text-foreground placeholder-muted-foreground"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          <Button
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
            onClick={handleSearch}
            disabled={isLoading}
          >
            {isLoading ? "Searching..." : "Search"}
          </Button>
        </div>
        <div className="flex justify-center mt-3 space-x-4 text-sm">
          <Button 
            variant={platform === "steam" ? "default" : "ghost"} 
            size="sm"
            onClick={() => setPlatform("steam")}
            className={platform === "steam" ? "text-primary-foreground" : "text-primary"}
          >
            PC
          </Button>
          <Button 
            variant={platform === "psn" || platform === "xbox" ? "default" : "ghost"} 
            size="sm"
            onClick={() => setPlatform("xbox")}
            className={platform === "psn" || platform === "xbox" ? "text-primary-foreground" : "text-muted-foreground hover:text-primary"}
          >
            Console
          </Button>
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger className="w-[140px] h-8 text-sm bg-secondary border-secondary/80">
              <SelectValue placeholder="Select server" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pc-na">NA Server</SelectItem>
              <SelectItem value="pc-eu">EU Server</SelectItem>
              <SelectItem value="pc-as">AS Server</SelectItem>
              <SelectItem value="pc-krjp">KR/JP Server</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
