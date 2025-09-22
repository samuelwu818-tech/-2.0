

import React, { useEffect, useReducer, useCallback, FC, useRef } from 'react';
import { GameStatus, Player as PlayerType, Enemy as EnemyType, GameState, Attack, Vector2, Action, Clone as CloneType } from './types';
import {
  GAME_WIDTH, GAME_HEIGHT, PLAYER_SIZE, PLAYER_SPEED, PLAYER_HP, PLAYER_MP, PLAYER_STAMINA, NORMAL_ATTACK_STAMINA_COST, STAMINA_REGEN_RATE, PLAYER_ATTACK_COOLDOWN,
  PLAYER_INVINCIBILITY_DURATION, NORMAL_ATTACK_SIZE, NORMAL_ATTACK_DURATION, PLAYER_CHARGE_DURATION_FRAMES, PLAYER_CHARGE_STAMINA_COST_PER_FRAME, PLAYER_CHARGING_SPEED_MULTIPLIER, CHARGED_ATTACK_RADIUS,
  CHARGED_ATTACK_DAMAGE, CHARGED_ATTACK_DURATION, PLAYER_FOOTSTEP_COOLDOWN, PLAYER_ATTACK_ANIMATION_DURATION,
  ENEMY_MINION_SIZE, ENEMY_MINION_HP,
  ENEMY_MINION_SPEED, ENEMY_MINION_ATTACK_RANGE, ENEMY_BOSS_SIZE, ENEMY_BOSS_HP, ENEMY_BOSS_SPEED,
  ENEMY_BOSS_ATTACK_RANGE, ENEMY_BAT_SIZE, ENEMY_BAT_HP, ENEMY_BAT_SPEED, ENEMY_BAT_ATTACK_RANGE,
  ENEMY_KILL_MANA_RECOVERY_CHANCE, ENEMY_KILL_MANA_RECOVERY_AMOUNT_PERCENT,
  LIGHTNING_STRIKE_MANA_COST_PERCENT, LIGHTNING_STRIKE_DAMAGE_PERCENT, LIGHTNING_STRIKE_DURATION,
  AZURE_LIGHTNING_MANA_COST_PERCENT, AZURE_LIGHTNING_CHARGE_DURATION_FRAMES, AZURE_LIGHTNING_BASE_DAMAGE, AZURE_LIGHTNING_CRIT_MULTIPLIER, AZURE_LIGHTNING_DURATION,
  SHORT_PRESS_FRAME_THRESHOLD, MANA_SHOCKWAVE_MANA_COST_PERCENT, MANA_SHOCKWAVE_DAMAGE_PERCENT, MANA_SHOCKWAVE_RADIUS, MANA_SHOCKWAVE_DURATION, BOSS_KILL_HEALTH_RECOVERY_PERCENT,
  CLONE_MANA_COST_PERCENT, CLONE_LIFESPAN_FRAMES, CLONE_ATTACK_COOLDOWN, CLONE_ATTACK_RANGE, CLONE_SPEED, ENEMY_KILL_HEALTH_RECOVERY_CHANCE, ENEMY_KILL_HEALTH_RECOVERY_AMOUNT_PERCENT,
} from './constants';
import { getGameLore } from './services/geminiService';
import { HeartIcon, StaminaIcon, BrainIcon, ManaIcon } from './components/Icons';
import { MobileControls } from './components/MobileControls';
import { 
    initAudio, playPlayerAttack, playEnemyHit, 
    playPlayerHit, playEnemyDefeat, playVictory, playGameOver, playStartGame,
    playManaRecovery, playLightningStrike, playChargeStart, playChargedAttack,
    playAzureChargeStart, playAzureLightningFire, playManaShockwave, playHealthRecovery,
    playAmbiance, stopAmbiance, playFootstep, playEnemyAttack, playCloneSpell, playCloneAttack,
} from './services/audioService';

interface Wave {
  enemies: Omit<EnemyType, 'id' | 'velocity' | 'isHit' | 'hitTimer' | 'isCritHit' | 'critHitTimer'>[];
}
interface Level {
  name: string;
  waves: Wave[];
}

const LEVELS: Level[] = [
    {
        name: "Level 1",
        waves: [
            { // Wave 1
                enemies: [
                    { type: 'minion', position: { x: 200, y: GAME_HEIGHT - ENEMY_MINION_SIZE.y - 20 }, size: ENEMY_MINION_SIZE, hp: ENEMY_MINION_HP, maxHp: ENEMY_MINION_HP, attackRange: ENEMY_MINION_ATTACK_RANGE, speed: ENEMY_MINION_SPEED },
                    { type: 'minion', position: { x: 400, y: GAME_HEIGHT - ENEMY_MINION_SIZE.y - 20 }, size: ENEMY_MINION_SIZE, hp: ENEMY_MINION_HP, maxHp: ENEMY_MINION_HP, attackRange: ENEMY_MINION_ATTACK_RANGE, speed: ENEMY_MINION_SPEED },
                    { type: 'minion', position: { x: 600, y: GAME_HEIGHT - ENEMY_MINION_SIZE.y - 20 }, size: ENEMY_MINION_SIZE, hp: ENEMY_MINION_HP, maxHp: ENEMY_MINION_HP, attackRange: ENEMY_MINION_ATTACK_RANGE, speed: ENEMY_MINION_SPEED },
                ]
            },
            { // Wave 2
                enemies: [
                    { type: 'minion', position: { x: 250, y: GAME_HEIGHT - ENEMY_MINION_SIZE.y - 20 }, size: ENEMY_MINION_SIZE, hp: ENEMY_MINION_HP, maxHp: ENEMY_MINION_HP, attackRange: ENEMY_MINION_ATTACK_RANGE, speed: ENEMY_MINION_SPEED },
                    { type: 'bat', position: { x: 350, y: GAME_HEIGHT / 2 }, size: ENEMY_BAT_SIZE, hp: ENEMY_BAT_HP, maxHp: ENEMY_BAT_HP, attackRange: ENEMY_BAT_ATTACK_RANGE, speed: ENEMY_BAT_SPEED },
                    { type: 'bat', position: { x: 550, y: GAME_HEIGHT / 2 - 50 }, size: ENEMY_BAT_SIZE, hp: ENEMY_BAT_HP, maxHp: ENEMY_BAT_HP, attackRange: ENEMY_BAT_ATTACK_RANGE, speed: ENEMY_BAT_SPEED },
                    { type: 'minion', position: { x: 650, y: GAME_HEIGHT - ENEMY_MINION_SIZE.y - 20 }, size: ENEMY_MINION_SIZE, hp: ENEMY_MINION_HP, maxHp: ENEMY_MINION_HP, attackRange: ENEMY_MINION_ATTACK_RANGE, speed: ENEMY_MINION_SPEED },
                ]
            },
            { // Boss Wave
                enemies: [
                    { type: 'boss', name: '黑熊精 (Black Bear Demon)', position: { x: 700, y: GAME_HEIGHT - ENEMY_BOSS_SIZE.y - 20 }, size: ENEMY_BOSS_SIZE, hp: ENEMY_BOSS_HP, maxHp: ENEMY_BOSS_HP, attackRange: ENEMY_BOSS_ATTACK_RANGE, speed: ENEMY_BOSS_SPEED },
                ]
            }
        ]
    },
    {
        name: "Level 2",
        waves: [
            { // Wave 1
                enemies: [
                    { type: 'minion', position: { x: 200, y: GAME_HEIGHT - ENEMY_MINION_SIZE.y - 20 }, size: ENEMY_MINION_SIZE, hp: ENEMY_MINION_HP, maxHp: ENEMY_MINION_HP, attackRange: ENEMY_MINION_ATTACK_RANGE, speed: ENEMY_MINION_SPEED },
                    { type: 'bat', position: { x: 350, y: GAME_HEIGHT / 2 }, size: ENEMY_BAT_SIZE, hp: ENEMY_BAT_HP, maxHp: ENEMY_BAT_HP, attackRange: ENEMY_BAT_ATTACK_RANGE, speed: ENEMY_BAT_SPEED },
                    { type: 'bat', position: { x: 550, y: GAME_HEIGHT / 2 - 50 }, size: ENEMY_BAT_SIZE, hp: ENEMY_BAT_HP, maxHp: ENEMY_BAT_HP, attackRange: ENEMY_BAT_ATTACK_RANGE, speed: ENEMY_BAT_SPEED },
                    { type: 'minion', position: { x: 650, y: GAME_HEIGHT - ENEMY_MINION_SIZE.y - 20 }, size: ENEMY_MINION_SIZE, hp: ENEMY_MINION_HP, maxHp: ENEMY_MINION_HP, attackRange: ENEMY_MINION_ATTACK_RANGE, speed: ENEMY_MINION_SPEED },
                ]
            },
            { // Boss Wave
                enemies: [
                    { type: 'boss', name: '白骨精 (White Bone Demon)', position: { x: 700, y: GAME_HEIGHT - ENEMY_BOSS_SIZE.y - 20 }, size: ENEMY_BOSS_SIZE, hp: ENEMY_BOSS_HP * 1.5, maxHp: ENEMY_BOSS_HP * 1.5, attackRange: ENEMY_BOSS_ATTACK_RANGE, speed: ENEMY_BOSS_SPEED * 1.2 },
                ]
            }
        ]
    },
    {
        name: "Level 3",
        waves: [
            { // Wave 1
                enemies: [
                    { type: 'minion', position: { x: 150, y: GAME_HEIGHT - ENEMY_MINION_SIZE.y - 20 }, size: ENEMY_MINION_SIZE, hp: ENEMY_MINION_HP, maxHp: ENEMY_MINION_HP, attackRange: ENEMY_MINION_ATTACK_RANGE, speed: ENEMY_MINION_SPEED },
                    { type: 'minion', position: { x: 400, y: GAME_HEIGHT - ENEMY_MINION_SIZE.y - 20 }, size: ENEMY_MINION_SIZE, hp: ENEMY_MINION_HP, maxHp: ENEMY_MINION_HP, attackRange: ENEMY_MINION_ATTACK_RANGE, speed: ENEMY_MINION_SPEED },
                    { type: 'minion', position: { x: 650, y: GAME_HEIGHT - ENEMY_MINION_SIZE.y - 20 }, size: ENEMY_MINION_SIZE, hp: ENEMY_MINION_HP, maxHp: ENEMY_MINION_HP, attackRange: ENEMY_MINION_ATTACK_RANGE, speed: ENEMY_MINION_SPEED },
                    { type: 'bat', position: { x: 300, y: GAME_HEIGHT / 2 }, size: ENEMY_BAT_SIZE, hp: ENEMY_BAT_HP, maxHp: ENEMY_BAT_HP, attackRange: ENEMY_BAT_ATTACK_RANGE, speed: ENEMY_BAT_SPEED },
                    { type: 'bat', position: { x: 500, y: GAME_HEIGHT / 2 - 50 }, size: ENEMY_BAT_SIZE, hp: ENEMY_BAT_HP, maxHp: ENEMY_BAT_HP, attackRange: ENEMY_BAT_ATTACK_RANGE, speed: ENEMY_BAT_SPEED },
                ]
            },
            { // Wave 2
                enemies: [
                     { type: 'minion', position: { x: 100, y: GAME_HEIGHT - ENEMY_MINION_SIZE.y - 20 }, size: ENEMY_MINION_SIZE, hp: ENEMY_MINION_HP, maxHp: ENEMY_MINION_HP, attackRange: ENEMY_MINION_ATTACK_RANGE, speed: ENEMY_MINION_SPEED * 1.2 },
                     { type: 'minion', position: { x: 700, y: GAME_HEIGHT - ENEMY_MINION_SIZE.y - 20 }, size: ENEMY_MINION_SIZE, hp: ENEMY_MINION_HP, maxHp: ENEMY_MINION_HP, attackRange: ENEMY_MINION_ATTACK_RANGE, speed: ENEMY_MINION_SPEED * 1.2 },
                     { type: 'bat', position: { x: 250, y: GAME_HEIGHT / 2 }, size: ENEMY_BAT_SIZE, hp: ENEMY_BAT_HP, maxHp: ENEMY_BAT_HP, attackRange: ENEMY_BAT_ATTACK_RANGE, speed: ENEMY_BAT_SPEED * 1.1 },
                     { type: 'bat', position: { x: 350, y: GAME_HEIGHT / 2 - 50 }, size: ENEMY_BAT_SIZE, hp: ENEMY_BAT_HP, maxHp: ENEMY_BAT_HP, attackRange: ENEMY_BAT_ATTACK_RANGE, speed: ENEMY_BAT_SPEED * 1.1 },
                     { type: 'bat', position: { x: 450, y: GAME_HEIGHT / 2 }, size: ENEMY_BAT_SIZE, hp: ENEMY_BAT_HP, maxHp: ENEMY_BAT_HP, attackRange: ENEMY_BAT_ATTACK_RANGE, speed: ENEMY_BAT_SPEED * 1.1 },
                     { type: 'bat', position: { x: 550, y: GAME_HEIGHT / 2 - 50 }, size: ENEMY_BAT_SIZE, hp: ENEMY_BAT_HP, maxHp: ENEMY_BAT_HP, attackRange: ENEMY_BAT_ATTACK_RANGE, speed: ENEMY_BAT_SPEED * 1.1 },
                ]
            },
            { // Wave 3
                enemies: [
                    ...Array.from({ length: 8 }).map((_, i) => ({
                         type: 'minion' as const, 
                         position: { x: 100 + i * 85, y: GAME_HEIGHT - ENEMY_MINION_SIZE.y - 20 }, 
                         size: ENEMY_MINION_SIZE, hp: ENEMY_MINION_HP, maxHp: ENEMY_MINION_HP, 
                         attackRange: ENEMY_MINION_ATTACK_RANGE, 
                         speed: ENEMY_MINION_SPEED 
                    }))
                ]
            },
             { // Wave 4
                enemies: [
                    // Left Group
                    { type: 'minion', position: { x: 100, y: GAME_HEIGHT - ENEMY_MINION_SIZE.y - 20 }, size: ENEMY_MINION_SIZE, hp: ENEMY_MINION_HP, maxHp: ENEMY_MINION_HP, attackRange: ENEMY_MINION_ATTACK_RANGE, speed: ENEMY_MINION_SPEED * 1.3 },
                    { type: 'minion', position: { x: 150, y: GAME_HEIGHT - ENEMY_MINION_SIZE.y - 20 }, size: ENEMY_MINION_SIZE, hp: ENEMY_MINION_HP, maxHp: ENEMY_MINION_HP, attackRange: ENEMY_MINION_ATTACK_RANGE, speed: ENEMY_MINION_SPEED * 1.3 },
                    { type: 'bat', position: { x: 125, y: GAME_HEIGHT / 2 }, size: ENEMY_BAT_SIZE, hp: ENEMY_BAT_HP, maxHp: ENEMY_BAT_HP, attackRange: ENEMY_BAT_ATTACK_RANGE, speed: ENEMY_BAT_SPEED * 1.3 },
                    // Right Group
                    { type: 'minion', position: { x: 650, y: GAME_HEIGHT - ENEMY_MINION_SIZE.y - 20 }, size: ENEMY_MINION_SIZE, hp: ENEMY_MINION_HP, maxHp: ENEMY_MINION_HP, attackRange: ENEMY_MINION_ATTACK_RANGE, speed: ENEMY_MINION_SPEED * 1.3 },
                    { type: 'minion', position: { x: 700, y: GAME_HEIGHT - ENEMY_MINION_SIZE.y - 20 }, size: ENEMY_MINION_SIZE, hp: ENEMY_MINION_HP, maxHp: ENEMY_MINION_HP, attackRange: ENEMY_MINION_ATTACK_RANGE, speed: ENEMY_MINION_SPEED * 1.3 },
                    { type: 'bat', position: { x: 675, y: GAME_HEIGHT / 2 }, size: ENEMY_BAT_SIZE, hp: ENEMY_BAT_HP, maxHp: ENEMY_BAT_HP, attackRange: ENEMY_BAT_ATTACK_RANGE, speed: ENEMY_BAT_SPEED * 1.3 },
                ]
            },
            { // Wave 5 (Boss)
                enemies: [
                    { type: 'boss', name: '百眼魔君 (Hundred-Eyed Demon Lord)', position: { x: 700, y: GAME_HEIGHT - ENEMY_BOSS_SIZE.y - 20 }, size: ENEMY_BOSS_SIZE, hp: ENEMY_BOSS_HP * 2.5, maxHp: ENEMY_BOSS_HP * 2.5, attackRange: ENEMY_BOSS_ATTACK_RANGE, speed: ENEMY_BOSS_SPEED * 1.3 },
                    { type: 'bat', position: { x: 200, y: GAME_HEIGHT / 2 - 100 }, size: ENEMY_BAT_SIZE, hp: ENEMY_BAT_HP * 2, maxHp: ENEMY_BAT_HP * 2, attackRange: ENEMY_BAT_ATTACK_RANGE, speed: ENEMY_BAT_SPEED * 1.5 },
                    { type: 'bat', position: { x: 500, y: GAME_HEIGHT / 2 - 100 }, size: ENEMY_BAT_SIZE, hp: ENEMY_BAT_HP * 2, maxHp: ENEMY_BAT_HP * 2, attackRange: ENEMY_BAT_ATTACK_RANGE, speed: ENEMY_BAT_SPEED * 1.5 },
                ]
            }
        ]
    }
];

const spawnEnemiesForWave = (levelIndex: number, waveIndex: number): EnemyType[] => {
    if (!LEVELS[levelIndex] || !LEVELS[levelIndex].waves[waveIndex]) {
        return [];
    }
    return LEVELS[levelIndex].waves[waveIndex].enemies.map((enemy, index) => ({
        ...enemy,
        id: Date.now() + index,
        velocity: { x: 0, y: 0 },
        isHit: false,
        hitTimer: 0,
        isCritHit: false,
        critHitTimer: 0,
    }));
};

const createInitialState = (): GameState => {
    const isMobile = typeof window !== 'undefined' && /Android|BlackBerry|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
    return {
      status: GameStatus.StartScreen,
      player: {
        id: 0,
        position: { x: 50, y: GAME_HEIGHT - PLAYER_SIZE.y - 20 },
        size: PLAYER_SIZE,
        hp: PLAYER_HP,
        maxHp: PLAYER_HP,
        mp: PLAYER_MP,
        maxMp: PLAYER_MP,
        stamina: PLAYER_STAMINA,
        maxStamina: PLAYER_STAMINA,
        velocity: { x: 0, y: 0 },
        isAttacking: false,
        attackTimer: 0,
        attackCooldown: 0,
        isInvincible: false,
        invincibilityTimer: 0,
        direction: 'right',
        consecutiveHits: 0,
        isCharging: false,
        chargeTimer: 0,
        isAzureCharging: false,
        azureChargeTimer: 0,
        footstepCooldown: 0,
      },
      enemies: [],
      attacks: [],
      clones: [],
      cloneSpellUnlocked: false,
      keysPressed: {},
      lore: null,
      isLoadingLore: false,
      mousePosition: { x: GAME_WIDTH / 2, y: GAME_HEIGHT / 2 },
      currentLevel: 1,
      currentWave: 0,
      isMobile,
      touchMoveDirection: null,
    };
};

const checkCollision = (a: { position: { x: number, y: number }, size: { x: number, y: number } }, b: { position: { x: number, y: number }, size: { x: number, y: number } }) => {
  return (
    a.position.x < b.position.x + b.size.x &&
    a.position.x + a.size.x > b.position.x &&
    a.position.y < b.position.y + b.size.y &&
    a.position.y + a.size.y > b.position.y
  );
};

const gameReducer = (state: GameState, action: Action): GameState => {
  switch (action.type) {
    case 'START_GAME':
      playAmbiance(1);
      return { 
          ...createInitialState(), 
          status: GameStatus.Playing,
          enemies: spawnEnemiesForWave(0, 0),
          currentLevel: 1,
          currentWave: 0
      };
    case 'RESET_GAME':
      stopAmbiance();
      return createInitialState();
    case 'KEY_DOWN':
      if (state.status !== GameStatus.Playing) return state;
      return { ...state, keysPressed: { ...state.keysPressed, [action.payload]: true } };
    case 'KEY_UP':
      if (state.status !== GameStatus.Playing) return state;
      const newKeys = { ...state.keysPressed };
      delete newKeys[action.payload];
      return { ...state, keysPressed: newKeys };
    case 'MOUSE_MOVE':
      if (state.status !== GameStatus.Playing) return state;
      return { ...state, mousePosition: action.payload };
    case 'TOUCH_MOVE_START':
      if (state.status !== GameStatus.Playing) return state;
      return { ...state, touchMoveDirection: action.payload };
    case 'TOUCH_MOVE_END':
      if (state.status !== GameStatus.Playing) return state;
      return { ...state, touchMoveDirection: null };
    case 'CREATE_CLONE': {
        if (state.status !== GameStatus.Playing) return state;
        if (!state.cloneSpellUnlocked) return state;
        const cost = state.player.maxMp * CLONE_MANA_COST_PERCENT;
        if (state.player.mp < cost) return state;
        
        playCloneSpell();

        const newClone: CloneType = {
            id: Date.now(),
            position: { x: state.player.position.x + (state.player.direction === 'right' ? 30 : -30), y: state.player.position.y },
            velocity: { x: 0, y: 0 },
            size: PLAYER_SIZE,
            lifeSpan: CLONE_LIFESPAN_FRAMES,
            attackCooldown: 0,
            direction: state.player.direction,
        };

        return {
            ...state,
            player: {
                ...state.player,
                mp: state.player.mp - cost,
            },
            clones: [...state.clones, newClone],
        };
    }
    case 'START_CHARGING': {
        if (state.status !== GameStatus.Playing) return state;
        if (state.player.stamina < NORMAL_ATTACK_STAMINA_COST) return state;
        playChargeStart();
        return {
            ...state,
            player: {
                ...state.player,
                isCharging: true,
                chargeTimer: 0,
            }
        };
    }
    case 'STOP_CHARGING': {
        if (state.status !== GameStatus.Playing) return state;
        if (!state.player.isCharging) return state;

        const chargeTime = state.player.chargeTimer;
        const isFullyCharged = chargeTime >= PLAYER_CHARGE_DURATION_FRAMES;

        const playerWithResetCharge = {
            ...state.player,
            isCharging: false,
            chargeTimer: 0,
        };

        if (isFullyCharged) {
            playChargedAttack();
            const playerCenter = { 
                x: state.player.position.x + state.player.size.x / 2, 
                y: state.player.position.y + state.player.size.y / 2 
            };
            
            let target: EnemyType | null = null;
            let livingEnemies = state.enemies.filter(e => e.hp > 0);

            if (state.isMobile) {
                // On mobile, target the closest enemy
                let minDistance = Infinity;
                livingEnemies.forEach(enemy => {
                    const enemyCenter = { x: enemy.position.x + enemy.size.x / 2, y: enemy.position.y + enemy.size.y / 2 };
                    const dx = playerCenter.x - enemyCenter.x;
                    const dy = playerCenter.y - enemyCenter.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < minDistance) {
                        minDistance = distance;
                        target = enemy;
                    }
                });
            } else {
                // On desktop, use mouse direction
                const mousePos = state.mousePosition;
                const attackDir = { x: mousePos.x - playerCenter.x, y: mousePos.y - playerCenter.y };
                const attackDirMag = Math.sqrt(attackDir.x * attackDir.x + attackDir.y * attackDir.y) || 1;
                const normAttackDir = { x: attackDir.x / attackDirMag, y: attackDir.y / attackDirMag };

                let minAngle = Infinity;
                livingEnemies.forEach(enemy => {
                    const enemyCenter = { x: enemy.position.x + enemy.size.x / 2, y: enemy.position.y + enemy.size.y / 2 };
                    const toEnemyDir = { x: enemyCenter.x - playerCenter.x, y: enemyCenter.y - playerCenter.y };
                    
                    const toEnemyMag = Math.sqrt(toEnemyDir.x * toEnemyDir.x + toEnemyDir.y * toEnemyDir.y);
                    if (toEnemyMag === 0) return;

                    const dotProduct = (normAttackDir.x * toEnemyDir.x) + (normAttackDir.y * toEnemyDir.y);
                    const cosAngle = dotProduct / toEnemyMag;
                    const angle = Math.acos(cosAngle);

                    if (angle < Math.PI / 4 && angle < minAngle) { // 45 degree cone
                        minAngle = angle;
                        target = enemy;
                    }
                });
            }

            let newPlayerHp = playerWithResetCharge.hp;
            let newPlayerMp = playerWithResetCharge.mp;
            let newEnemies = state.enemies;
            let attackEndPoint: Vector2;

            if (target) {
                attackEndPoint = { x: target.position.x + target.size.x / 2, y: target.position.y + target.size.y / 2 };
                newEnemies = state.enemies.map(enemy => {
                    if (enemy.id === target!.id) {
                        const newEnemy = { ...enemy };
                        const oldHp = newEnemy.hp;
                        newEnemy.hp -= CHARGED_ATTACK_DAMAGE;
                        newEnemy.isCritHit = true;
                        newEnemy.critHitTimer = 20;

                        if (oldHp > 0 && newEnemy.hp <= 0) {
                            playEnemyDefeat();
                            if (newEnemy.type === 'boss') {
                                playHealthRecovery();
                                newPlayerHp = Math.min(playerWithResetCharge.maxHp, newPlayerHp + playerWithResetCharge.maxHp * BOSS_KILL_HEALTH_RECOVERY_PERCENT);
                            }
                            if (Math.random() < ENEMY_KILL_MANA_RECOVERY_CHANCE) {
                                playManaRecovery();
                                newPlayerMp = Math.min(playerWithResetCharge.maxMp, newPlayerMp + playerWithResetCharge.maxMp * ENEMY_KILL_MANA_RECOVERY_AMOUNT_PERCENT);
                            }
                            if (Math.random() < ENEMY_KILL_HEALTH_RECOVERY_CHANCE) {
                                playHealthRecovery();
                                newPlayerHp = Math.min(playerWithResetCharge.maxHp, newPlayerHp + playerWithResetCharge.maxHp * ENEMY_KILL_HEALTH_RECOVERY_AMOUNT_PERCENT);
                            }
                        } else if (oldHp > 0) {
                            playEnemyHit();
                        }
                        return newEnemy;
                    }
                    return enemy;
                });
            } else {
                 if (state.isMobile) {
                    attackEndPoint = {
                        x: playerCenter.x + (state.player.direction === 'right' ? 1000 : -1000),
                        y: playerCenter.y
                    };
                } else {
                    const mousePos = state.mousePosition;
                    const attackDir = { x: mousePos.x - playerCenter.x, y: mousePos.y - playerCenter.y };
                    const attackDirMag = Math.sqrt(attackDir.x * attackDir.x + attackDir.y * attackDir.y) || 1;
                    const normAttackDir = { x: attackDir.x / attackDirMag, y: attackDir.y / attackDirMag };
                    attackEndPoint = {
                        x: playerCenter.x + normAttackDir.x * 1000,
                        y: playerCenter.y + normAttackDir.y * 1000,
                    };
                }
            }
            
            const newAttackFX: Attack = {
                id: Date.now(),
                type: 'charged',
                from: playerCenter,
                to: attackEndPoint,
                duration: CHARGED_ATTACK_DURATION,
                position: { x: 0, y: 0 },
                size: { x: 0, y: 0 },
                velocity: { x: 0, y: 0 },
            };
            
            return {
                ...state,
                player: { ...playerWithResetCharge, mp: newPlayerMp, hp: newPlayerHp },
                enemies: newEnemies,
                attacks: [...state.attacks, newAttackFX],
            };

        } else {
            // Normal attack
            if (playerWithResetCharge.attackCooldown > 0 || playerWithResetCharge.stamina < NORMAL_ATTACK_STAMINA_COST) {
                return { ...state, player: playerWithResetCharge };
            }
            playPlayerAttack();
            
            const playerCenter = { 
                x: state.player.position.x + state.player.size.x / 2, 
                y: state.player.position.y + state.player.size.y / 2 
            };
            const dx = state.mousePosition.x - playerCenter.x;
            const dy = state.mousePosition.y - playerCenter.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const dirX = dx / dist;
            const dirY = dy / dist;
            
            const attackDistance = 30;

            const newAttack: Attack = {
                id: Date.now(),
                type: 'normal',
                position: {
                    x: playerCenter.x + dirX * attackDistance - NORMAL_ATTACK_SIZE.x / 2,
                    y: playerCenter.y + dirY * attackDistance - NORMAL_ATTACK_SIZE.y / 2,
                },
                size: NORMAL_ATTACK_SIZE,
                duration: NORMAL_ATTACK_DURATION,
                velocity: { x: 0, y: 0 },
                source: 'player',
            };
            
            return {
                ...state,
                player: {
                    ...playerWithResetCharge,
                    attackCooldown: PLAYER_ATTACK_COOLDOWN,
                    stamina: playerWithResetCharge.stamina - NORMAL_ATTACK_STAMINA_COST,
                    isAttacking: true,
                    attackTimer: PLAYER_ATTACK_ANIMATION_DURATION,
                },
                attacks: [...state.attacks, newAttack],
            };
        }
    }
    case 'START_AZURE_CHARGE': {
      if (state.status !== GameStatus.Playing) return state;
      playAzureChargeStart();
      return {
          ...state,
          player: {
              ...state.player,
              isAzureCharging: true,
              azureChargeTimer: 0,
          }
      };
    }
    case 'STOP_AZURE_CHARGE': {
        if (state.status !== GameStatus.Playing) return state;
        if (!state.player.isAzureCharging) return state;

        const chargeFrames = state.player.azureChargeTimer;
        const isFullyCharged = chargeFrames >= AZURE_LIGHTNING_CHARGE_DURATION_FRAMES;
        
        const playerWithResetCharge = {
            ...state.player,
            isAzureCharging: false,
            azureChargeTimer: 0,
        };

        // Short Press: Mana Shockwave
        if (chargeFrames > 0 && chargeFrames < SHORT_PRESS_FRAME_THRESHOLD) {
            const cost = playerWithResetCharge.maxMp * MANA_SHOCKWAVE_MANA_COST_PERCENT;
            if (playerWithResetCharge.mp < cost) {
                return { ...state, player: playerWithResetCharge };
            }
            playManaShockwave();
            
            const playerCenter = { x: state.player.position.x + state.player.size.x / 2, y: state.player.position.y + state.player.size.y / 2 };
            let newEnemies = state.enemies;
            let newPlayerHp = playerWithResetCharge.hp;
            let newPlayerMp = playerWithResetCharge.mp - cost;

            newEnemies = newEnemies.map(enemy => {
                if (enemy.hp <= 0) return enemy;
                const enemyCenter = { x: enemy.position.x + enemy.size.x / 2, y: enemy.position.y + enemy.size.y / 2 };
                const dx = playerCenter.x - enemyCenter.x;
                const dy = playerCenter.y - enemyCenter.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance <= MANA_SHOCKWAVE_RADIUS) {
                    const newEnemy = { ...enemy };
                    const oldHp = newEnemy.hp;
                    const damage = newEnemy.maxHp * MANA_SHOCKWAVE_DAMAGE_PERCENT;
                    newEnemy.hp -= damage;
                    newEnemy.isHit = true;
                    newEnemy.hitTimer = 15;

                    if (oldHp > 0 && newEnemy.hp <= 0) {
                        playEnemyDefeat();
                        if (newEnemy.type === 'boss') {
                            playHealthRecovery();
                            newPlayerHp = Math.min(playerWithResetCharge.maxHp, newPlayerHp + playerWithResetCharge.maxHp * BOSS_KILL_HEALTH_RECOVERY_PERCENT);
                        }
                        if (Math.random() < ENEMY_KILL_MANA_RECOVERY_CHANCE) {
                            playManaRecovery();
                            newPlayerMp = Math.min(playerWithResetCharge.maxMp, newPlayerMp + playerWithResetCharge.maxMp * ENEMY_KILL_MANA_RECOVERY_AMOUNT_PERCENT);
                        }
                        if (Math.random() < ENEMY_KILL_HEALTH_RECOVERY_CHANCE) {
                            playHealthRecovery();
                            newPlayerHp = Math.min(playerWithResetCharge.maxHp, newPlayerHp + playerWithResetCharge.maxHp * ENEMY_KILL_HEALTH_RECOVERY_AMOUNT_PERCENT);
                        }
                    } else if (oldHp > 0) {
                        playEnemyHit();
                    }
                    return newEnemy;
                }
                return enemy;
            });

            const newAttack: Attack = {
                id: Date.now(),
                type: 'manaShockwave',
                position: playerCenter,
                size: { x: MANA_SHOCKWAVE_RADIUS * 2, y: MANA_SHOCKWAVE_RADIUS * 2 },
                duration: MANA_SHOCKWAVE_DURATION,
                velocity: {x: 0, y: 0},
            };

            return {
                ...state,
                player: { ...playerWithResetCharge, mp: newPlayerMp, hp: newPlayerHp },
                enemies: newEnemies,
                attacks: [...state.attacks, newAttack],
            };
        }
        
        if (isFullyCharged) {
            const cost = playerWithResetCharge.maxMp * AZURE_LIGHTNING_MANA_COST_PERCENT;
            if (playerWithResetCharge.mp < cost) {
                 return { ...state, player: playerWithResetCharge };
            }

            playAzureLightningFire();
            
            let target: EnemyType | null = null;
            let minDistance = Infinity;
            
            const playerCenter = { 
                x: state.player.position.x + state.player.size.x / 2, 
                y: state.player.position.y + state.player.size.y / 2 
            };

            state.enemies.forEach(enemy => {
                if (enemy.hp <= 0) return;
                const enemyCenter = { x: enemy.position.x + enemy.size.x / 2, y: enemy.position.y + enemy.size.y / 2 };
                const dx = playerCenter.x - enemyCenter.x;
                const dy = playerCenter.y - enemyCenter.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < minDistance) {
                    minDistance = distance;
                    target = enemy;
                }
            });

            if (!target) {
                return { ...state, player: { ...playerWithResetCharge, mp: playerWithResetCharge.mp - cost } };
            }
            
            let newPlayerHp = playerWithResetCharge.hp;
            let newPlayerMp = playerWithResetCharge.mp - cost;
            
            const newEnemies = state.enemies.map(enemy => {
                if (enemy.id === target!.id) {
                    const newEnemy = { ...enemy };
                    const oldHp = newEnemy.hp;
                    const damage = AZURE_LIGHTNING_BASE_DAMAGE + AZURE_LIGHTNING_BASE_DAMAGE * AZURE_LIGHTNING_CRIT_MULTIPLIER;
                    newEnemy.hp -= damage;
                    newEnemy.isCritHit = true;
                    newEnemy.critHitTimer = 20;

                    if (oldHp > 0 && newEnemy.hp <= 0) {
                        playEnemyDefeat();
                        if (newEnemy.type === 'boss') {
                            playHealthRecovery();
                            newPlayerHp = Math.min(playerWithResetCharge.maxHp, newPlayerHp + playerWithResetCharge.maxHp * BOSS_KILL_HEALTH_RECOVERY_PERCENT);
                        }
                        if (Math.random() < ENEMY_KILL_MANA_RECOVERY_CHANCE) {
                            playManaRecovery();
                            newPlayerMp = Math.min(playerWithResetCharge.maxMp, newPlayerMp + playerWithResetCharge.maxMp * ENEMY_KILL_MANA_RECOVERY_AMOUNT_PERCENT);
                        }
                        if (Math.random() < ENEMY_KILL_HEALTH_RECOVERY_CHANCE) {
                            playHealthRecovery();
                            newPlayerHp = Math.min(playerWithResetCharge.maxHp, newPlayerHp + playerWithResetCharge.maxHp * ENEMY_KILL_HEALTH_RECOVERY_AMOUNT_PERCENT);
                        }
                    } else if (oldHp > 0) {
                        playEnemyHit();
                    }
                    return newEnemy;
                }
                return enemy;
            });

            const targetCenter = { 
                x: target.position.x + target.size.x / 2, 
                y: target.position.y + target.size.y / 2 
            };

            const newAttack: Attack = {
                id: Date.now(),
                type: 'azureLightning',
                from: playerCenter,
                to: targetCenter,
                duration: AZURE_LIGHTNING_DURATION,
                position: {x: 0, y: 0}, size: {x: 0, y: 0}, velocity: {x: 0, y: 0},
            };

            return {
                ...state,
                player: { ...playerWithResetCharge, mp: newPlayerMp, hp: newPlayerHp },
                enemies: newEnemies,
                attacks: [...state.attacks, newAttack],
            };
        }

        return { ...state, player: playerWithResetCharge };
    }
    case 'LIGHTNING_STRIKE': {
      if (state.status !== GameStatus.Playing) return state;
      const cost = state.player.maxMp * LIGHTNING_STRIKE_MANA_COST_PERCENT;
      if (state.player.mp < cost) return state;

      let target: EnemyType | null = null;
      let minDistance = Infinity;

      const playerCenter = { 
        x: state.player.position.x + state.player.size.x / 2, 
        y: state.player.position.y + state.player.size.y / 2 
      };

      const targetPoint = state.isMobile ? playerCenter : state.mousePosition;

      state.enemies.forEach(enemy => {
        if (enemy.hp <= 0) return;
        const enemyCenter = { x: enemy.position.x + enemy.size.x / 2, y: enemy.position.y + enemy.size.y / 2 };
        const dx = targetPoint.x - enemyCenter.x;
        const dy = targetPoint.y - enemyCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < minDistance) {
          minDistance = distance;
          target = enemy;
        }
      });

      if (!target) return state;
      
      playLightningStrike();
      
      let newPlayerHp = state.player.hp;
      let newPlayerMp = state.player.mp - cost;
      
      const newEnemies = state.enemies.map(enemy => {
        if (enemy.id === target!.id) {
          const newEnemy = { ...enemy };
          const oldHp = newEnemy.hp;
          const damage = newEnemy.maxHp * LIGHTNING_STRIKE_DAMAGE_PERCENT;
          newEnemy.hp -= damage;
          newEnemy.isCritHit = true;
          newEnemy.critHitTimer = 20;

          if (oldHp > 0 && newEnemy.hp <= 0) {
            playEnemyDefeat();
            if (newEnemy.type === 'boss') {
                playHealthRecovery();
                newPlayerHp = Math.min(state.player.maxHp, newPlayerHp + state.player.maxHp * BOSS_KILL_HEALTH_RECOVERY_PERCENT);
            }
            if (Math.random() < ENEMY_KILL_MANA_RECOVERY_CHANCE) {
              playManaRecovery();
              newPlayerMp = Math.min(state.player.maxMp, newPlayerMp + state.player.maxMp * ENEMY_KILL_MANA_RECOVERY_AMOUNT_PERCENT);
            }
            if (Math.random() < ENEMY_KILL_HEALTH_RECOVERY_CHANCE) {
                playHealthRecovery();
                newPlayerHp = Math.min(state.player.maxHp, newPlayerHp + state.player.maxHp * ENEMY_KILL_HEALTH_RECOVERY_AMOUNT_PERCENT);
            }
          } else if (oldHp > 0) {
            playEnemyHit();
          }
          return newEnemy;
        }
        return enemy;
      });

      const targetCenter = { 
          x: target.position.x + target.size.x / 2, 
          y: target.position.y + target.size.y / 2 
      };

      const newAttack: Attack = {
        id: Date.now(),
        type: 'lightning',
        from: playerCenter,
        to: targetCenter,
        duration: LIGHTNING_STRIKE_DURATION,
        position: {x: 0, y: 0},
        size: {x: 0, y: 0},
        velocity: {x: 0, y: 0},
      };

      return {
        ...state,
        player: { ...state.player, mp: newPlayerMp, hp: newPlayerHp },
        enemies: newEnemies,
        attacks: [...state.attacks, newAttack],
      };
    }
    case 'FETCH_LORE_START':
      return { ...state, isLoadingLore: true, lore: null };
    case 'FETCH_LORE_SUCCESS':
      return { ...state, isLoadingLore: false, lore: action.payload };
    case 'TOGGLE_PAUSE': {
      if (state.status === GameStatus.Playing) {
        stopAmbiance();
        return { ...state, status: GameStatus.Paused };
      }
      if (state.status === GameStatus.Paused) {
        playAmbiance(state.currentLevel);
        return { ...state, status: GameStatus.Playing };
      }
      return state;
    }
    case 'TICK': {
      if (state.status !== GameStatus.Playing) return state;

      let { player, enemies, attacks, keysPressed, mousePosition, touchMoveDirection, isMobile, clones } = { ...state };
      
      if (player.footstepCooldown > 0) {
          player.footstepCooldown--;
      }

      if (player.attackTimer > 0) {
          player.attackTimer--;
      } else {
          player.isAttacking = false;
      }

      if (player.isCharging) {
          if (player.stamina > PLAYER_CHARGE_STAMINA_COST_PER_FRAME) {
              player.chargeTimer++;
              player.stamina = Math.max(0, player.stamina - PLAYER_CHARGE_STAMINA_COST_PER_FRAME);
          } else {
              player.isCharging = false;
              player.chargeTimer = 0;
          }
      } else {
          player.stamina = Math.min(player.maxStamina, player.stamina + STAMINA_REGEN_RATE);
      }
      
      if (player.isAzureCharging) {
          player.azureChargeTimer++;
      }

      // === CLONE LOGIC START ===
      let newAttacksFromClones: Attack[] = [];
      clones = clones.map(clone => {
          clone.lifeSpan--;
          if (clone.attackCooldown > 0) clone.attackCooldown--;

          let target: EnemyType | null = null;
          let minDistance = CLONE_ATTACK_RANGE;
          
          enemies.forEach(enemy => {
              if (enemy.hp <= 0) return;
              const enemyCenter = { x: enemy.position.x + enemy.size.x / 2, y: enemy.position.y + enemy.size.y / 2 };
              const cloneCenter = { x: clone.position.x + clone.size.x / 2, y: clone.position.y + clone.size.y / 2 };
              const dx = enemyCenter.x - cloneCenter.x;
              const dy = enemyCenter.y - cloneCenter.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              if (distance < minDistance) {
                  minDistance = distance;
                  target = enemy;
              }
          });
          
          if (target) {
              const cloneCenter = { x: clone.position.x + clone.size.x / 2, y: clone.position.y + clone.size.y / 2 };
              const targetCenter = { x: target.position.x + target.size.x / 2, y: target.position.y + target.size.y / 2 };
              const dx = targetCenter.x - cloneCenter.x;
              const dy = targetCenter.y - cloneCenter.y;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
              clone.direction = dx > 0 ? 'right' : 'left';

              const attackRadius = 50; 
              if (dist > attackRadius) {
                  clone.velocity.x = (dx / dist) * CLONE_SPEED;
                  clone.velocity.y = (dy / dist) * CLONE_SPEED;
              } else {
                  clone.velocity = { x: 0, y: 0 };
                  if (clone.attackCooldown <= 0) {
                      playCloneAttack();
                      
                      const dirX = dx / dist;
                      const dirY = dy / dist;
                      const attackDistance = 30;
                      
                      const newAttack: Attack = {
                          id: Date.now() + clone.id,
                          type: 'normal',
                          position: {
                              x: cloneCenter.x + dirX * attackDistance - NORMAL_ATTACK_SIZE.x / 2,
                              y: cloneCenter.y + dirY * attackDistance - NORMAL_ATTACK_SIZE.y / 2,
                          },
                          size: NORMAL_ATTACK_SIZE,
                          duration: NORMAL_ATTACK_DURATION,
                          velocity: { x: 0, y: 0 },
                          source: 'clone',
                      };
                      newAttacksFromClones.push(newAttack);
                      clone.attackCooldown = CLONE_ATTACK_COOLDOWN;
                  }
              }
          } else {
              clone.velocity = { x: 0, y: 0 };
          }
          
          clone.position.x += clone.velocity.x;
          clone.position.y += clone.velocity.y;

          const groundLevel = GAME_HEIGHT - clone.size.y - 20;
          clone.position.x = Math.max(0, Math.min(GAME_WIDTH - clone.size.x, clone.position.x));
          clone.position.y = Math.max(0, Math.min(groundLevel, clone.position.y));
          
          return clone;

      }).filter(clone => clone.lifeSpan > 0);
      
      attacks = [...attacks, ...newAttacksFromClones];
      // === CLONE LOGIC END ===

      const currentSpeed = (player.isCharging || player.isAzureCharging) ? PLAYER_SPEED * PLAYER_CHARGING_SPEED_MULTIPLIER : PLAYER_SPEED;

      player.velocity = { x: 0, y: 0 };
      if (touchMoveDirection) {
        player.velocity.x = touchMoveDirection.x * currentSpeed;
        player.velocity.y = touchMoveDirection.y * currentSpeed;
      } else {
        if (keysPressed['a'] || keysPressed['arrowleft']) player.velocity.x = -currentSpeed;
        if (keysPressed['d'] || keysPressed['arrowright']) player.velocity.x = currentSpeed;
        if (keysPressed['w'] || keysPressed['arrowup']) player.velocity.y = -currentSpeed;
        if (keysPressed['s'] || keysPressed['arrowdown']) player.velocity.y = currentSpeed;
      }
      player.position.x += player.velocity.x;
      player.position.y += player.velocity.y;
      
      const isMoving = player.velocity.x !== 0 || player.velocity.y !== 0;
      if (isMoving && player.footstepCooldown <= 0) {
          playFootstep();
          player.footstepCooldown = PLAYER_FOOTSTEP_COOLDOWN;
      }
      
      if (isMobile) {
          if (player.velocity.x < 0) player.direction = 'left';
          else if (player.velocity.x > 0) player.direction = 'right';
      } else {
          player.direction = mousePosition.x < player.position.x + player.size.x / 2 ? 'left' : 'right';
      }

      const groundLevel = GAME_HEIGHT - player.size.y - 20;
      player.position.x = Math.max(0, Math.min(GAME_WIDTH - player.size.x, player.position.x));
      player.position.y = Math.max(0, Math.min(groundLevel, player.position.y));

      if (player.attackCooldown > 0) player.attackCooldown--;
      if (player.invincibilityTimer > 0) player.invincibilityTimer--;
      else player.isInvincible = false;

      let livingEnemies = enemies.filter(e => e.hp > 0);

      enemies = enemies.map(enemy => {
          if (enemy.hp <= 0) return enemy;
          const dx = player.position.x - enemy.position.x;
          const dy = player.position.y - enemy.position.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < enemy.attackRange && dist > 5) {
              enemy.velocity.x = (dx / dist) * enemy.speed;
              enemy.velocity.y = (dy / dist) * enemy.speed;
          } else {
              enemy.velocity.x = 0;
              enemy.velocity.y = 0;
          }
          enemy.position.x += enemy.velocity.x;
          enemy.position.y += enemy.velocity.y;
          
          let enemyGroundLevel = GAME_HEIGHT - enemy.size.y - 20;
          if (enemy.type === 'bat') {
              enemyGroundLevel = GAME_HEIGHT - enemy.size.y;
          }
          
          enemy.position.x = Math.max(0, Math.min(GAME_WIDTH - enemy.size.x, enemy.position.x));
          enemy.position.y = Math.max(0, Math.min(enemyGroundLevel, enemy.position.y));

          if (enemy.hitTimer > 0) enemy.hitTimer--;
          else enemy.isHit = false;
          if (enemy.critHitTimer > 0) enemy.critHitTimer--;
          else enemy.isCritHit = false;

          if (!player.isInvincible && checkCollision(player, enemy)) {
              playEnemyAttack(enemy.type);
              player.hp -= enemy.type === 'boss' ? 20 : (enemy.type === 'bat' ? 12 : 10);
              player.consecutiveHits = 0; 
              if (player.hp > 0) {
                  playPlayerHit();
              }
              player.isInvincible = true;
              player.invincibilityTimer = PLAYER_INVINCIBILITY_DURATION;
          }
          return enemy;
      });

      attacks = attacks.filter(attack => {
        if (attack.type === 'lightning' || attack.type === 'charged' || attack.type === 'azureLightning' || attack.type === 'manaShockwave') {
            attack.duration--;
            return attack.duration > 0;
        }

        attack.position.x += attack.velocity.x;
        attack.position.y += attack.velocity.y;
        attack.duration--;

        if (attack.type === 'normal') {
          enemies = enemies.map(enemy => {
            if (enemy.hp > 0 && !enemy.isHit && !enemy.isCritHit && checkCollision(attack, enemy)) {
              const oldHp = enemy.hp;
              let damage = 10;

              if (attack.source === 'player') {
                player.consecutiveHits++;
                const isCrit = player.consecutiveHits >= 3;
                
                if (isCrit) {
                    damage = Math.round(damage * 1.3);
                    player.consecutiveHits = 0;
                    enemy.isCritHit = true;
                    enemy.critHitTimer = 15;
                } else {
                    enemy.isHit = true;
                    enemy.hitTimer = 15;
                }
              } else { // Clone attacks don't crit but can't miss
                 enemy.isHit = true;
                 enemy.hitTimer = 15;
              }


              enemy.hp -= damage;
              
              if (oldHp > 0 && enemy.hp <= 0) {
                  playEnemyDefeat();
                   if (enemy.type === 'boss') {
                        playHealthRecovery();
                        player.hp = Math.min(player.maxHp, player.hp + player.maxHp * BOSS_KILL_HEALTH_RECOVERY_PERCENT);
                    }
                  if (Math.random() < ENEMY_KILL_MANA_RECOVERY_CHANCE) {
                      playManaRecovery();
                      player.mp = Math.min(player.maxMp, player.mp + player.maxMp * ENEMY_KILL_MANA_RECOVERY_AMOUNT_PERCENT);
                  }
                  if (Math.random() < ENEMY_KILL_HEALTH_RECOVERY_CHANCE) {
                      playHealthRecovery();
                      player.hp = Math.min(player.maxHp, player.hp + player.maxHp * ENEMY_KILL_HEALTH_RECOVERY_AMOUNT_PERCENT);
                  }
              } else if (oldHp > 0) {
                  playEnemyHit();
              }
            }
            return enemy;
          });
        }
        return attack.duration > 0 && 
           attack.position.x > -attack.size.x && attack.position.x < GAME_WIDTH &&
           attack.position.y > -attack.size.y && attack.position.y < GAME_HEIGHT;
      });

      // FIX: Explicitly type `newStatus` to `GameStatus` to prevent incorrect type inference
      // from the guard clause at the beginning of the 'TICK' case. This allows
      // us to assign other statuses like GameOver or Victory.
      let newStatus: GameStatus = state.status;
      if (player.hp <= 0) {
          stopAmbiance();
          playGameOver();
          newStatus = GameStatus.GameOver;
      } else if (livingEnemies.length === 0) {
          const currentLevelData = LEVELS[state.currentLevel - 1];
          const nextWaveIndex = state.currentWave + 1;
          
          if (nextWaveIndex < currentLevelData.waves.length) {
              // Next wave in same level
              return {
                  ...state,
                  currentWave: nextWaveIndex,
                  enemies: spawnEnemiesForWave(state.currentLevel - 1, nextWaveIndex),
                  attacks: [],
              };
          } else {
              // Next level
              const nextLevelIndex = state.currentLevel; // This is the index for LEVELS array
              if (nextLevelIndex < LEVELS.length) {
                  playAmbiance(state.currentLevel + 1);
                  let cloneSpellUnlocked = state.cloneSpellUnlocked;
                  if (state.currentLevel === 2) { // Just completed level 2
                      cloneSpellUnlocked = true;
                  }
                  return {
                      ...state,
                      cloneSpellUnlocked,
                      currentLevel: state.currentLevel + 1,
                      currentWave: 0,
                      enemies: spawnEnemiesForWave(nextLevelIndex, 0),
                      player: {
                          ...player,
                          position: { x: 50, y: GAME_HEIGHT - PLAYER_SIZE.y - 20 },
                          hp: Math.min(player.maxHp, player.hp + 20),
                      },
                      attacks: [],
                      clones: [],
                  };
              } else {
                  stopAmbiance();
                  playVictory();
                  newStatus = GameStatus.Victory;
              }
          }
      }

      return { ...state, player, enemies: enemies.filter(e=>e.hp > 0), attacks, clones, status: newStatus };
    }
    default:
      return state;
  }
};

const Player: FC<{ player: PlayerType }> = ({ player }) => {
    const isFullyCharged = player.chargeTimer >= PLAYER_CHARGE_DURATION_FRAMES;
    const isAzureFullyCharged = player.azureChargeTimer >= AZURE_LIGHTNING_CHARGE_DURATION_FRAMES;
    const isMoving = player.velocity.x !== 0 || player.velocity.y !== 0;
    
    return (
    <div
        style={{
            left: player.position.x,
            top: player.position.y,
            width: player.size.x,
            height: player.size.y,
            transform: player.direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
        }}
        className={`absolute transition-opacity duration-100 ease-linear z-10 ${player.isInvincible && (Math.floor(player.invincibilityTimer / 10) % 2 === 0) ? 'opacity-50' : 'opacity-100'}`}
    >
        {/* Staff (Ruyi Jingu Bang) */}
        <div 
            className={`absolute transition-transform duration-100 ease-out ${player.isAttacking ? '-rotate-12 translate-x-4 -translate-y-1' : 'rotate-12'} ${player.isCharging || player.isAzureCharging ? 'shadow-[0_0_10px_2px_rgba(255,255,100,0.9)]' : ''}`}
            style={{
                width: '8px',
                height: '120%',
                top: '-5px',
                left: '16px',
                backgroundColor: '#dc2626', // red
                borderTop: '5px solid #facc15', // gold
                borderBottom: '5px solid #facc15', // gold
                borderRadius: '4px',
                transformOrigin: 'center 70%',
            }}
        />

        {/* Player Body */}
        <div
            className={`w-full h-full rounded-md border-2 border-yellow-800 shadow-lg relative transition-transform duration-150 ${player.isCharging || player.isAzureCharging ? 'scale-y-95' : ''} ${isMoving ? 'animate-bob' : ''}`}
            style={{ 
                backgroundColor: '#a16207', // A darker, more 'monkey fur' color
                transformOrigin: 'bottom',
            }}
        >
             {/* Head */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-3/4 h-6 bg-orange-200 rounded-t-lg border-2 border-yellow-800">
                 {/* Golden Headband */}
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-4/5 h-1.5 bg-yellow-400 border-y border-yellow-600 rounded-full" />
            </div>
        </div>
        
        {/* Shadow under the player */}
        <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-4/5 h-2 bg-black/30 rounded-full blur-sm ${player.isCharging ? 'shadow-[0_0_20px_5px_rgba(255,255,100,0.7)]' : ''} ${player.isAzureCharging ? 'shadow-[0_0_25px_8px_rgba(100,150,255,0.8)]' : ''}`} />

        {player.isCharging && (
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-full max-w-sm h-2 bg-gray-600 rounded-full border border-gray-400">
                <div
                    className={`h-full rounded-full transition-all duration-100 ease-linear ${isFullyCharged ? 'bg-yellow-400 animate-pulse' : 'bg-white'}`}
                    style={{ width: `${Math.min(100, (player.chargeTimer / PLAYER_CHARGE_DURATION_FRAMES) * 100)}%` }}
                />
            </div>
        )}
         {player.isAzureCharging && (
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-full max-w-sm h-2 bg-gray-600 rounded-full border border-gray-400">
                <div
                    className={`h-full rounded-full transition-all duration-100 ease-linear ${isAzureFullyCharged ? 'bg-cyan-300 animate-pulse' : 'bg-blue-400'}`}
                    style={{ width: `${Math.min(100, (player.azureChargeTimer / AZURE_LIGHTNING_CHARGE_DURATION_FRAMES) * 100)}%` }}
                />
            </div>
        )}
    </div>
    );
};

const Clone: FC<{ clone: CloneType }> = ({ clone }) => {
    return (
    <div
        style={{
            left: clone.position.x,
            top: clone.position.y,
            width: clone.size.x,
            height: clone.size.y,
            transform: clone.direction === 'left' ? 'scaleX(-1)' : 'scaleX(1)',
            opacity: 0.2 + 0.5 * (clone.lifeSpan / CLONE_LIFESPAN_FRAMES), // Fade out
        }}
        className={`absolute transition-all duration-100 ease-linear z-10`}
    >
        <div className="w-full h-full bg-cyan-400 rounded-md border-2 border-cyan-600 shadow-lg animate-pulse"></div>
        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-4/5 h-2 bg-blue-500 border border-cyan-200 rounded-full"></div>
    </div>
    );
};

const Enemy: FC<{ enemy: EnemyType }> = ({ enemy }) => {
    const getEnemyClass = () => {
        if (enemy.isCritHit) return 'bg-yellow-400';
        if (enemy.isHit) return 'bg-red-500';
        switch(enemy.type) {
            case 'boss': return 'bg-gray-700 border-gray-900';
            case 'bat': return 'bg-indigo-700 border-indigo-900';
            default: return 'bg-green-700 border-green-900';
        }
    }
    return (
        <div
            style={{
                left: enemy.position.x,
                top: enemy.position.y,
                width: enemy.size.x,
                height: enemy.size.y,
            }}
            className={`absolute transition-colors duration-100 ${getEnemyClass()} border-2 rounded-lg shadow-2xl z-10`}
        >
        </div>
    );
};

const AttackFX: FC<{ attack: Attack }> = ({ attack }) => {
    if (attack.type === 'normal') {
        const attackColor = attack.source === 'clone' ? 'bg-cyan-300/50' : 'bg-yellow-300/50';
        return (
            <div
                style={{
                    left: attack.position.x,
                    top: attack.position.y,
                    width: attack.size.x,
                    height: attack.size.y,
                }}
                className={`absolute ${attackColor} rounded-lg animate-pulse`}
            ></div>
        );
    }
    if (attack.type === 'manaShockwave') {
        return (
            <div
                style={{
                    left: attack.position.x - attack.size.x / 2,
                    top: attack.position.y - attack.size.y / 2,
                    width: attack.size.x,
                    height: attack.size.y,
                }}
                className="absolute bg-cyan-400/50 rounded-full animate-mana-burst pointer-events-none"
            ></div>
        );
    }
    if (attack.type === 'charged' && attack.from && attack.to) {
        const angle = Math.atan2(attack.to.y - attack.from.y, attack.to.x - attack.from.x) * 180 / Math.PI;
        const distance = Math.sqrt(Math.pow(attack.to.x - attack.from.x, 2) + Math.pow(attack.to.y - attack.from.y, 2));
        
        return (
            <div 
                className="absolute pointer-events-none"
                style={{
                    left: attack.from.x,
                    top: attack.from.y - 10,
                    transform: `rotate(${angle}deg)`,
                    transformOrigin: '0 50%',
                    width: distance,
                    height: 20,
                    opacity: attack.duration / CHARGED_ATTACK_DURATION,
                    background: 'linear-gradient(90deg, rgba(255,255,224,0) 0%, rgba(255,255,224,1) 50%, rgba(255,255,224,0) 100%)',
                    borderRadius: '10px',
                    boxShadow: '0 0 15px 5px rgba(255, 255, 100, 0.7)',
                    transition: 'opacity 0.1s linear',
                }}
            />
        );
    }
    if (attack.type === 'azureLightning' && attack.from && attack.to) {
        const angle = Math.atan2(attack.to.y - attack.from.y, attack.to.x - attack.from.x) * 180 / Math.PI;
        const distance = Math.sqrt(Math.pow(attack.to.x - attack.from.x, 2) + Math.pow(attack.to.y - attack.from.y, 2));
        
        return (
            <div 
                className="absolute pointer-events-none"
                style={{
                    left: attack.from.x,
                    top: attack.from.y - 10,
                    transform: `rotate(${angle}deg)`,
                    transformOrigin: '0 50%',
                    width: distance,
                    height: 20,
                    opacity: attack.duration / AZURE_LIGHTNING_DURATION,
                    background: 'linear-gradient(90deg, rgba(173,216,230,0) 0%, rgba(135,206,250,1) 50%, rgba(173,216,230,0) 100%)',
                    borderRadius: '10px',
                    boxShadow: '0 0 15px 5px rgba(100, 150, 255, 0.7)',
                    transition: 'opacity 0.1s linear',
                }}
            />
        );
    }
    if (attack.type === 'lightning' && attack.from && attack.to) {
        const angle = Math.atan2(attack.to.y - attack.from.y, attack.to.x - attack.from.x) * 180 / Math.PI;
        const distance = Math.sqrt(Math.pow(attack.to.x - attack.from.x, 2) + Math.pow(attack.to.y - attack.from.y, 2));
        
        const points = `0,0 ${distance * 0.25},${-5} ${distance * 0.5},${5} ${distance * 0.75},${-3} ${distance},0`;

        return (
            <div 
                className="absolute pointer-events-none"
                style={{
                    left: attack.from.x,
                    top: attack.from.y,
                    transform: `rotate(${angle}deg)`,
                    transformOrigin: '0 0',
                    width: distance,
                    height: 10,
                    opacity: attack.duration / LIGHTNING_STRIKE_DURATION,
                    transition: 'opacity 0.1s linear'
                }}
            >
                <svg width={distance} height={10} viewBox={`0 -5 ${distance} 10`} className="overflow-visible">
                    <polyline points={points} fill="none" stroke="yellow" strokeWidth="3" strokeLinecap="round" />
                </svg>
            </div>
        );
    }
    return null;
};

const HealthBar: FC<{ current: number, max: number, color: string }> = ({ current, max, color }) => (
    <div className="w-full h-4 bg-gray-700 border border-gray-500 rounded-full overflow-hidden">
        <div
            className={`${color} h-full transition-all duration-300 ease-out`}
            style={{ width: `${Math.max(0, (current / max) * 100)}%` }}
        ></div>
    </div>
);

const BossHealthBar: FC<{ boss: EnemyType }> = ({ boss }) => (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1/2 p-2 bg-black/70 rounded-lg border-2 border-purple-500/50 backdrop-blur-sm z-20">
        <h3 className="text-center text-xl text-purple-300">{boss.name}</h3>
        <div className="mt-1">
            <HealthBar current={boss.hp} max={boss.maxHp} color="bg-purple-600" />
        </div>
    </div>
);

const HUD: FC<{ player: PlayerType; onAskSage: () => void; isLoadingLore: boolean; level: number; wave: number; totalWaves: number; cloneSpellUnlocked: boolean; onPause: () => void; }> = ({ player, onAskSage, isLoadingLore, level, wave, totalWaves, cloneSpellUnlocked, onPause }) => (
    <div className="absolute top-0 left-0 w-full p-4 text-white flex justify-between items-start z-20 pointer-events-none">
        <div className="w-1/3 p-4 bg-black/50 rounded-xl border border-yellow-400/30 backdrop-blur-sm">
            <div className="flex justify-between items-baseline">
                <h2 className="text-2xl text-yellow-400">天命人 (Sky-chosen)</h2>
                 <div className="text-right">
                    <span className="text-lg text-gray-300">關卡 (Level) {level}</span>
                    <br/>
                    <span className="text-md text-gray-400">波 (Wave) {wave}/{totalWaves}</span>
                </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
                <HeartIcon className="w-6 h-6 text-red-500" />
                <HealthBar current={player.hp} max={player.maxHp} color="bg-red-500" />
            </div>
             <div className="flex items-center gap-2 mt-2">
                <ManaIcon className="w-6 h-6 text-cyan-400" />
                <HealthBar current={player.mp} max={player.maxMp} color="bg-cyan-400" />
            </div>
            <div className="flex items-center gap-2 mt-2">
                <StaminaIcon className="w-6 h-6 text-yellow-500" />
                <HealthBar current={player.stamina} max={player.maxStamina} color="bg-yellow-500" />
            </div>
            {cloneSpellUnlocked && (
                 <div className="mt-4 text-center text-cyan-200 border-t border-cyan-200/20 pt-2">
                    <p className="font-bold text-lg">分身術 (Clone Spell) [Q]</p>
                    <p className="text-sm">消耗 (Cost): {Math.round(player.maxMp * CLONE_MANA_COST_PERCENT)} 法力 (MP)</p>
                </div>
            )}
        </div>
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
             <button
                onClick={onPause}
                className="px-4 py-2 bg-gray-700/70 border border-gray-500 rounded-lg text-lg text-gray-200 hover:bg-gray-600 hover:text-white transition-all duration-200 backdrop-blur-sm"
                aria-label="Pause Game"
            >
                暫停 (Pause)
            </button>
            <button
                onClick={onAskSage}
                disabled={isLoadingLore}
                className="flex items-center gap-2 px-4 py-2 bg-purple-800/70 border border-purple-500 rounded-lg text-lg text-purple-200 hover:bg-purple-700 hover:text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
            >
                {isLoadingLore ? (
                    <div className="w-5 h-5 border-2 border-purple-300 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <BrainIcon className="w-6 h-6" />
                )}
                {isLoadingLore ? 'Sage is thinking...' : 'Ask the Sage'}
            </button>
        </div>
    </div>
);

const StartScreen: FC<{ onStart: () => void; isMobile: boolean }> = ({ onStart, isMobile }) => (
    <div 
        className="absolute inset-0 flex flex-col justify-center items-center z-30" 
        style={{
            background: 'radial-gradient(ellipse at center, #1e1b4b 0%, #171717 70%)',
        }}
    >
        <div className="bg-black/60 p-10 rounded-2xl shadow-2xl text-center backdrop-blur-sm shadow-yellow-500/20">
            <h1 className="text-7xl font-bold text-yellow-400 animate-title-glow">天命人傳奇</h1>
            <h2 className="text-4xl text-white mt-2" style={{textShadow: '0 1px 3px rgba(0,0,0,0.5)'}}>Sky-chosen's Quest</h2>
            <p className="text-gray-300 mt-6 max-w-lg leading-relaxed">
                 {isMobile
                    ? "使用方向鍵移動。長按攻擊鍵蓄力。點擊藍色寶珠釋放衝擊波，長按可集聚蒼龍閃電。擊敗第二關Boss後解鎖分身術。擊敗所有惡魔以取得勝利。"
                    : "使用 WASD/方向鍵 移動。長按滑鼠左鍵進行蓄力攻擊。短按右鍵釋放衝擊波，長按則可集聚蒼龍閃電。按下空白鍵施放雷擊。擊敗第二關Boss後按 [Q] 鍵召喚分身。擊敗所有惡魔以取得勝利。"
                }
            </p>
            <button
                onClick={onStart}
                className="mt-10 px-12 py-4 bg-gradient-to-b from-yellow-600 to-yellow-800 text-white text-3xl rounded-lg border-2 border-yellow-900/80 hover:from-yellow-500 hover:to-yellow-700 hover:scale-105 transition-all transform duration-200 shadow-lg shadow-yellow-700/30"
                style={{textShadow: '1px 1px 2px rgba(0,0,0,0.5)'}}
            >
                開始冒險 (Begin Quest)
            </button>
        </div>
    </div>
);

const EndScreen: FC<{ status: GameStatus.GameOver | GameStatus.Victory; onRestart: () => void }> = ({ status, onRestart }) => (
    <div className="absolute inset-0 bg-black/70 flex flex-col justify-center items-center z-30 backdrop-blur-md">
        <h1 className="text-8xl font-bold drop-shadow-lg">
            {status === GameStatus.Victory ? <span className="text-yellow-400">勝利 (Victory)</span> : <span className="text-red-600">戰敗 (Defeated)</span>}
        </h1>
        <p className="text-2xl text-gray-200 mt-4">
            {status === GameStatus.Victory ? "You have vanquished the demonic horde!" : "Your journey ends here, but legends never truly die."}
        </p>
        <button
            onClick={onRestart}
            className="mt-8 px-10 py-4 bg-gray-600 text-white text-3xl rounded-lg border-2 border-gray-800 hover:bg-gray-500 hover:scale-105 transition-all transform duration-200"
        >
            再玩一次 (Play Again)
        </button>
    </div>
);

const PauseScreen: FC<{ onResume: () => void }> = ({ onResume }) => (
    <div className="absolute inset-0 bg-black/70 flex flex-col justify-center items-center z-40 backdrop-blur-md">
        <h1 className="text-8xl font-bold text-gray-200">暫停 (Paused)</h1>
        <button
            onClick={onResume}
            className="mt-8 px-10 py-4 bg-gray-600 text-white text-3xl rounded-lg border-2 border-gray-800 hover:bg-gray-500 hover:scale-105 transition-all transform duration-200"
        >
            繼續 (Resume)
        </button>
    </div>
);


const Background: FC<{ level: number }> = React.memo(({ level }) => {
    if (level !== 1) {
        return <div className="absolute inset-0 w-full h-full bg-gray-800 bg-cover bg-bottom" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/dark-matter.png')" }} />;
    }

    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
            {/* Starry Sky */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#0f0326] via-[#1b0a47] to-[#000000]">
                {/* Twinkling Stars */}
                {[...Array(80)].map((_, i) => (
                    <div 
                        key={i}
                        className="absolute bg-white rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 80}%`, // Keep stars above ground
                            width: `${Math.random() * 2 + 0.5}px`,
                            height: `${Math.random() * 2 + 0.5}px`,
                            opacity: Math.random() * 0.5 + 0.5,
                            animation: `twinkle ${Math.random() * 5 + 3}s infinite alternate ease-in-out`,
                        }}
                    />
                ))}
            </div>
            {/* Scenery Silhouettes */}
            <div 
                className="absolute bottom-5 left-0 w-full h-48 bg-no-repeat bg-bottom"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 150'%3E%3Cpath d='M0 150 L0 100 Q 50 80, 100 110 T 200 100 T 300 120 T 400 90 T 500 110 T 600 100 T 700 130 L 800 100 L 800 150 Z' fill='%230a041a' /%3E%3Cpath d='M150 150 L150 120 L 160 100 L 170 120 Z' fill='%230e0524' /%3E %3Cpath d='M550 150 L550 110 L 565 80 L 580 110 Z' fill='%230e0524' /%3E %3C/svg%3E")`,
                    backgroundSize: 'cover',
                    opacity: 0.8,
                }}
            />
             <div className="absolute bottom-5 left-0 w-full h-24 bg-no-repeat bg-bottom opacity-50"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 100'%3E%3Cpath d='M-10 100 L-10 80 Q 70 60, 150 80 T 300 70 T 450 90 T 600 75 T 750 85 L 810 80 L 810 100 Z' fill='%2304010d' /%3E%3C/svg%3E")`,
                }}
             />
        </div>
    );
});

const App: React.FC = () => {
    const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
    const gameAreaRef = useRef<HTMLDivElement>(null);

    const handleStart = () => {
        initAudio();
        playStartGame();
        dispatch({ type: 'START_GAME' });
    };

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        const key = e.key.toLowerCase();
        if (key === 'p') {
            e.preventDefault();
            dispatch({ type: 'TOGGLE_PAUSE' });
            return;
        }
        if (state.status !== GameStatus.Playing) return;

        if (['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright'].includes(key)) {
            dispatch({ type: 'KEY_DOWN', payload: key });
        }
        if (e.key === ' ') {
            e.preventDefault();
            dispatch({ type: 'LIGHTNING_STRIKE' });
        }
        if (key === 'q') {
            e.preventDefault();
            dispatch({ type: 'CREATE_CLONE' });
        }
    }, [state.status]);

    const handleKeyUp = useCallback((e: KeyboardEvent) => {
        dispatch({ type: 'KEY_UP', payload: e.key.toLowerCase() });
    }, []);

    const handleMouseDown = useCallback((e: MouseEvent) => {
        if (state.status !== GameStatus.Playing) return;
        if (e.button === 0) {
            dispatch({ type: 'START_CHARGING' });
        }
        if (e.button === 2) {
            dispatch({ type: 'START_AZURE_CHARGE' });
        }
    }, [state.status]);

    const handleMouseUp = useCallback((e: MouseEvent) => {
        if (state.status !== GameStatus.Playing) return;
        if (e.button === 0) {
            dispatch({ type: 'STOP_CHARGING' });
        }
        if (e.button === 2) {
            dispatch({ type: 'STOP_AZURE_CHARGE' });
        }
    }, [state.status]);
    
    const handleContextMenu = useCallback((e: MouseEvent) => {
        e.preventDefault();
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (state.status !== GameStatus.Playing) return;
        if (gameAreaRef.current) {
            const rect = gameAreaRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            dispatch({ type: 'MOUSE_MOVE', payload: { x, y } });
        }
    }, [state.status]);
    
    const handleAskSage = async () => {
        dispatch({ type: 'FETCH_LORE_START' });
        const enemyCount = state.enemies.length;
        const bossExists = state.enemies.some(e => e.type === 'boss');
        let situation = "The hero, the Sky-chosen, stands ready at the beginning of his quest.";
        if (enemyCount > 0) {
            situation = `The Sky-chosen faces ${enemyCount} demons in wave ${state.currentWave + 1} of level ${state.currentLevel}. ${bossExists ? 'A powerful boss demon looms among them.' : 'They are minions of a greater evil.'}`;
        }
        if (state.enemies.length === 0 && state.status === GameStatus.Playing) {
             situation = "The final foe is defeated, and a moment of peace settles on the land.";
        }
        const lore = await getGameLore(situation);
        dispatch({ type: 'FETCH_LORE_SUCCESS', payload: lore });
    };

    useEffect(() => {
        const gameDiv = gameAreaRef.current;
        if (!gameDiv) return;

        if (!state.isMobile) {
            window.addEventListener('keydown', handleKeyDown);
            window.addEventListener('keyup', handleKeyUp);
            gameDiv.addEventListener('mousedown', handleMouseDown);
            gameDiv.addEventListener('mouseup', handleMouseUp);
            gameDiv.addEventListener('mousemove', handleMouseMove);
            gameDiv.addEventListener('contextmenu', handleContextMenu);
        }
        
        // FIX: The return type of `setInterval` can be `NodeJS.Timeout` in some environments,
        // which is not assignable to `number`. Using `ReturnType<typeof setInterval>`
        // makes the type compatible regardless of the environment.
        let gameLoop: ReturnType<typeof setInterval>;
        if (state.status === GameStatus.Playing) {
             gameLoop = setInterval(() => {
                dispatch({ type: 'TICK' });
            }, 1000 / 60);
        }

        return () => {
            if (!state.isMobile) {
                window.removeEventListener('keydown', handleKeyDown);
                window.removeEventListener('keyup', handleKeyUp);
                gameDiv.removeEventListener('mousedown', handleMouseDown);
                gameDiv.removeEventListener('mouseup', handleMouseUp);
                gameDiv.removeEventListener('mousemove', handleMouseMove);
                gameDiv.removeEventListener('contextmenu', handleContextMenu);
            }
            clearInterval(gameLoop);
        };
    }, [state.status, state.isMobile, handleKeyDown, handleKeyUp, handleMouseDown, handleMouseUp, handleMouseMove, handleContextMenu]);

    const boss = state.enemies.find(e => e.type === 'boss');
    const totalWaves = LEVELS[state.currentLevel - 1]?.waves.length || 0;

    return (
        <div className="w-screen h-screen bg-gray-900 flex justify-center items-center overflow-hidden" style={{fontFamily: "'Ma Shan Zheng', cursive"}}>
            <div
                ref={gameAreaRef}
                className={`relative border-4 border-yellow-800/50 shadow-2xl overflow-hidden ${state.isMobile ? '' : 'cursor-crosshair'}`}
                style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
            >
                {state.status === GameStatus.StartScreen && <StartScreen onStart={handleStart} isMobile={state.isMobile} />}
                {(state.status === GameStatus.GameOver || state.status === GameStatus.Victory) && <EndScreen status={state.status} onRestart={() => dispatch({ type: 'RESET_GAME' })} />}
                {state.status === GameStatus.Paused && <PauseScreen onResume={() => dispatch({ type: 'TOGGLE_PAUSE' })} />}

                {(state.status === GameStatus.Playing || state.status === GameStatus.Paused) && (
                    <>
                        <Background level={state.currentLevel} />
                        <HUD 
                            player={state.player} 
                            onAskSage={handleAskSage} 
                            isLoadingLore={state.isLoadingLore} 
                            level={state.currentLevel} 
                            wave={state.currentWave + 1} 
                            totalWaves={totalWaves} 
                            cloneSpellUnlocked={state.cloneSpellUnlocked}
                            onPause={() => dispatch({ type: 'TOGGLE_PAUSE' })}
                        />
                        {boss && <BossHealthBar boss={boss} />}
                        <Player player={state.player} />
                        {state.enemies.map(enemy => <Enemy key={enemy.id} enemy={enemy} />)}
                        {state.clones.map(clone => <Clone key={clone.id} clone={clone} />)}
                        {state.attacks.map(attack => <AttackFX key={attack.id} attack={attack} />)}
                        
                        {state.lore && (
                             <div key={state.lore} className="absolute bottom-4 left-1/2 -translate-x-1/2 w-3/4 p-3 bg-purple-900/80 border border-purple-500 rounded-lg text-purple-200 text-center text-lg z-30 backdrop-blur-sm animate-fade-in-out">
                                <p><strong>Sage's Whisper:</strong> "{state.lore}"</p>
                            </div>
                        )}
                        
                         {/* Ground */}
                        <div className="absolute bottom-0 left-0 w-full h-5 bg-stone-700 border-t-4 border-stone-800 z-10"></div>
                    </>
                )}
                 {state.status === GameStatus.Playing && state.isMobile && <MobileControls dispatch={dispatch} cloneSpellUnlocked={state.cloneSpellUnlocked} />}
            </div>
             <style>{`
                .cursor-crosshair { cursor: crosshair; }
                .animate-ping-slow { animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; }
                @keyframes ping {
                  75%, 100% {
                    transform: scale(2);
                    opacity: 0;
                  }
                }
                 @keyframes fade-in-out {
                    0%, 100% { opacity: 0; transform: translateY(20px) translateX(-50%); }
                    10%, 90% { opacity: 1; transform: translateY(0) translateX(-50%); }
                }
                .animate-fade-in-out {
                    animation: fade-in-out 6s ease-in-out forwards;
                }
                @keyframes mana-burst {
                    0% { transform: scale(0.2); opacity: 0.8; }
                    100% { transform: scale(1); opacity: 0; }
                }
                .animate-mana-burst {
                    animation: mana-burst 0.5s ease-out forwards;
                }
                @keyframes charged-burst {
                    0% { transform: scale(0.1); opacity: 0.9; }
                    100% { transform: scale(1); opacity: 0; }
                }
                .animate-charged-burst {
                    animation: charged-burst 0.6s ease-out forwards;
                }
                @keyframes title-glow {
                    0%, 100% { text-shadow: 0 0 8px #facc15, 0 0 16px #facc15, 0 0 24px #ca8a04; }
                    50% { text-shadow: 0 0 12px #fef08a, 0 0 24px #facc15, 0 0 36px #ca8a04; }
                }
                .animate-title-glow {
                    animation: title-glow 4s ease-in-out infinite;
                }
                @keyframes twinkle {
                    from { opacity: 0.2; transform: scale(0.8); }
                    to { opacity: 1; transform: scale(1.2); }
                }
                @keyframes bob {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-3px); }
                }
                .animate-bob {
                    animation: bob 0.4s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default App;
