// Player Types
export interface Player {
  id: string;
  type: string;
  attributes: {
    name: string;
    shardId: string;
    stats: null;
    titleId: string;
    updatedAt: string;
    patchVersion: string;
  };
  relationships: {
    assets: {
      data: Asset[];
    };
    matches: {
      data: Match[];
    };
  };
  links: {
    schema: string;
    self: string;
  };
}

// Match Types
export interface Match {
  id: string;
  type: string;
  attributes?: {
    createdAt: string;
    duration: number;
    gameMode: string;
    mapName: string;
    isCustomMatch: boolean;
    seasonState: string;
    shardId: string;
    stats: null;
    tags: null;
    titleId: string;
  };
}

// Asset Types
export interface Asset {
  id: string;
  type: string;
}

// Season Types
export interface Season {
  id: string;
  type: string;
  attributes: {
    isCurrentSeason: boolean;
    isOffseason: boolean;
  };
}

// Participant Types
export interface Participant {
  id: string;
  type: string;
  attributes: {
    actor: string;
    shardId: string;
    stats: {
      DBNOs: number;
      assists: number;
      boosts: number;
      damageDealt: number;
      deathType: string;
      headshotKills: number;
      heals: number;
      killPlace: number;
      killStreaks: number;
      kills: number;
      longestKill: number;
      name: string;
      playerId: string;
      revives: number;
      rideDistance: number;
      roadKills: number;
      swimDistance: number;
      teamKills: number;
      timeSurvived: number;
      vehicleDestroys: number;
      walkDistance: number;
      weaponsAcquired: number;
      winPlace: number;
    };
  };
}

// Roster Types
export interface Roster {
  id: string;
  type: string;
  attributes: {
    shardId: string;
    stats: {
      rank: number;
      teamId: number;
    };
    won: string;
  };
  relationships: {
    participants: {
      data: Participant[];
    };
    team: {
      data: null;
    };
  };
}

// Telemetry Types
export interface TelemetryEvent {
  _D: string;
  _T: string;
  common: {
    isGame: number;
  };
  character: {
    name: string;
    teamId: number;
    health: number;
    location: {
      x: number;
      y: number;
      z: number;
    };
    ranking: number;
    accountId: string;
  };
  elapsedTime: number;
  numAlivePlayers: number;
}

export interface LogPlayerPosition extends TelemetryEvent {
  _T: "LogPlayerPosition";
  character: {
    name: string;
    teamId: number;
    health: number;
    location: {
      x: number;
      y: number;
      z: number;
    };
    ranking: number;
    accountId: string;
  };
}

export interface LogPlayerAttack extends TelemetryEvent {
  _T: "LogPlayerAttack";
  attackId: number;
  attacker: {
    name: string;
    teamId: number;
    health: number;
    location: {
      x: number;
      y: number;
      z: number;
    };
    ranking: number;
    accountId: string;
  };
  attackType: string;
  weapon: {
    itemId: string;
    stackCount: number;
    category: string;
    subCategory: string;
  };
  vehicle: null;
}

export interface LogPlayerKill extends TelemetryEvent {
  _T: "LogPlayerKill";
  attackId: number;
  killer: {
    name: string;
    teamId: number;
    health: number;
    location: {
      x: number;
      y: number;
      z: number;
    };
    ranking: number;
    accountId: string;
  };
  victim: {
    name: string;
    teamId: number;
    health: number;
    location: {
      x: number;
      y: number;
      z: number;
    };
    ranking: number;
    accountId: string;
  };
  damageTypeCategory: string;
  damageCauserName: string;
  distance: number;
}
