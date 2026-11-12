# Neon Protocol: Cyber Survivor — Mechanics Specification

## Overview
"Neon Protocol: Cyber Survivor" is a dark synthwave / cyberpunk roguelike survival shooter where the player navigates a cybernetic core through waves of digital glitches and corruptions, collecting glowing XP bits and choosing upgrades on level-up.

## Core Parameters

| Name | Group | Value | Unit | Source |
| :--- | :--- | :--- | :--- | :--- |
| `player_speed` | movement | 260.0 | px/s | estimated |
| `player_max_health` | health | 100.0 | hp | estimated |
| `laser_cooldown` | combat | 0.4 | s | estimated |
| `laser_damage` | combat | 25.0 | dmg | estimated |
| `laser_speed` | combat | 650.0 | px/s | estimated |
| `triple_shot_spread` | combat | 0.26 | rad | estimated |
| `orbital_shield_speed` | combat | 2.8 | rad/s | estimated |
| `orbital_shield_damage` | combat | 45.0 | dmg | estimated |
| `xp_magnet_radius` | progression | 150.0 | px | estimated |
| `base_xp_level_up` | progression | 50.0 | xp | estimated |
| `spawn_interval_initial` | waves | 1.1 | s | estimated |

## Gameplay Loops & Systems
- **Controls**: WASD / Arrow keys for multidirectional navigation. Smooth clamping to arena borders.
- **Auto-Targeting**: Computes Euclidean distance to active enemy entities; targets the nearest adversary within sensor range and discharges neon laser pulses.
- **Wave Scaling**: Enemies spawn from viewport edges at escalating rates and densities as survival time ticks upward.
- **XP & Levels**: Destroyed digital bugs drop luminous XP bits attracted to the core. Reaching XP thresholds pauses gameplay and displays an upgrade selection modal.
- **Upgrades**:
  1. Laser Fire Rate (+25% cadence)
  2. Triple Shot (Fires 3 spread pulses simultaneously)
  3. Orbital Shield (Summons orbiting neon energy shields)
  4. Core Speed (+20% navigation speed)
  5. XP Magnet (+50% attraction radius)
- **HUD**: Displays Health Bar, Protocol Level, XP progress, and Survival Timer (MM:SS).
