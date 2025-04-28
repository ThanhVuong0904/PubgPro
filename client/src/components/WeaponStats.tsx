import { Folder } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Weapon {
  name: string;
  kills: number;
  accuracy: string;
  headshots: string;
  usage: number; // percentage for the width of the bar
}

interface WeaponStatsProps {
  weapons: Weapon[];
}

export default function WeaponStats({ weapons = [] }: WeaponStatsProps) {
  // If no weapons data is provided, show placeholder
  if (!weapons.length) {
    return (
      <Card className="stat-card">
        <CardContent className="p-5">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <Folder className="h-5 w-5 mr-2 text-primary" />
            Weapon Mastery
          </h3>
          <div className="text-center text-muted-foreground py-4">
            No weapon data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="stat-card">
      <CardContent className="p-5">
        <h3 className="text-lg font-bold mb-4 flex items-center">
          <Folder className="h-5 w-5 mr-2 text-primary" />
          Weapon Mastery
        </h3>
        <div className="space-y-4">
          {weapons.map((weapon, index) => (
            <div key={index} className="flex items-center">
              <div className="w-16 h-16 bg-background rounded flex items-center justify-center mr-3">
                {/* Weapon icon would ideally come from an API or icon library */}
                <svg
                  className="h-10 w-10 text-primary"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 4L14 8L9 9L7 12L9 15L7 18L9 21L12 19L15 21L18 19L21 21L19 18L21 15L19 12L21 9L18 7Z" />
                </svg>
              </div>
              <div className="flex-grow">
                <div className="flex justify-between mb-1">
                  <span className="font-medium">{weapon.name}</span>
                  <span className="text-primary">{weapon.kills} Kills</span>
                </div>
                <div className="w-full bg-background rounded-full h-2">
                  <div
                    className="weapon-bar"
                    style={{ width: `${weapon.usage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  {/* <span>Accuracy: {weapon.accuracy}</span> */}
                  <span>Headshot: {weapon.headshots}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
