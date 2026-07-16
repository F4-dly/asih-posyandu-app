import cv2
import mediapipe as mp
import pygame
import threading
import math
import random
import time

# ==========================================
# KONFIGURASI UTAMA & WINDOW
# ==========================================
WIDTH, HEIGHT = 500, 750
lock = threading.Lock()
shared_data = {
    "hand_x": WIDTH // 2,
    "hand_y": HEIGHT // 2,
    "gesture": "NONE",
    "running": True
}

# ==========================================
# THREAD AI: SMART MAPPING & GESTURE
# ==========================================
def camera_thread_func():
    cap = cv2.VideoCapture(0)
    cv2.waitKey(500)
    
    mp_hands = mp.solutions.hands
    hands = mp_hands.Hands(max_num_hands=1, min_detection_confidence=0.7, min_tracking_confidence=0.7)

    while shared_data["running"]:
        ret, frame = cap.read()
        if not ret:
            time.sleep(0.01)
            continue

        frame = cv2.flip(frame, 1)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = hands.process(rgb_frame)

        local_x, local_y = shared_data["hand_x"], shared_data["hand_y"]
        detected_gesture = "NONE"

        if results.multi_hand_landmarks:
            for hand_landmarks in results.multi_hand_landmarks:
                lm = hand_landmarks.landmark
                
                # --- COMFORT ZONE MAPPING ---
                # Hanya menggunakan 60% area tengah kamera agar tidak perlu menjulur terlalu jauh
                cam_x = lm[8].x  # Ujung telunjuk
                cam_y = lm[8].y
                
                # Membatasi dan memperbesar sensitivitas (0.2 sampai 0.8 di-map menjadi 0 sampai 1)
                mapped_x = max(0.0, min(1.0, (cam_x - 0.2) / 0.6))
                mapped_y = max(0.0, min(1.0, (cam_y - 0.2) / 0.6))
                
                local_x = int(mapped_x * WIDTH)
                local_y = int(mapped_y * HEIGHT)
                
                # Cek status jari
                index_up = lm[8].y < lm[6].y
                middle_up = lm[12].y < lm[10].y
                ring_up = lm[16].y < lm[14].y
                pinky_up = lm[20].y < lm[18].y
                thumb_up = lm[4].y < lm[3].y and lm[4].y < lm[2].y

                if thumb_up and not index_up and not middle_up:
                    detected_gesture = "THUMB_UP" # Global Shortcut Makan
                elif index_up and middle_up and not ring_up and not pinky_up:
                    detected_gesture = "PEACE"    # Lompat
                elif not index_up and not middle_up and not ring_up and not pinky_up:
                    detected_gesture = "FIST"     # Tidur
                elif index_up and middle_up and ring_up and pinky_up:
                    detected_gesture = "OPEN"     # Petting/Normal
                else:
                    detected_gesture = "NONE"

        with lock:
            # Smoothing (Interpolasi) biar kursor lebih stabil dan tidak bergetar saat mau hover
            shared_data["hand_x"] += (local_x - shared_data["hand_x"]) * 0.15
            shared_data["hand_y"] += (local_y - shared_data["hand_y"]) * 0.15
            shared_data["gesture"] = detected_gesture

    cap.release()

camera_thread = threading.Thread(target=camera_thread_func, daemon=True)
camera_thread.start()
time.sleep(1.0)

# ==========================================
# PYGAME CORE & COLORS
# ==========================================
pygame.init()
screen = pygame.display.set_mode((WIDTH, HEIGHT))
pygame.display.set_caption("Gyeoul Hover-Smart Tamagotchi")
clock = pygame.time.Clock()

C_MAROON = (115, 26, 48)
C_LIGHT_MAROON = (141, 40, 58)
C_CREAM = (255, 248, 231)
C_PASTEL_PINK = (255, 204, 213)
C_PASTEL_BLUE = (189, 224, 254)
C_PASTEL_GREEN = (204, 242, 219)

font_sm = pygame.font.SysFont("Comic Sans MS", 14, bold=True)
font_md = pygame.font.SysFont("Comic Sans MS", 18, bold=True)
font_lg = pygame.font.SysFont("Comic Sans MS", 24, bold=True)

stats = {"hunger": 80.0, "energy": 70.0, "happiness": 60.0, "hygiene": 90.0, "friendship": 0.0, "level": 1}
bg_modes = ["KAMAR JADUL", "PANTAI ANGOK"]
current_bg_idx = 0

pet = {"x": WIDTH // 2, "y": HEIGHT - 260, "state": "NORMAL", "timer": 0, "wag_angle": 0, "jump_y": 0}
foods = []
bubbles = []
particles = []
prev_gesture = "NONE"
show_letter = False

# Tombol sedikit dinaikkan agar lebih aman
buttons = {
    "RAMYEON": pygame.Rect(25, 650, 95, 55),
    "UBI": pygame.Rect(135, 650, 95, 55),
    "SHOWER": pygame.Rect(245, 650, 95, 55),
    "WALK": pygame.Rect(355, 650, 120, 55),
    "LETTER_ICON": pygame.Rect(430, 25, 45, 40),
    "CLOSE_LETTER": pygame.Rect(200, 610, 100, 45)
}

# Variabel untuk sistem Dwell/Hover Click
hover_timer = 0
hover_target = None
HOVER_MAX = 60 # Sekitar 1 detik untuk klik penuh di 60fps

surat_memori = [
    "SAENGIL CHUKHAHAMNIDA HANYANG! 🎂",
    "",
    "Sistem kontrol barumu sudah diperbarui!",
    "Sekarang gausah susah-susah nge-klik:",
    "Cukup tahan kursor di atas tombol selama",
    "1 detik, dan tombol akan tertekan otomatis!",
    "",
    "Gestur Spesial (Bisa dimana saja):",
    "👍 Thumbs Up = Kasih Ramyeon Instan",
    "🖐️ Open Palm di Gyeoul = Elus-elus",
    "✌️ Peace = Lompat & ✊ Kepal = Tidur",
    "",
    "Happy 19th Birthday! ✨ 🐶"
]

def draw_cute_bg(screen, mode, is_sleeping):
    if is_sleeping:
        screen.fill((44, 24, 46))
        pygame.draw.circle(screen, (254, 228, 159), (80, 200), 25)
        pygame.draw.circle(screen, (44, 24, 46), (92, 195), 23)
    else:
        screen.fill(C_CREAM)
        if mode == "KAMAR JADUL":
            pygame.draw.rect(screen, (230, 204, 178), (0, HEIGHT-300, WIDTH, 300))
            pygame.draw.rect(screen, C_PASTEL_PINK, (30, HEIGHT-360, 70, 60), border_radius=8)
            pygame.draw.circle(screen, (100, 100, 100), (50, HEIGHT-330), 10)
        elif mode == "PANTAI ANGOK":
            pygame.draw.rect(screen, (162, 210, 255), (0, 250, WIDTH, 250))
            pygame.draw.rect(screen, (255, 229, 180), (0, HEIGHT-300, WIDTH, 300))

def draw_gyeoul_char(screen, x, y, state, wag):
    tail_x = x - 45 + int(math.sin(wag) * 12)
    pygame.draw.line(screen, (255, 255, 255), (x-35, y+20), (tail_x, y+8), 14)
    pygame.draw.ellipse(screen, (255, 255, 255), (x-45, y-10, 90, 70))
    pygame.draw.circle(screen, (245, 245, 245), (x-28, y+55), 14)
    pygame.draw.circle(screen, (245, 245, 245), (x+28, y+55), 14)
    pygame.draw.circle(screen, (255, 255, 255), (x, y-18), 46)
    pygame.draw.ellipse(screen, (240, 240, 240), (x-49, y-36, 24, 46))
    pygame.draw.ellipse(screen, (240, 240, 240), (x+25, y-36, 24, 46))
    pygame.draw.circle(screen, C_PASTEL_PINK, (x-28, y-4), 9)
    pygame.draw.circle(screen, C_PASTEL_PINK, (x+28, y-4), 9)

    if state == "HAPPY" or state == "TRICK":
        pygame.draw.arc(screen, (50, 50, 50), (x-25, y-22, 16, 12), 0, math.pi, 3)
        pygame.draw.arc(screen, (40, 40, 40), (x+9,  y-22, 16, 12), 0, math.pi, 3)
    elif state == "SLEEP":
        pygame.draw.line(screen, (60, 60, 60), (x-24, y-16), (x-8, y-16), 3)
        pygame.draw.line(screen, (60, 60, 60), (x+8, y-16), (x+24, y-16), 3)
        screen.blit(font_sm.render("Zzz..", True, C_PASTEL_BLUE), (x+35, y-52))
    elif state == "SAD":
        pygame.draw.circle(screen, (50, 50, 50), (x-16, y-15), 6)
        pygame.draw.circle(screen, (50, 50, 50), (x+16, y-15), 6)
        pygame.draw.rect(screen, (100, 200, 255), (x-18, y-8, 4, 18), border_radius=2)
        pygame.draw.rect(screen, (100, 200, 255), (x+14, y-8, 4, 18), border_radius=2)
    else:
        pygame.draw.circle(screen, (50, 50, 50), (x-16, y-15), 6)
        pygame.draw.circle(screen, (50, 50, 50), (x+16, y-15), 6)
        pygame.draw.circle(screen, (255, 255, 255), (x-18, y-17), 2)

    pygame.draw.polygon(screen, (30, 30, 30), [(x-4, y-4), (x+4, y-4), (x, y)])
    pygame.draw.arc(screen, (30, 30, 30), (x-8, y, 8, 8), math.pi, 2*math.pi, 2)
    pygame.draw.arc(screen, (30, 30, 30), (x, y, 8, 8), math.pi, 2*math.pi, 2)

# ==========================================
# MAIN GAME LOOP
# ==========================================
while shared_data["running"]:
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            shared_data["running"] = False

    with lock:
        hand_x, hand_y = int(shared_data["hand_x"]), int(shared_data["hand_y"])
        current_gesture = shared_data["gesture"]

    if not show_letter and pet["state"] != "SLEEP":
        stats["hunger"] = max(0.0, stats["hunger"] - 0.008)
        stats["energy"] = max(0.0, stats["energy"] - 0.005)
        stats["hygiene"] = max(0.0, stats["hygiene"] - 0.007)
        stats["happiness"] = max(0.0, stats["happiness"] - 0.009)
        
        if stats["hunger"] < 30 or stats["happiness"] < 30 or stats["hygiene"] < 30:
            pet["state"] = "SAD"
        elif pet["state"] == "SAD":
            pet["state"] = "NORMAL"

    if stats["hunger"] > 40 and stats["hygiene"] > 40 and stats["happiness"] > 40:
        stats["friendship"] = min(100.0, stats["friendship"] + 0.012)
    stats["level"] = 1 if stats["friendship"] < 35 else (2 if stats["friendship"] < 75 else 3)

    pet_rect = pygame.Rect(pet["x"] - 50, pet["y"] - 50, 100, 120)

    # --- 1. GLOBAL GESTURES (Tanpa perlu aim tombol) ---
    thumb_triggered = (current_gesture == "THUMB_UP" and prev_gesture != "THUMB_UP")
    
    if thumb_triggered and not show_letter and stats["hunger"] < 100:
        foods.append({"x": WIDTH//2, "y": 150}) # Ramyeon jatuh dari langit tengah
    elif current_gesture == "OPEN" and pet_rect.collidepoint(hand_x, hand_y) and not show_letter:
        pet["state"] = "HAPPY"
        stats["happiness"] = min(100.0, stats["happiness"] + 0.6)
        if random.random() < 0.12:
            particles.append({"x": pet["x"] + random.randint(-30,30), "y": pet["y"]-40, "vx": 0, "vy": -2.5, "alpha": 255})
    elif current_gesture == "FIST" and not show_letter:
        pet["state"] = "SLEEP"
        stats["energy"] = min(100.0, stats["energy"] + 0.4)
    elif current_gesture == "PEACE" and pet["state"] not in ["SLEEP", "TRICK"] and not show_letter:
        if stats["energy"] > 15:
            pet["state"] = "TRICK"
            pet["timer"] = 35
            stats["energy"] -= 6
            stats["happiness"] = min(100.0, stats["happiness"] + 8)
    elif pet["state"] in ["HAPPY", "SLEEP"] and pet["timer"] <= 0:
        pet["state"] = "NORMAL"

    # --- 2. HOVER-TO-CLICK MENU LOGIC (Anti-Meleset) ---
    current_hover = None
    active_buttons = {"CLOSE_LETTER": buttons["CLOSE_LETTER"]} if show_letter else buttons
    
    for btn_key, btn_rect in active_buttons.items():
        if btn_rect.collidepoint(hand_x, hand_y) and btn_key != "CLOSE_LETTER" if not show_letter else True:
            current_hover = btn_key
            break

    # Jika kursor diam di atas tombol, isi timer. Jika pindah, reset.
    if current_hover and current_hover == hover_target:
        hover_timer += 2
        if hover_timer >= HOVER_MAX:
            # KLIK TERJADI!
            if current_hover == "CLOSE_LETTER": show_letter = False
            elif current_hover == "RAMYEON": foods.append({"x": hand_x, "y": hand_y})
            elif current_hover == "UBI": foods.append({"x": hand_x, "y": hand_y})
            elif current_hover == "SHOWER":
                stats["hygiene"] = min(100.0, stats["hygiene"] + 25)
                pet["state"] = "HAPPY"
                pet["timer"] = 40
                for _ in range(15):
                    bubbles.append({"x": pet["x"] + random.randint(-40,40), "y": pet["y"] + random.randint(-10,50), "r": random.randint(6,14), "v": random.randint(1,3)})
            elif current_hover == "WALK":
                current_bg_idx = (current_bg_idx + 1) % len(bg_modes)
                stats["happiness"] = min(100.0, stats["happiness"] + 12)
            elif current_hover == "LETTER_ICON" and stats["level"] >= 2:
                show_letter = True
            
            hover_timer = 0 # Reset setelah eksekusi
    else:
        hover_target = current_hover
        hover_timer = max(0, hover_timer - 4) # Turun perlahan kalau geser dikit

    prev_gesture = current_gesture

    # --- RENDER TAMPILAN ---
    draw_cute_bg(screen, bg_modes[current_bg_idx], pet["state"] == "SLEEP")
    
    if pet["state"] == "TRICK":
        pet["jump_y"] = -abs(math.sin(pet["timer"] * 0.18)) * 50
        pet["wag_angle"] += 0.7
        pet["timer"] -= 1
        if pet["timer"] <= 0:
            pet["state"] = "NORMAL"
            pet["jump_y"] = 0
    else:
        pet["wag_angle"] += 0.08 if pet["state"] == "SLEEP" else 0.25

    for b in bubbles[:]:
        b["y"] -= b["v"]
        pygame.draw.circle(screen, (240, 248, 255), (b["x"], b["y"]), b["r"])
        pygame.draw.circle(screen, (255, 255, 255), (b["x"] - b["r"]//3, b["y"] - b["r"]//3), 2)
        if b["y"] < pet["y"] - 60: bubbles.remove(b)

    for f in foods[:]:
        f["y"] += 6
        pygame.draw.circle(screen, (244, 164, 96), (f["x"], f["y"]), 14)
        if pet_rect.collidepoint(f["x"], f["y"]):
            foods.remove(f)
            stats["hunger"] = min(100.0, stats["hunger"] + 20)
            pet["state"] = "HAPPY"
            pet["timer"] = 35
        elif f["y"] > HEIGHT: foods.remove(f)

    draw_gyeoul_char(screen, pet["x"], pet["y"] + int(pet["jump_y"]), pet["state"], pet["wag_angle"])

    for p in particles[:]:
        p["y"] += p["vy"]
        p["alpha"] -= 6
        if p["alpha"] <= 0: particles.remove(p)
        else:
            pygame.draw.circle(screen, (255, 143, 163), (int(p["x"]), int(p["y"])), 5)

    # --- PANEL UI ATAS ---
    panel = pygame.Surface((WIDTH, 145), pygame.SRCALPHA)
    panel.fill((115, 26, 48, 240))
    screen.blit(panel, (0, 0))

    lvl_txt = {1: "Kenalan", 2: "BFF Terbaik! ✨", 3: "Beloved Soulmate 🌸"}
    screen.blit(font_md.render(f"Hubungan: {lvl_txt[stats['level']]} ({int(stats['friendship'])}%)", True, C_CREAM), (20, 12))

    bars = [("Lapar", "hunger", (255, 143, 163), 42), ("Energi", "energy", (254, 228, 159), 72), ("Bersih", "hygiene", (142, 202, 230), 102)]
    for lbl, key, col, y in bars:
        screen.blit(font_sm.render(lbl, True, C_CREAM), (20, y))
        pygame.draw.rect(screen, (70, 10, 25), (85, y+2, 240, 14), border_radius=6)
        if stats[key] > 0: pygame.draw.rect(screen, col, (85, y+2, int(stats[key]/100*240), 14), border_radius=6)

    pygame.draw.rect(screen, (141, 40, 58), (345, 45, 135, 70), border_radius=8)
    screen.blit(font_sm.render("Arahkan kursor", True, C_CREAM), (355, 52))
    screen.blit(font_sm.render("& tahan jari", True, C_CREAM), (355, 72))

    if stats["level"] >= 2:
        pulse = int(abs(math.sin(time.time() * 4.5)) * 40)
        pygame.draw.rect(screen, (255, 210 + pulse, 120), buttons["LETTER_ICON"], border_radius=5)
        pygame.draw.polygon(screen, C_MAROON, [(430, 25), (475, 25), (452, 42)])

    # --- MENU BAWAH (Area Tombol Diperbesar) ---
    pygame.draw.rect(screen, C_MAROON, (0, 630, WIDTH, 120))
    pygame.draw.line(screen, (150, 40, 60), (0, 630), (WIDTH, 630), 4)

    menu_config = [("RAMYEON", C_LIGHT_MAROON, "Makan 🍜"), ("UBI", C_LIGHT_MAROON, "Cemilan 🍠"), ("SHOWER", C_LIGHT_MAROON, "Mandi 🧼"), ("WALK", C_LIGHT_MAROON, "Jalan 🗺️")]
    for key, color, txt in menu_config:
        r = buttons[key]
        # Jika tombol ini sedang di-hover, beri warna lebih terang
        btn_color = (200, 70, 90) if (hover_target == key and hover_timer > 5) else color
        pygame.draw.rect(screen, btn_color, r, border_radius=12)
        pygame.draw.rect(screen, (255, 255, 255, 40), r, width=2, border_radius=12)
        ts = font_sm.render(txt, True, C_CREAM)
        screen.blit(ts, (r.x + r.width//2 - ts.get_width()//2, r.y + r.height//2 - ts.get_height()//2))

    if show_letter:
        overlay = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 220))
        screen.blit(overlay, (0, 0))
        pygame.draw.rect(screen, C_CREAM, (30, 80, WIDTH-60, HEIGHT-190), border_radius=16)
        pygame.draw.rect(screen, C_MAROON, (30, 80, WIDTH-60, HEIGHT-190), width=4, border_radius=16)
        sy = 120
        for line in surat_memori:
            color = C_MAROON if "HANYANG" in line or "SAENGIL" in line else (60, 60, 60)
            use_font = font_lg if line == surat_memori[0] else font_sm
            ls = use_font.render(line, True, color)
            screen.blit(ls, (WIDTH//2 - ls.get_width()//2, sy))
            sy += 32
        
        br_close = buttons["CLOSE_LETTER"]
        btn_color = (200, 70, 90) if hover_target == "CLOSE_LETTER" else C_MAROON
        pygame.draw.rect(screen, btn_color, br_close, border_radius=8)
        screen.blit(font_sm.render("Tutup", True, C_CREAM), (225, 620))

    # --- INDIKATOR KURSOR & LOADING RING ---
    # Gambar kursor dasar (titik)
    pygame.draw.circle(screen, C_MAROON, (hand_x, hand_y), 8)
    pygame.draw.circle(screen, C_CREAM, (hand_x, hand_y), 8, 2)
    
    # Render Loading Circle jika sedang menahan kursor (Hover Click)
    if hover_timer > 0:
        angle = (hover_timer / HOVER_MAX) * 360
        rect = pygame.Rect(hand_x - 20, hand_y - 20, 40, 40)
        # Gambar busur (arc) yang semakin penuh sesuai durasi hover
        pygame.draw.arc(screen, C_PASTEL_GREEN, rect, math.radians(-90), math.radians(-90 + angle), 4)

    pygame.display.flip()
    clock.tick(60)

pygame.quit()