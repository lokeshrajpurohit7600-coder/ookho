export interface GravityConfig {
  x: number;
  y: number;
  scale: number;
}

export interface BoundariesConfig {
  enabled: boolean;
  thickness: number;
}

export interface WorldConfig {
  gravity: GravityConfig;
  frictionAir: number;
  restitution: number;
  boundaries: BoundariesConfig;
}

export interface CursorRepulsionConfig {
  enabled: boolean;
  radius: number;
  forceMagnitude: number;
}

export interface DragConstraintConfig {
  stiffness: number;
  angularStiffness: number;
}

export interface InteractionConfig {
  cursorRepulsion: CursorRepulsionConfig;
  dragConstraint: DragConstraintConfig;
}

export interface EntityDimensions {
  width?: number;
  height?: number;
  radius?: number;
}

export interface SpawnRatio {
  x: number;
  y: number;
}

export type EntityType = 'card' | 'orb' | 'terminal';

export interface EngineEntity {
  id: string;
  type: EntityType;
  title: string;
  category: string;
  mass: number;
  dimensions?: EntityDimensions;
  spawnRatio: SpawnRatio;
  styleClasses: string;
  // Dynamic payload for rich interactive cybersecurity cards/terminals/orbs
  metadata?: {
    subtitle?: string;
    status?: 'ONLINE' | 'ACTIVE' | 'WARNING' | 'ALERT' | 'ENCRYPTED';
    badge?: string;
    accentColor?: 'cyan' | 'emerald' | 'purple' | 'amber' | 'rose';
    metrics?: Array<{ label: string; value: string; change?: string }>;
    initialLogs?: string[];
  };
}

export interface AntiGravityConfig {
  world: WorldConfig;
  interaction: InteractionConfig;
  entities: EngineEntity[];
}

export interface PhysicsTelemetry {
  fps: number;
  bodyCount: number;
  activeGravityY: number;
  activeGravityX: number;
  airFriction: number;
  restitution: number;
  cursorDistance: number;
  cursorSpeed: number;
  engineTime: number;
  isRepelling: boolean;
}
