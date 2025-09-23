export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

export const PLAYER_SIZE = { x: 40, y: 60 };
export const PLAYER_SPEED = 4;
export const PLAYER_CHARGING_SPEED_MULTIPLIER = 0.3;
export const PLAYER_HP = 100;
export const PLAYER_MP = 100;
export const PLAYER_STAMINA = 100;
export const STAMINA_REGEN_RATE = 0.5;
export const NORMAL_ATTACK_STAMINA_COST = 25;
export const PLAYER_ATTACK_COOLDOWN = 30; // frames
export const PLAYER_ATTACK_ANIMATION_DURATION = 15; // frames
export const PLAYER_INVINCIBILITY_DURATION = 90; // frames
export const PLAYER_CHARGE_DURATION_FRAMES = 180; // 3 seconds * 60fps
export const PLAYER_CHARGE_STAMINA_COST_PER_FRAME = 0.2;
export const PLAYER_FOOTSTEP_COOLDOWN = 20; // frames


export const NORMAL_ATTACK_SIZE = { x: 70, y: 50 };
export const NORMAL_ATTACK_DURATION = 15; // frames

export const CHARGED_ATTACK_RADIUS = 200;
export const CHARGED_ATTACK_DAMAGE = 100;
export const CHARGED_ATTACK_DURATION = 40; // frames

export const AZURE_LIGHTNING_MANA_COST_PERCENT = 0.4;
export const AZURE_LIGHTNING_CHARGE_DURATION_FRAMES = 180; // 3 seconds
export const AZURE_LIGHTNING_CRIT_MULTIPLIER = 2.0; // 200% bonus damage
export const AZURE_LIGHTNING_BASE_DAMAGE = 40;
export const AZURE_LIGHTNING_DURATION = 40;

export const SHORT_PRESS_FRAME_THRESHOLD = 15; // 0.25 seconds
export const MANA_SHOCKWAVE_MANA_COST_PERCENT = 0.25;
export const MANA_SHOCKWAVE_DAMAGE_PERCENT = 0.3; // 30% of max HP
export const MANA_SHOCKWAVE_RADIUS = 150;
export const MANA_SHOCKWAVE_DURATION = 30; // frames

export const CLONE_MANA_COST_PERCENT = 0.15;
export const CLONE_LIFESPAN_FRAMES = 10 * 60; // 10 seconds
export const CLONE_ATTACK_COOLDOWN = 60; // 1 second
export const CLONE_ATTACK_RANGE = 300;
export const CLONE_SPEED = 2.5;

export const ENEMY_KILL_MANA_RECOVERY_CHANCE = 0.3;
export const ENEMY_KILL_MANA_RECOVERY_AMOUNT_PERCENT = 0.2;
export const BOSS_KILL_HEALTH_RECOVERY_PERCENT = 0.1;
export const ENEMY_KILL_HEALTH_RECOVERY_CHANCE = 0.1;
export const ENEMY_KILL_HEALTH_RECOVERY_AMOUNT_PERCENT = 0.05;

export const LIGHTNING_STRIKE_MANA_COST_PERCENT = 0.5;
export const LIGHTNING_STRIKE_DAMAGE_PERCENT = 0.75;
export const LIGHTNING_STRIKE_DURATION = 20; // frames

export const ENEMY_MINION_SIZE = { x: 35, y: 50 };
export const ENEMY_MINION_HP = 20;
export const ENEMY_MINION_SPEED = 1.5;
export const ENEMY_MINION_ATTACK_RANGE = 200;

export const ENEMY_BAT_SIZE = { x: 40, y: 30 };
export const ENEMY_BAT_HP = 15;
export const ENEMY_BAT_SPEED = 2;
export const ENEMY_BAT_ATTACK_RANGE = 250;

export const ENEMY_BOSS_SIZE = { x: 80, y: 100 };
export const ENEMY_BOSS_HP = 200;
export const ENEMY_BOSS_SPEED = 1;
export const ENEMY_BOSS_ATTACK_RANGE = 300;
export const ENEMY_BOSS_ATTACK_COOLDOWN = 120; // 2 seconds at 60fps
export const ENEMY_BOSS_PROJECTILE_SIZE = { x: 20, y: 20 };
export const ENEMY_BOSS_PROJECTILE_SPEED = 5;
export const ENEMY_BOSS_PROJECTILE_DAMAGE = 15;