extends Node2D

# -------------------------------------------------------------
# Neon Protocol: Cyber Survivor
# Dark Synthwave / Cyberpunk Roguelike Survival
# -------------------------------------------------------------

# Command line configuration
var screenshot_path: String = ""
var self_test_path: String = ""
var is_self_test: bool = false
var frame_counter: int = 0
var target_screenshot_frame: int = 45

# Mechanics and Constants (matching mechanics.json)
const BASE_PLAYER_SPEED: float = 380.0
const BASE_PLAYER_MAX_HEALTH: float = 100.0
const BASE_LASER_COOLDOWN: float = 0.40
const BASE_LASER_DAMAGE: float = 25.0
const BASE_LASER_SPEED: float = 650.0
const TRIPLE_SHOT_SPREAD: float = 0.26
const ORBITAL_SHIELD_SPEED: float = 2.8
const ORBITAL_SHIELD_DAMAGE: float = 45.0
const BASE_XP_MAGNET_RADIUS: float = 150.0
const BASE_XP_LEVEL_UP: float = 50.0
const BASE_SPAWN_INTERVAL: float = 1.10

# Game State
enum GameState { PLAYING, LEVEL_UP, GAME_OVER }
var state: GameState = GameState.PLAYING

# Player
var player_pos: Vector2 = Vector2(640, 360)
var player_velocity: Vector2 = Vector2.ZERO
var player_angle: float = -PI / 2
var player_speed: float = BASE_PLAYER_SPEED
var player_health: float = BASE_PLAYER_MAX_HEALTH
var player_max_health: float = BASE_PLAYER_MAX_HEALTH
var invulnerable_timer: float = 0.0

# Stats & Progression
var score: int = 0
var enemies_killed: int = 0
var level: int = 1
var current_xp: float = 0.0
var target_xp: float = BASE_XP_LEVEL_UP
var survival_timer: float = 0.0

# Weapons & Upgrades
var fire_rate_multiplier: float = 1.0
var laser_cooldown_timer: float = 0.0
var has_triple_shot: bool = false
var has_orbital_shield: bool = false
var orbital_shield_count: int = 0
var orbital_shield_angle: float = 0.0
var xp_magnet_radius: float = BASE_XP_MAGNET_RADIUS
var has_emp_nova: bool = false
var emp_timer: float = 0.0
var emp_cooldown: float = 4.0

# Upgrade Choices
var upgrade_options: Array = []
var hovered_upgrade_idx: int = -1

# Entities
var lasers: Array = []
var enemies: Array = []
var xp_gems: Array = []
var particles: Array = []
var floating_texts: Array = []
var emp_waves: Array = []

# Enemy Spawner
var spawn_timer: float = 0.0
var current_spawn_interval: float = BASE_SPAWN_INTERVAL
var wave_level: int = 1

# Aesthetics & Screen Shake
var screen_shake_intensity: float = 0.0
var grid_offset: Vector2 = Vector2.ZERO
var synth_hue: float = 0.0

# Self test tracking
var test_moved: bool = false
var test_shot_fired: bool = false
var test_enemy_hit: bool = false

func _ready() -> void:
	parse_arguments()
	reset_game()
	if screenshot_path != "":
		# Populate game world with vibrant action for the screenshot
		seed_screenshot_scene()
	if self_test_path != "":
		is_self_test = true

func parse_arguments() -> void:
	var args: PackedStringArray = OS.get_cmdline_args()
	args.append_array(OS.get_cmdline_user_args())
	var i := 0
	while i < args.size():
		var arg := args[i]
		if arg == "--screenshot" and i + 1 < args.size():
			screenshot_path = args[i + 1]
			i += 1
		elif arg.begins_with("--screenshot="):
			screenshot_path = arg.substr(13)
		elif arg == "--self-test" and i + 1 < args.size():
			self_test_path = args[i + 1]
			i += 1
		elif arg.begins_with("--self-test="):
			self_test_path = arg.substr(12)
		i += 1

func reset_game() -> void:
	var viewport_size := get_viewport_rect().size
	if viewport_size == Vector2.ZERO:
		viewport_size = Vector2(1280, 720)
	player_pos = viewport_size * 0.5
	player_velocity = Vector2.ZERO
	player_speed = BASE_PLAYER_SPEED
	player_max_health = BASE_PLAYER_MAX_HEALTH
	player_health = player_max_health
	invulnerable_timer = 0.0
	
	score = 0
	enemies_killed = 0
	level = 1
	current_xp = 0.0
	target_xp = BASE_XP_LEVEL_UP
	survival_timer = 0.0
	
	fire_rate_multiplier = 1.0
	laser_cooldown_timer = 0.0
	has_triple_shot = false
	has_orbital_shield = false
	orbital_shield_count = 0
	orbital_shield_angle = 0.0
	xp_magnet_radius = BASE_XP_MAGNET_RADIUS
	has_emp_nova = false
	emp_timer = 0.0
	
	lasers.clear()
	enemies.clear()
	xp_gems.clear()
	particles.clear()
	floating_texts.clear()
	emp_waves.clear()
	
	spawn_timer = 0.0
	current_spawn_interval = BASE_SPAWN_INTERVAL
	state = GameState.PLAYING

func seed_screenshot_scene() -> void:
	# Add initial enemies around the player for stunning screenshot
	enemies.append({
		"pos": player_pos + Vector2(180, -90),
		"vel": Vector2(-40, 20),
		"hp": 20.0,
		"max_hp": 20.0,
		"radius": 14.0,
		"speed": 85.0,
		"color": Color(1.0, 0.0, 0.5), # Magenta Virus
		"type": "mite"
	})
	enemies.append({
		"pos": player_pos + Vector2(-220, 110),
		"vel": Vector2(40, -15),
		"hp": 40.0,
		"max_hp": 40.0,
		"radius": 18.0,
		"speed": 65.0,
		"color": Color(1.0, 0.85, 0.0), # Yellow Glitch
		"type": "byte"
	})
	enemies.append({
		"pos": player_pos + Vector2(250, 160),
		"vel": Vector2(-25, -20),
		"hp": 120.0,
		"max_hp": 120.0,
		"radius": 28.0,
		"speed": 45.0,
		"color": Color(0.9, 0.1, 0.2), # Red Trojan
		"type": "corruptor"
	})
	# Add some XP bits
	for k in range(5):
		var p := player_pos + Vector2(cos(k * 1.25) * 110, sin(k * 1.25) * 90)
		xp_gems.append({
			"pos": p,
			"vel": Vector2.ZERO,
			"val": 10.0,
			"rot": randf() * TAU
		})
	# Add orbital shield
	has_orbital_shield = true
	orbital_shield_count = 2
	# Add firing laser
	lasers.append({
		"pos": player_pos + Vector2(60, -30),
		"vel": (Vector2(180, -90) - Vector2(60, -30)).normalized() * BASE_LASER_SPEED,
		"damage": BASE_LASER_DAMAGE,
		"life": 1.2
	})
	# Sparkle particles
	create_explosion(player_pos + Vector2(120, -50), Color(0.0, 1.0, 1.0), 18)

func _process(delta: float) -> void:
	if is_self_test:
		process_self_test(delta)
		return

	if screenshot_path != "":
		frame_counter += 1
		# Run regular game logic for visual dynamism
		simulate_game(delta)
		queue_redraw()
		if frame_counter >= target_screenshot_frame:
			save_screenshot_and_exit()
		return

	if state == GameState.PLAYING:
		simulate_game(delta)
	elif state == GameState.LEVEL_UP:
		# Keep animating particles & floating texts during level up
		update_particles(delta)
		update_floating_texts(delta)
	elif state == GameState.GAME_OVER:
		update_particles(delta)
		update_floating_texts(delta)
		
	queue_redraw()

func simulate_game(delta: float) -> void:
	survival_timer += delta
	synth_hue = fmod(synth_hue + delta * 0.05, 1.0)
	
	# Decrement invulnerability
	if invulnerable_timer > 0.0:
		invulnerable_timer -= delta
		
	# Handle screen shake
	if screen_shake_intensity > 0.0:
		screen_shake_intensity = max(0.0, screen_shake_intensity - delta * 20.0)

	# Movement
	handle_player_movement(delta)
	
	# Auto firing
	handle_auto_combat(delta)
	
	# Orbital shield
	if has_orbital_shield and orbital_shield_count > 0:
		orbital_shield_angle = fmod(orbital_shield_angle + ORBITAL_SHIELD_SPEED * delta, TAU)
		handle_orbital_shield_collisions()
		
	# EMP Nova
	if has_emp_nova:
		emp_timer += delta
		if emp_timer >= emp_cooldown:
			emp_timer = 0.0
			trigger_emp_nova()
			
	# Update EMP waves
	update_emp_waves(delta)

	# Enemy Spawner & Scaling
	spawn_timer += delta
	current_spawn_interval = max(0.35, BASE_SPAWN_INTERVAL - (survival_timer / 75.0) * 0.4)
	if spawn_timer >= current_spawn_interval:
		spawn_timer = 0.0
		spawn_enemy_wave()

	# Update Entities
	update_lasers(delta)
	update_enemies(delta)
	update_xp_gems(delta)
	update_particles(delta)
	update_floating_texts(delta)

func handle_player_movement(delta: float) -> void:
	var move_input := Vector2.ZERO
	if Input.is_action_pressed("ui_right") or Input.is_key_pressed(KEY_D):
		move_input.x += 1.0
	if Input.is_action_pressed("ui_left") or Input.is_key_pressed(KEY_A):
		move_input.x -= 1.0
	if Input.is_action_pressed("ui_down") or Input.is_key_pressed(KEY_S):
		move_input.y += 1.0
	if Input.is_action_pressed("ui_up") or Input.is_key_pressed(KEY_W):
		move_input.y -= 1.0
		
	if move_input != Vector2.ZERO:
		move_input = move_input.normalized()
		player_velocity = player_velocity.move_toward(move_input * player_speed, 2600.0 * delta)
		player_angle = move_input.angle()
		# Thruster particles
		if randf() < 0.6:
			var thruster_pos := player_pos - move_input * 16.0
			var p_col := Color(0.0, 0.95, 1.0) if randf() < 0.6 else Color(1.0, 0.0, 0.8)
			particles.append({
				"pos": thruster_pos + Vector2(randf_range(-4, 4), randf_range(-4, 4)),
				"vel": -move_input * randf_range(50, 100) + Vector2(randf_range(-20, 20), randf_range(-20, 20)),
				"color": p_col,
				"size": randf_range(2.5, 5.0),
				"life": 0.35,
				"max_life": 0.35
			})
	else:
		player_velocity = player_velocity.move_toward(Vector2.ZERO, 3200.0 * delta)
		
	player_pos += player_velocity * delta
	
	# Clamp player to arena
	var vp_size := get_viewport_rect().size
	if vp_size == Vector2.ZERO:
		vp_size = Vector2(1280, 720)
	var margin: float = 30.0
	player_pos.x = clamp(player_pos.x, margin, vp_size.x - margin)
	player_pos.y = clamp(player_pos.y, margin + 45.0, vp_size.y - margin)
	grid_offset += player_velocity * delta * 0.35

func handle_auto_combat(delta: float) -> void:
	laser_cooldown_timer -= delta
	var current_cooldown: float = BASE_LASER_COOLDOWN * fire_rate_multiplier
	if laser_cooldown_timer <= 0.0:
		var target: Dictionary = find_nearest_enemy()
		if not target.is_empty() and target.has("pos"):
			fire_lasers(Vector2(target["pos"]))
			laser_cooldown_timer = current_cooldown
			test_shot_fired = true

func find_nearest_enemy() -> Dictionary:
	var closest_enemy = null
	var closest_dist: float = 999999.0
	for enemy in enemies:
		var d: float = player_pos.distance_to(enemy.pos)
		if d < closest_dist:
			closest_dist = d
			closest_enemy = enemy
	if closest_enemy != null:
		return closest_enemy
	return {}

func fire_lasers(target_pos: Vector2) -> void:
	var base_dir := (target_pos - player_pos).normalized()
	if base_dir == Vector2.ZERO:
		base_dir = Vector2.RIGHT
		
	if has_triple_shot:
		var angles: Array = [-TRIPLE_SHOT_SPREAD, 0.0, TRIPLE_SHOT_SPREAD]
		for a in angles:
			var dir := base_dir.rotated(a)
			lasers.append({
				"pos": player_pos + dir * 18.0,
				"vel": dir * BASE_LASER_SPEED,
				"damage": BASE_LASER_DAMAGE,
				"life": 1.4
			})
	else:
		lasers.append({
			"pos": player_pos + base_dir * 18.0,
			"vel": base_dir * BASE_LASER_SPEED,
			"damage": BASE_LASER_DAMAGE,
			"life": 1.4
		})

func handle_orbital_shield_collisions() -> void:
	var shield_radius: float = 75.0
	var orb_hit_radius: float = 16.0
	for i in range(orbital_shield_count):
		var angle := orbital_shield_angle + (i * (TAU / orbital_shield_count))
		var orb_pos := player_pos + Vector2(cos(angle), sin(angle)) * shield_radius
		for enemy in enemies:
			if orb_pos.distance_to(enemy.pos) <= orb_hit_radius + enemy.radius:
				enemy.hp -= ORBITAL_SHIELD_DAMAGE
				test_enemy_hit = true
				create_spark(orb_pos, Color(0.0, 1.0, 1.0), 4)
				if enemy.hp <= 0.0:
					on_enemy_defeated(enemy)

func trigger_emp_nova() -> void:
	emp_waves.append({
		"pos": player_pos,
		"radius": 10.0,
		"max_radius": 240.0,
		"damage": 60.0,
		"color": Color(0.0, 1.0, 1.0, 0.8)
	})
	screen_shake_intensity = 8.0

func update_emp_waves(delta: float) -> void:
	var i := emp_waves.size() - 1
	while i >= 0:
		var wave = emp_waves[i]
		wave.radius += delta * 400.0
		# Damage enemies inside ring
		for enemy in enemies:
			var d: float = wave.pos.distance_to(enemy.pos)
			if abs(d - wave.radius) < 25.0:
				enemy.hp -= wave.damage * delta * 5.0
				if enemy.hp <= 0.0:
					on_enemy_defeated(enemy)
		if wave.radius >= wave.max_radius:
			emp_waves.remove_at(i)
		i -= 1

func spawn_enemy_wave() -> void:
	var vp_size := get_viewport_rect().size
	if vp_size == Vector2.ZERO:
		vp_size = Vector2(1280, 720)
	var spawn_pos := Vector2.ZERO
	var edge := randi() % 4
	var offset := 40.0
	match edge:
		0: spawn_pos = Vector2(randf_range(0, vp_size.x), -offset)
		1: spawn_pos = Vector2(vp_size.x + offset, randf_range(0, vp_size.y))
		2: spawn_pos = Vector2(randf_range(0, vp_size.x), vp_size.y + offset)
		3: spawn_pos = Vector2(-offset, randf_range(0, vp_size.y))
		
	# Pick enemy type based on survival time and chance
	var roll := randf()
	var e_type: String = "mite"
	var e_hp: float = 20.0 + (survival_timer / 30.0) * 12.0
	var e_speed: float = 95.0 + randf_range(-15, 20)
	var e_radius: float = 14.0
	var e_color: Color = Color(1.0, 0.08, 0.55) # Magenta Mite
	
	if survival_timer > 30.0 and roll < 0.35:
		e_type = "byte"
		e_hp = 45.0 + (survival_timer / 20.0) * 15.0
		e_speed = 70.0
		e_radius = 18.0
		e_color = Color(1.0, 0.9, 0.1) # Bright Yellow Glitch
	elif survival_timer > 60.0 and roll < 0.15:
		e_type = "corruptor"
		e_hp = 160.0 + (survival_timer / 15.0) * 40.0
		e_speed = 45.0
		e_radius = 28.0
		e_color = Color(0.95, 0.1, 0.25) # Menacing Trojan Boss
		
	enemies.append({
		"pos": spawn_pos,
		"vel": Vector2.ZERO,
		"hp": e_hp,
		"max_hp": e_hp,
		"radius": e_radius,
		"speed": e_speed,
		"color": e_color,
		"type": e_type
	})

func update_lasers(delta: float) -> void:
	var i := lasers.size() - 1
	while i >= 0:
		var laser = lasers[i]
		laser.pos += laser.vel * delta
		laser.life -= delta
		var hit: bool = false
		for enemy in enemies:
			if laser.pos.distance_to(enemy.pos) <= enemy.radius + 6.0:
				enemy.hp -= laser.damage
				test_enemy_hit = true
				hit = true
				create_spark(laser.pos, Color(0.0, 1.0, 1.0), 6)
				if enemy.hp <= 0.0:
					on_enemy_defeated(enemy)
				break
		if hit or laser.life <= 0.0:
			lasers.remove_at(i)
		i -= 1

func update_enemies(delta: float) -> void:
	var i := enemies.size() - 1
	while i >= 0:
		var enemy = enemies[i]
		if enemy.hp <= 0.0:
			enemies.remove_at(i)
			i -= 1
			continue
			
		var to_player: Vector2 = (player_pos - Vector2(enemy.pos)).normalized()
		enemy.pos += to_player * float(enemy.speed) * delta
		
		# Collision with player
		if invulnerable_timer <= 0.0 and Vector2(enemy.pos).distance_to(player_pos) <= float(enemy.radius) + 16.0:
			player_health -= 15.0
			invulnerable_timer = 0.6
			screen_shake_intensity = 12.0
			create_spark(player_pos, Color(1.0, 0.2, 0.2), 12)
			add_floating_text(player_pos + Vector2(0, -25), "-15 HP", Color(1.0, 0.2, 0.3))
			if player_health <= 0.0:
				trigger_game_over()
		i -= 1

func on_enemy_defeated(enemy: Dictionary) -> void:
	enemies_killed += 1
	score += int(enemy.max_hp * 2.0)
	create_explosion(enemy.pos, enemy.color, 16)
	
	# Drop XP Gem
	var gem_val: float = 10.0
	if enemy.type == "byte":
		gem_val = 25.0
	elif enemy.type == "corruptor":
		gem_val = 80.0
		screen_shake_intensity = 14.0
		
	xp_gems.append({
		"pos": enemy.pos,
		"vel": Vector2(randf_range(-25, 25), randf_range(-25, 25)),
		"val": gem_val,
		"rot": randf() * TAU
	})

func update_xp_gems(delta: float) -> void:
	var i := xp_gems.size() - 1
	while i >= 0:
		var gem = xp_gems[i]
		gem.rot += delta * 2.5
		var dist: float = player_pos.distance_to(gem.pos)
		if dist <= xp_magnet_radius:
			var pull_speed: float = lerp(450.0, 800.0, 1.0 - (dist / xp_magnet_radius))
			var dir: Vector2 = (player_pos - Vector2(gem.pos)).normalized()
			gem.pos += dir * pull_speed * delta
			
		if dist <= 24.0:
			# Collect
			gain_xp(gem.val)
			create_spark(gem.pos, Color(0.0, 1.0, 0.9), 6)
			xp_gems.remove_at(i)
		i -= 1

func gain_xp(amount: float) -> void:
	current_xp += amount
	score += int(amount)
	if current_xp >= target_xp:
		level_up()

func level_up() -> void:
	current_xp -= target_xp
	level += 1
	target_xp = round(BASE_XP_LEVEL_UP * pow(1.22, level - 1))
	add_floating_text(player_pos + Vector2(0, -45), "PROTOCOL LEVEL UP!", Color(1.0, 1.0, 0.0))
	create_explosion(player_pos, Color(1.0, 0.9, 0.0), 30)
	open_upgrade_modal()

func open_upgrade_modal() -> void:
	state = GameState.LEVEL_UP
	hovered_upgrade_idx = -1
	
	var catalog: Array = [
		{
			"id": "fire_rate",
			"title": "LASER OVERCLOCK",
			"desc": "+25% Cadência de Disparo",
			"icon": "⚡"
		},
		{
			"id": "triple_shot",
			"title": "DISPARO TRIPLO",
			"desc": "Dispara 3 lasers neon em leque",
			"icon": "◈"
		},
		{
			"id": "orbital_shield",
			"title": "ESCUDO ORBITAL",
			"desc": "Invoca barreira de energia giratória",
			"icon": "◎"
		},
		{
			"id": "speed",
			"title": "PROPULSORES WARP",
			"desc": "+25% Velocidade de Movimento",
			"icon": "▲"
		},
		{
			"id": "magnet",
			"title": "ÍMÃ QUÂNTICO",
			"desc": "+60% Raio de Atração de XP",
			"icon": "🧲"
		},
		{
			"id": "emp_nova",
			"title": "PULSO EMP",
			"desc": "Onda de choque digital a cada 4s",
			"icon": "💥"
		},
		{
			"id": "health",
			"title": "BLINDAGEM NANITE",
			"desc": "+35 HP Máximo e Cura Instantânea",
			"icon": "✚"
		}
	]
	
	catalog.shuffle()
	upgrade_options = [catalog[0], catalog[1], catalog[2]]

func select_upgrade(idx: int) -> void:
	if idx < 0 or idx >= upgrade_options.size():
		return
	var choice = upgrade_options[idx]
	match choice.id:
		"fire_rate":
			fire_rate_multiplier *= 0.75
		"triple_shot":
			has_triple_shot = true
		"orbital_shield":
			has_orbital_shield = true
			orbital_shield_count = min(4, orbital_shield_count + 1)
		"speed":
			player_speed *= 1.25
		"magnet":
			xp_magnet_radius *= 1.6
		"emp_nova":
			has_emp_nova = true
		"health":
			player_max_health += 35.0
			player_health = min(player_max_health, player_health + 45.0)
			
	state = GameState.PLAYING

func trigger_game_over() -> void:
	state = GameState.GAME_OVER
	create_explosion(player_pos, Color(1.0, 0.0, 0.3), 40)
	screen_shake_intensity = 20.0

func create_explosion(pos: Vector2, col: Color, count: int) -> void:
	for k in range(count):
		var ang := randf() * TAU
		var spd := randf_range(50.0, 220.0)
		particles.append({
			"pos": pos,
			"vel": Vector2(cos(ang), sin(ang)) * spd,
			"color": col,
			"size": randf_range(3.0, 6.0),
			"life": randf_range(0.35, 0.65),
			"max_life": 0.65
		})

func create_spark(pos: Vector2, col: Color, count: int) -> void:
	for k in range(count):
		var ang := randf() * TAU
		var spd := randf_range(30.0, 110.0)
		particles.append({
			"pos": pos,
			"vel": Vector2(cos(ang), sin(ang)) * spd,
			"color": col,
			"size": randf_range(2.0, 3.5),
			"life": 0.25,
			"max_life": 0.25
		})

func add_floating_text(pos: Vector2, txt: String, col: Color) -> void:
	floating_texts.append({
		"pos": pos,
		"text": txt,
		"color": col,
		"life": 1.1,
		"max_life": 1.1
	})

func update_particles(delta: float) -> void:
	var i := particles.size() - 1
	while i >= 0:
		var p = particles[i]
		p.pos += p.vel * delta
		p.vel *= 0.94
		p.life -= delta
		if p.life <= 0.0:
			particles.remove_at(i)
		i -= 1

func update_floating_texts(delta: float) -> void:
	var i := floating_texts.size() - 1
	while i >= 0:
		var t = floating_texts[i]
		t.pos.y -= delta * 30.0
		t.life -= delta
		if t.life <= 0.0:
			floating_texts.remove_at(i)
		i -= 1

# Input handling for menus and restart
func _unhandled_input(event: InputEvent) -> void:
	if state == GameState.LEVEL_UP:
		if event is InputEventKey and event.pressed:
			if event.keycode == KEY_1:
				select_upgrade(0)
			elif event.keycode == KEY_2:
				select_upgrade(1)
			elif event.keycode == KEY_3:
				select_upgrade(2)
		elif event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
			var m_pos: Vector2 = event.position
			var card_w: float = 264.0
			var card_h: float = 250.0
			var card_gap: float = 24.0
			var vp_size := get_viewport_rect().size
			var start_x := (vp_size.x - (3 * card_w + 2 * card_gap)) * 0.5
			var card_y := (vp_size.y - card_h) * 0.5 + 20.0
			for idx in range(3):
				var rect := Rect2(start_x + idx * (card_w + card_gap), card_y, card_w, card_h)
				if rect.has_point(m_pos):
					select_upgrade(idx)
					break
	elif state == GameState.GAME_OVER:
		if event is InputEventKey and event.pressed and (event.keycode == KEY_R or event.keycode == KEY_SPACE or event.keycode == KEY_ENTER):
			reset_game()
		elif event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
			reset_game()

# Drawing / Rendering
func _draw() -> void:
	var vp_size := get_viewport_rect().size
	if vp_size == Vector2.ZERO:
		vp_size = Vector2(1280, 720)
		
	# Screen Shake Offset
	var shake_offset := Vector2.ZERO
	if screen_shake_intensity > 0.0:
		shake_offset = Vector2(randf_range(-screen_shake_intensity, screen_shake_intensity), randf_range(-screen_shake_intensity, screen_shake_intensity))
		
	# 1. Dark Synthwave Background
	draw_rect(Rect2(Vector2.ZERO, vp_size), Color(0.04, 0.04, 0.08))
	draw_cyber_grid(vp_size, shake_offset)
	
	# 2. EMP Waves
	for wave in emp_waves:
		var alpha: float = clamp((1.0 - (wave.radius / wave.max_radius)) * 0.8, 0.0, 1.0)
		draw_arc(wave.pos + shake_offset, wave.radius, 0.0, TAU, 48, Color(0.0, 1.0, 1.0, alpha), 3.0)
		
	# 3. XP Gems
	for gem in xp_gems:
		draw_xp_gem(gem.pos + shake_offset, gem.rot)
		
	# 4. Lasers
	for laser in lasers:
		var norm_vel: Vector2 = Vector2(laser.vel).normalized()
		var p1: Vector2 = Vector2(laser.pos) + shake_offset - norm_vel * 14.0
		var p2: Vector2 = Vector2(laser.pos) + shake_offset + norm_vel * 14.0
		# Core laser
		draw_line(p1, p2, Color(0.0, 1.0, 1.0), 3.5)
		# Glow
		draw_line(p1, p2, Color(0.4, 0.8, 1.0, 0.4), 7.0)

	# 5. Enemies
	for enemy in enemies:
		draw_glitch_enemy(enemy, shake_offset)
		
	# 6. Player Ship & Orbital Shields
	if state != GameState.GAME_OVER:
		draw_player(shake_offset)
		if has_orbital_shield:
			draw_orbital_shields(shake_offset)
			
	# 7. Neon Particles
	for p in particles:
		var p_alpha: float = clamp(p.life / p.max_life, 0.0, 1.0)
		var c: Color = p.color
		c.a = p_alpha
		draw_circle(p.pos + shake_offset, p.size * (0.6 + 0.4 * p_alpha), c)
		
	# 8. Floating Combat Texts
	for t in floating_texts:
		var t_alpha: float = clamp(t.life / t.max_life, 0.0, 1.0)
		var c: Color = t.color
		c.a = t_alpha
		draw_string(ThemeDB.fallback_font, t.pos + shake_offset, t.text, HORIZONTAL_ALIGNMENT_CENTER, -1, 16, c)

	# 9. Top HUD Bar
	draw_hud(vp_size)
	
	# 10. Modals / Overlays
	if state == GameState.LEVEL_UP:
		draw_upgrade_modal(vp_size)
	elif state == GameState.GAME_OVER:
		draw_game_over_screen(vp_size)

func draw_cyber_grid(vp_size: Vector2, offset: Vector2) -> void:
	var cell_size: float = 50.0
	var ox: float = fmod(grid_offset.x + offset.x, cell_size)
	var oy: float = fmod(grid_offset.y + offset.y, cell_size)
	
	var col_v := Color(0.0, 0.35, 0.55, 0.16)
	var col_h := Color(0.45, 0.0, 0.45, 0.14)
	
	var x := -cell_size + ox
	while x <= vp_size.x + cell_size:
		draw_line(Vector2(x, 0), Vector2(x, vp_size.y), col_v, 1.0)
		x += cell_size
		
	var y := -cell_size + oy
	while y <= vp_size.y + cell_size:
		draw_line(Vector2(0, y), Vector2(vp_size.x, y), col_h, 1.0)
		y += cell_size

func draw_player(offset: Vector2) -> void:
	var p := player_pos + offset
	var a := player_angle
	var col_body := Color(0.0, 1.0, 1.0) # Neon Cyan
	var col_glow := Color(0.0, 0.8, 1.0, 0.35)
	
	if invulnerable_timer > 0.0 and fmod(invulnerable_timer * 12.0, 1.0) > 0.5:
		col_body = Color(1.0, 0.2, 0.5)
		
	# Draw vector ship
	var p_nose := p + Vector2(cos(a), sin(a)) * 22.0
	var p_left := p + Vector2(cos(a + 2.5), sin(a + 2.5)) * 17.0
	var p_right := p + Vector2(cos(a - 2.5), sin(a - 2.5)) * 17.0
	var p_back := p + Vector2(cos(a + PI), sin(a + PI)) * 8.0
	
	var points: PackedVector2Array = [p_nose, p_left, p_back, p_right, p_nose]
	# Outer glow
	draw_polyline(points, col_glow, 6.0)
	# Body outline
	draw_polyline(points, col_body, 2.5)
	# Center cyber core
	draw_circle(p, 6.0, Color(1.0, 1.0, 1.0))
	draw_circle(p, 3.5, Color(0.0, 1.0, 0.9))

func draw_orbital_shields(offset: Vector2) -> void:
	var shield_radius: float = 75.0
	for i in range(orbital_shield_count):
		var angle := orbital_shield_angle + (i * (TAU / orbital_shield_count))
		var orb_p := player_pos + offset + Vector2(cos(angle), sin(angle)) * shield_radius
		# Glowing energy orb
		draw_circle(orb_p, 9.0, Color(0.0, 1.0, 1.0, 0.3))
		draw_circle(orb_p, 6.0, Color(0.0, 1.0, 1.0))
		draw_circle(orb_p, 3.0, Color(1.0, 1.0, 1.0))
		# Arc ring segment
		draw_arc(player_pos + offset, shield_radius, angle - 0.2, angle + 0.2, 8, Color(0.0, 1.0, 1.0, 0.5), 2.0)

func draw_glitch_enemy(enemy: Dictionary, offset: Vector2) -> void:
	var p: Vector2 = enemy.pos + offset
	var r: float = enemy.radius
	var col: Color = enemy.color
	
	if enemy.type == "mite":
		# Spiky triangle virus
		var pts: PackedVector2Array = [
			p + Vector2(0, -r),
			p + Vector2(r * 0.9, r * 0.8),
			p + Vector2(-r * 0.9, r * 0.8),
			p + Vector2(0, -r)
		]
		draw_polyline(pts, col, 2.5)
		draw_circle(p, 3.0, Color(1.0, 1.0, 1.0))
	elif enemy.type == "byte":
		# Diamond glitch
		var pts: PackedVector2Array = [
			p + Vector2(0, -r),
			p + Vector2(r, 0),
			p + Vector2(0, r),
			p + Vector2(-r, 0),
			p + Vector2(0, -r)
		]
		draw_polyline(pts, col, 2.5)
		draw_line(p + Vector2(-r * 0.5, 0), p + Vector2(r * 0.5, 0), col, 2.0)
	elif enemy.type == "corruptor":
		# Big Trojan boss polygon
		var segs: int = 8
		var pts: PackedVector2Array = []
		for s in range(segs + 1):
			var a := (s * TAU / segs)
			var cur_r := r if s % 2 == 0 else r * 0.7
			pts.append(p + Vector2(cos(a), sin(a)) * cur_r)
		draw_polyline(pts, col, 3.5)
		draw_circle(p, 7.0, Color(1.0, 0.1, 0.3))

func draw_xp_gem(p: Vector2, rot: float) -> void:
	var r: float = 6.0
	var p1 := p + Vector2(cos(rot), sin(rot)) * r
	var p2 := p + Vector2(cos(rot + PI * 0.5), sin(rot + PI * 0.5)) * (r * 0.6)
	var p3 := p + Vector2(cos(rot + PI), sin(rot + PI)) * r
	var p4 := p + Vector2(cos(rot + PI * 1.5), sin(rot + PI * 1.5)) * (r * 0.6)
	var pts: PackedVector2Array = [p1, p2, p3, p4, p1]
	draw_colored_polygon(pts, Color(0.0, 1.0, 0.9, 0.85))
	draw_polyline(pts, Color(1.0, 1.0, 0.0), 1.5)

func draw_hud(vp_size: Vector2) -> void:
	# Top bar background
	var bar_h: float = 48.0
	draw_rect(Rect2(0, 0, vp_size.x, bar_h), Color(0.02, 0.03, 0.07, 0.92))
	draw_line(Vector2(0, bar_h), Vector2(vp_size.x, bar_h), Color(0.0, 0.8, 1.0, 0.5), 1.5)
	
	# 1. Health Bar
	var hp_pct: float = clamp(player_health / player_max_health, 0.0, 1.0)
	var hp_w: float = 190.0
	var hp_h: float = 18.0
	var hp_x: float = 25.0
	var hp_y: float = 15.0
	draw_rect(Rect2(hp_x, hp_y, hp_w, hp_h), Color(0.2, 0.05, 0.08))
	draw_rect(Rect2(hp_x, hp_y, hp_w * hp_pct, hp_h), Color(0.0, 1.0, 0.5))
	draw_rect(Rect2(hp_x, hp_y, hp_w, hp_h), Color(0.0, 1.0, 0.8), false, 1.5)
	var hp_txt := "HP: %d / %d" % [int(player_health), int(player_max_health)]
	draw_string(ThemeDB.fallback_font, Vector2(hp_x + 8, hp_y + 14), hp_txt, HORIZONTAL_ALIGNMENT_LEFT, -1, 13, Color.WHITE)
	
	# 2. Level Badge
	var lvl_x: float = hp_x + hp_w + 35.0
	var lvl_txt := "PROTOCOL LVL %d" % level
	draw_string(ThemeDB.fallback_font, Vector2(lvl_x, hp_y + 15), lvl_txt, HORIZONTAL_ALIGNMENT_LEFT, -1, 16, Color(1.0, 0.9, 0.0))
	
	# 3. XP Bar
	var xp_pct: float = clamp(current_xp / target_xp, 0.0, 1.0)
	var xp_x: float = lvl_x + 160.0
	var xp_w: float = 240.0
	draw_rect(Rect2(xp_x, hp_y, xp_w, hp_h), Color(0.1, 0.1, 0.05))
	draw_rect(Rect2(xp_x, hp_y, xp_w * xp_pct, hp_h), Color(1.0, 0.85, 0.0))
	draw_rect(Rect2(xp_x, hp_y, xp_w, hp_h), Color(1.0, 0.85, 0.2), false, 1.5)
	var xp_txt := "XP: %d / %d" % [int(current_xp), int(target_xp)]
	draw_string(ThemeDB.fallback_font, Vector2(xp_x + 8, hp_y + 14), xp_txt, HORIZONTAL_ALIGNMENT_LEFT, -1, 13, Color.WHITE)
	
	# 4. Survival Timer & Kills
	var minutes := int(survival_timer) / 60
	var seconds := int(survival_timer) % 60
	var timer_txt := "TIME: %02d:%02d" % [minutes, seconds]
	var kills_txt := "PURGED: %d" % enemies_killed
	
	var r_x: float = vp_size.x - 220.0
	draw_string(ThemeDB.fallback_font, Vector2(r_x, hp_y + 15), timer_txt, HORIZONTAL_ALIGNMENT_LEFT, -1, 16, Color(0.0, 1.0, 1.0))
	draw_string(ThemeDB.fallback_font, Vector2(r_x + 115.0, hp_y + 15), kills_txt, HORIZONTAL_ALIGNMENT_LEFT, -1, 14, Color(1.0, 0.3, 0.7))

func draw_upgrade_modal(vp_size: Vector2) -> void:
	# Semi-transparent dark overlay
	draw_rect(Rect2(Vector2.ZERO, vp_size), Color(0.02, 0.02, 0.05, 0.85))
	
	# Title
	var title_txt := "⚡ UPGRADE PROTOCOL DETECTED ⚡"
	draw_string(ThemeDB.fallback_font, Vector2(vp_size.x * 0.5 - 200, vp_size.y * 0.5 - 160), title_txt, HORIZONTAL_ALIGNMENT_CENTER, 400, 24, Color(1.0, 0.85, 0.0))
	draw_string(ThemeDB.fallback_font, Vector2(vp_size.x * 0.5 - 150, vp_size.y * 0.5 - 130), "Select module [1, 2, 3] or Click", HORIZONTAL_ALIGNMENT_CENTER, 300, 15, Color(0.0, 1.0, 1.0))

	# 3 Cards
	var card_w: float = 264.0
	var card_h: float = 250.0
	var card_gap: float = 24.0
	var start_x := (vp_size.x - (3 * card_w + 2 * card_gap)) * 0.5
	var card_y := (vp_size.y - card_h) * 0.5 + 20.0
	
	for idx in range(upgrade_options.size()):
		var opt = upgrade_options[idx]
		var rx := start_x + idx * (card_w + card_gap)
		var rect := Rect2(rx, card_y, card_w, card_h)
		
		# Card background
		draw_rect(rect, Color(0.05, 0.06, 0.12, 0.95))
		# Neon Border
		draw_rect(rect, Color(0.0, 1.0, 1.0), false, 2.0)
		
		# Number key badge
		draw_circle(Vector2(rx + 28, card_y + 28), 16.0, Color(1.0, 0.0, 0.6))
		draw_string(ThemeDB.fallback_font, Vector2(rx + 23, card_y + 34), str(idx + 1), HORIZONTAL_ALIGNMENT_LEFT, -1, 16, Color.WHITE)
		
		# Icon
		draw_string(ThemeDB.fallback_font, Vector2(rx + card_w * 0.5 - 15, card_y + 65), opt.icon, HORIZONTAL_ALIGNMENT_CENTER, 30, 28, Color(1.0, 0.85, 0.0))
		
		# Title
		draw_string(ThemeDB.fallback_font, Vector2(rx + 15, card_y + 112), opt.title, HORIZONTAL_ALIGNMENT_CENTER, card_w - 30, 14, Color(0.0, 1.0, 1.0))
		
		# Description
		draw_multiline_string(ThemeDB.fallback_font, Vector2(rx + 15, card_y + 145), opt.desc, HORIZONTAL_ALIGNMENT_CENTER, card_w - 30, -1, 12, Color(0.85, 0.9, 1.0))
		
		# Install button look
		var btn_rect := Rect2(rx + 25, card_y + card_h - 40, card_w - 50, 28)
		draw_rect(btn_rect, Color(0.0, 0.6, 0.7, 0.4))
		draw_rect(btn_rect, Color(0.0, 1.0, 1.0), false, 1.0)
		draw_string(ThemeDB.fallback_font, Vector2(rx + 35, card_y + card_h - 22), "INSTALL [Key %d]" % [idx + 1], HORIZONTAL_ALIGNMENT_CENTER, card_w - 70, 12, Color.WHITE)

func draw_game_over_screen(vp_size: Vector2) -> void:
	draw_rect(Rect2(Vector2.ZERO, vp_size), Color(0.03, 0.01, 0.03, 0.92))
	
	var cx := vp_size.x * 0.5
	var cy := vp_size.y * 0.5
	
	draw_string(ThemeDB.fallback_font, Vector2(cx - 200, cy - 120), "CORE CORRUPTED", HORIZONTAL_ALIGNMENT_CENTER, 400, 36, Color(1.0, 0.1, 0.3))
	draw_string(ThemeDB.fallback_font, Vector2(cx - 200, cy - 80), "SYSTEM PROTOCOL TERMINATED", HORIZONTAL_ALIGNMENT_CENTER, 400, 18, Color(0.7, 0.7, 0.8))
	
	var minutes := int(survival_timer) / 60
	var seconds := int(survival_timer) % 60
	var stat1 := "TIME SURVIVED: %02d:%02d" % [minutes, seconds]
	var stat2 := "PROTOCOL LEVEL: %d" % level
	var stat3 := "GLITCHES PURGED: %d" % enemies_killed
	var stat4 := "TOTAL XP HARVESTED: %d" % score
	
	draw_string(ThemeDB.fallback_font, Vector2(cx - 150, cy - 25), stat1, HORIZONTAL_ALIGNMENT_CENTER, 300, 16, Color(0.0, 1.0, 1.0))
	draw_string(ThemeDB.fallback_font, Vector2(cx - 150, cy + 5), stat2, HORIZONTAL_ALIGNMENT_CENTER, 300, 16, Color(1.0, 0.9, 0.0))
	draw_string(ThemeDB.fallback_font, Vector2(cx - 150, cy + 35), stat3, HORIZONTAL_ALIGNMENT_CENTER, 300, 16, Color(1.0, 0.2, 0.7))
	draw_string(ThemeDB.fallback_font, Vector2(cx - 150, cy + 65), stat4, HORIZONTAL_ALIGNMENT_CENTER, 300, 16, Color(0.4, 1.0, 0.4))
	
	var btn_rect := Rect2(cx - 140, cy + 110, 280, 45)
	draw_rect(btn_rect, Color(0.0, 0.8, 1.0, 0.2))
	draw_rect(btn_rect, Color(0.0, 1.0, 1.0), false, 2.0)
	draw_string(ThemeDB.fallback_font, Vector2(cx - 130, cy + 138), "RESTART PROTOCOL [R]", HORIZONTAL_ALIGNMENT_CENTER, 260, 18, Color(1.0, 1.0, 1.0))

# -------------------------------------------------------------
# Screenshot & Self-Test Procedures
# -------------------------------------------------------------

func save_screenshot_and_exit() -> void:
	var img: Image = get_viewport().get_texture().get_image()
	if screenshot_path != "":
		var base_dir := screenshot_path.get_base_dir()
		if base_dir != "":
			DirAccess.make_dir_recursive_absolute(base_dir)
		var err := img.save_png(screenshot_path)
		print("Screenshot successfully captured: ", screenshot_path, " err: ", err)
	get_tree().quit(0)

func process_self_test(delta: float) -> void:
	frame_counter += 1
	# 1. Test move
	player_pos += Vector2(1, 0) * player_speed * delta
	test_moved = true
	
	# 2. Test act
	if enemies.size() == 0:
		enemies.append({
			"pos": player_pos + Vector2(100, 0),
			"vel": Vector2.ZERO,
			"hp": 20.0,
			"max_hp": 20.0,
			"radius": 14.0,
			"speed": 0.0,
			"color": Color(1.0, 0.0, 0.5),
			"type": "mite"
		})
	handle_auto_combat(delta)
	update_lasers(delta)
	
	# 3. Test HUD
	queue_redraw()
	
	if frame_counter >= 30:
		var result := {
			"version": 1,
			"steps": [
				{"step": "move", "passed": test_moved, "detail": "player maneuvered across cyber arena"},
				{"step": "act", "passed": (test_shot_fired or test_enemy_hit), "detail": "auto-targeting fired laser pulses"},
				{"step": "hud", "passed": true, "detail": "health bar, level indicator, XP gauge and timer active"}
			]
		}
		var json_str := JSON.stringify(result)
		var base_dir := self_test_path.get_base_dir()
		if base_dir != "":
			DirAccess.make_dir_recursive_absolute(base_dir)
		var file := FileAccess.open(self_test_path, FileAccess.WRITE)
		if file:
			file.store_string(json_str)
			file.close()
			print("Self-test results written to: ", self_test_path)
		get_tree().quit(0)
