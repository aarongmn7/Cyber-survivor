# Neon Protocol: Cyber Survivor — Mechanics Specification

## Overview
"Neon Protocol: Cyber Survivor" (Cyber Survivor) is a dark synthwave / cyberpunk roguelike survival shooter where the player pilots a cybernetic interceptor core through waves of digital glitches, rogue drones, corruptions, and sector titans. Players collect glowing XP bits, choose tactical upgrades, encounter monolithic Sector Titans every 10 levels, unlock legendary Mega Upgrades, and combat massive swarms on an expanding tactical zoom viewport.

## Core Parameters

| Name | Group | Value | Unit | Description |
| :--- | :--- | :--- | :--- | :--- |
| `player_speed` | movement | 260.0 | px/s | Base navigation speed of the cybernetic interceptor |
| `player_max_health` | health | 100.0 | hp | Maximum structural integrity of the ship |
| `laser_cooldown` | combat | 0.40 | s | Base cooldown between laser salvos |
| `laser_damage` | combat | 25.0 | dmg | Base damage per laser projectile |
| `laser_speed` | combat | 650.0 | px/s | Projectile travel speed |
| `aim_assist_penalty` | combat | 1.45 | multiplier | Initial cadence penalty for unlocked Auto-Aim (1.45x slower) |
| `triple_shot_spread` | combat | 0.26 | rad | Angular spread of multi-cannon salvos |
| `orbital_shield_speed` | combat | 2.8 | rad/s | Angular rotation speed of orbital defense matrix |
| `orbital_shield_damage` | combat | 45.0 | dmg | Collision damage inflicted by orbital nanite shields |
| `xp_magnet_radius` | progression | 150.0 | px | Attraction radius for dropped data fragments |
| `base_xp_level_up` | progression | 50.0 | xp | XP required to advance from Level 1 to Level 2 |
| `boss_encounter_interval` | progression | 10 | levels | Interval of levels for summoning Sector Titan Bosses (10, 20, 30...) |
| `boss_base_health` | combat | 1000.0 | hp | Base hit points for the Level 10 Sector Titan |
| `min_camera_zoom` | camera | 0.50 | ratio | Maximum camera zoom-out reached at high levels |
| `zoom_step_per_level` | camera | 0.018 | ratio/lvl | Camera distance expansion per level |

## Gameplay Loops & Systems

### 1. Navigation, Mobile Virtual Controls & Dynamic Zoom
- **Desktop Controls**: WASD / Arrow keys for 8-directional movement. Ships rotate smoothly toward movement direction. Space triggers Dash, Q / Shift triggers Overdrive.
- **Diagonal Stopping & Release Grace**: Integrated 180ms diagonal release grace buffer. Eliminates asynchronous dual-key release variance on keyboards and thumb slide on touchscreens, guaranteeing the interceptor stops facing clean 45°, 135°, 225°, and 315° diagonal angles with front firing alignment preserved.
- **Mobile Touch Controls (Multi-Touch)**:
  - **Dynamic Analog Virtual Joystick**: Anchored on left/lower screen under the player's thumb. Drags to steer ship velocity and direction (`player.angle = Math.atan2(dy, dx)`).
  - **Tactical On-Screen Action Buttons**: Dedicated bottom-right touch buttons for `[DASH]` and `[OD]` (Overdrive) with real-time radial cooldown/charge indicators.
  - **Responsive Mobile Viewport**: 100dvh container with `touch-action: none` and `object-fit: contain` to prevent browser pull-to-refresh, address bar jumping, or pinch zoom.
- **Dynamic Arena & Viewport**: As the player levels up, the camera dynamically zooms out:
  $$\text{Target Zoom} = \max(0.50,\, 1.0 - (\text{level} - 1) \times 0.018)$$
  Arena boundaries dynamically expand according to current zoom factor, allowing fluid navigation across the broader battlefield.

### 2. Combat Modes: Fixed Frontal Aim vs. Aim Assist
- **Fixed Frontal Aim (Levels 1–9 / Default without Aim Assist)**:
  - Firing is **always oriented straight ahead from the front of the interceptor** (`player.angle`), both in motion and when stationary.
  - Directional laser sight line projects directly from the ship's nose.
  - High responsive base fire rate with zero targeting delay.
- **Aim Assist / Mira Automática 360° (Mega Upgrade)**:
  - Unlocked exclusively via Sector Titan Boss defeat (Level 10, 20...).
  - Computes Euclidean distance to active adversaries and locks onto the nearest threat in 360° with a neon HUD reticle (`[ ⌖ ]`).
  - **Initial Balance Penalty**: Fires at 1.45x standard cooldown (`cooldown * 1.45`), requiring player positioning and timing. Can be overclocked in later iterations.

### 3. Linear Level Progression & Sector Titans (Bosses)
- **Levels 1–9, 11–19, etc.**: Standard rogue-lite loop offering 3 randomized tactical upgrades on each level-up.
- **Level 10, 20, 30... (Titan Protocol)**:
  - Standard upgrade modal is suppressed.
  - Alarms sound and the monolithic **Sector Titan Boss** spawns with distinct visual boss bars, 5-way spread plasma bursts, collision shields, and escort minions.
  - XP is capped at target threshold during boss fight so combat is uninterrupted.
  - Defeating the Titan triggers an explosion, 40% nanite repairs, massive XP drops, and unlocks the **Mega Upgrade Protocol**.

### 4. Mega Upgrades Protocol
Defeating a Sector Titan guarantees a choice among 3 legendary protocol overhauls:
1. **MIRA AUTOMÁTICA // AIM ASSIST 360°**: Autonomous targeting module with calibrated initial fire rate penalty.
2. **HIPER CANHÃO OVERCHARGE**: +3 heavy cannons, +50% laser damage, and piercing laser blasts.
3. **BASTIÃO ORBITAL TITÂNICO**: +3 dense orbital shields rotating at high velocity with projectile deflection.

### 5. Audio Synthesizer (Web Audio API)
- Zero external audio assets (100% procedural Web Audio API oscillators).
- Procedural SFX for: `laser`, `laser_heavy`, `hit`, `explosion`, `levelup`, `gameover`, `boss_spawn`, `boss_defeat`, and `mega_upgrade`.
