export interface Vector2 {
  x: number;
  y: number;
}

export enum GameStatus {
  StartScreen,
  LevelSelection,
  Playing,
  Paused,
  GameOver,
  Victory,
}

export interface Entity {
  id: number;
  position: Vector2;
  size: Vector2;
  hp: number;
  maxHp: number;
}

export interface Player extends Entity {
  velocity: Vector2;
  mp: number;
  maxMp: number;
  isAttacking: boolean;
  attackTimer: number;
  attackCooldown: number;
  stamina: number;
  maxStamina: number;
  isInvincible: boolean;
  invincibilityTimer: number;
  direction: 'left' | 'right';
  consecutiveHits: number;
  isCharging: boolean;
  chargeTimer: number;
  isAzureCharging: boolean;
  azureChargeTimer: number;
  footstepCooldown: number;
}

export interface Enemy extends Entity {
  type: 'minion' | 'boss' | 'bat';
  name?: string;
  velocity: Vector2;
  attackRange: number;
  speed: number;
  isHit: boolean;
  hitTimer: number;
  isCritHit: boolean;
  critHitTimer: number;
  attackCooldown?: number;
}

export interface Clone {
  id: number;
  position: Vector2;
  velocity: Vector2;
  size: Vector2;
  lifeSpan: number; // in frames
  attackCooldown: number; // in frames
  direction: 'left' | 'right';
}

export interface Attack {
  id: number;
  position: Vector2;
  size: Vector2;
  type: 'normal' | 'special' | 'manaBurst' | 'lightning' | 'charged' | 'azureLightning' | 'manaShockwave' | 'projectile';
  duration: number;
  velocity: Vector2;
  from?: Vector2;
  to?: Vector2;
  source?: 'player' | 'clone';
}

export interface GameState {
  status: GameStatus;
  player: Player;
  enemies: Enemy[];
  attacks: Attack[];
  clones: Clone[];
  cloneSpellUnlocked: boolean;
  keysPressed: { [key: string]: boolean };
  lore: string | null;
  isLoadingLore: boolean;
  mousePosition: Vector2;
  currentLevel: number;
  currentWave: number;
  isMobile: boolean;
  touchMoveDirection: Vector2 | null;
  highestLevelUnlocked: number;
}

export type Action =
  | { type: 'TICK' }
  | { type: 'KEY_DOWN'; payload: string }
  | { type: 'KEY_UP'; payload: string }
  | { type: 'START_GAME' }
  | { type: 'SELECT_LEVEL'; payload: number }
  | { type: 'START_CHARGING' }
  | { type: 'STOP_CHARGING' }
  | { type: 'START_AZURE_CHARGE' }
  | { type: 'STOP_AZURE_CHARGE' }
  | { type: 'CREATE_CLONE' }
  | { type: 'LIGHTNING_STRIKE' }
  | { type: 'FETCH_LORE_START' }
  | { type: 'FETCH_LORE_SUCCESS'; payload: string }
  | { type: 'RESET_GAME' }
  | { type: 'MOUSE_MOVE'; payload: Vector2 }
  | { type: 'TOUCH_MOVE_START'; payload: Vector2 }
  | { type: 'TOUCH_MOVE_END' }
  | { type: 'TOGGLE_PAUSE' };