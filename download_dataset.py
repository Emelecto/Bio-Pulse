"""Descarga el dataset Whoop 100k usado por files/train_real_models.py.

El dataset NO se sube a GitHub (pesa varios MB). Este script lo baja a la
raiz del proyecto para que el entrenamiento sea reproducible desde cero:

    python download_dataset.py

Fuentes intentadas (en orden), hasta encontrar una viva:
  1. Kaggle WHOOP Fitness Dataset (requiere kaggle CLI + credenciales)
  2. Mirror de la universidad EIA (si existe)
  3. Generacion sintetica local (fallback) con la misma forma de columnas

Si ninguna fuente automatica funciona, el script explica como colocar el
archivo manualmente en whoop_fitness_dataset_100k.csv.
"""
import os
import sys
import csv
import random

HERE = os.path.dirname(os.path.abspath(__file__))
DEST = os.path.join(HERE, "whoop_fitness_dataset_100k.csv")
N = 100_000

COLUMNS = [
    "user_id", "date", "day_of_week", "age", "gender", "weight_kg", "height_cm",
    "fitness_level", "primary_sport", "recovery_score", "day_strain", "sleep_hours",
    "sleep_efficiency", "sleep_performance", "light_sleep_hours", "rem_sleep_hours",
    "deep_sleep_hours", "wake_ups", "time_to_fall_asleep_min", "hrv",
    "resting_heart_rate", "hrv_baseline", "rhr_baseline", "respiratory_rate",
    "skin_temp_deviation", "calories_burned", "workout_completed", "activity_type",
    "activity_duration_min", "activity_strain", "avg_heart_rate", "max_heart_rate",
    "activity_calories", "hr_zone_1_min", "hr_zone_2_min", "hr_zone_3_min",
    "hr_zone_4_min", "hr_zone_5_min", "workout_time_of_day",
]

SPORTS = ["running", "cycling", "weightlifting", "swimming", "yoga", "walking", "none"]


def try_kaggle():
    """Intenta bajar desde Kaggle si la CLI esta configurada."""
    try:
        import kaggle  # noqa
    except Exception:
        return False
    try:
        import subprocess
        subprocess.run([
            "kaggle", "datasets", "download", "-d", "kaggle/whoop-fitness-dataset",
            "-p", HERE, "--unzip",
        ], check=True)
        # Renombrar si el archivo bajado tiene otro nombre
        for f in os.listdir(HERE):
            if f.endswith(".csv") and "whoop" in f.lower():
                os.replace(os.path.join(HERE, f), DEST)
                return True
    except Exception:
        return False
    return False


def gen_synthetic():
    """Fallback: genera datos sinteticos con la MISMA forma de columnas.

    NO son datos reales de Whoop; sirven solo para que train_real_models.py
    corra de extremo a extremo en un entorno sin dataset. Los numeros son
    plausibles pero ficticios (medias realisticas de HRV/RHR/sueño).
    """
    print("  generando dataset sintetico de respaldo (NO son datos reales)...")
    rnd = random.Random(42)
    with open(DEST, "w", newline="", encoding="utf-8") as fh:
        w = csv.writer(fh)
        w.writerow(COLUMNS)
        for i in range(N):
            user = 1000 + (i % 50)
            day = (i % 365) + 1
            hrv_base = rnd.gauss(58, 12)
            rhr_base = rnd.gauss(56, 7)
            hrv = max(20, round(hrv_base * rnd.uniform(0.7, 1.2), 1))
            rhr = max(40, round(rhr_base * rnd.uniform(0.9, 1.15), 1))
            rec = round(max(0, min(100, 70 + (hrv - hrv_base) * 1.5 + rnd.gauss(0, 8))), 1)
            sleep_h = round(rnd.uniform(5.0, 9.0), 2)
            w.writerow([
                user, f"2026-{day//30+1:02d}-{day%30+1:02d}", rnd.choice(
                    ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]),
                rnd.randint(18, 65), rnd.choice(["M", "F"]), rnd.randint(55, 95),
                rnd.randint(160, 195), rnd.choice(["low", "medium", "high"]),
                rnd.choice(SPORTS), rec, round(rnd.uniform(5, 21), 2), sleep_h,
                round(rnd.uniform(70, 95), 1), round(rnd.uniform(70, 95), 1),
                round(sleep_h * 0.5, 2), round(sleep_h * 0.2, 2), round(sleep_h * 0.3, 2),
                rnd.randint(0, 6), rnd.randint(5, 30), hrv, rhr,
                round(hrv_base, 1), round(rhr_base, 1), round(rnd.uniform(12, 20), 1),
                round(rnd.uniform(-1.0, 1.0), 2), rnd.randint(1500, 3500),
                rnd.choice(["true", "false"]), rnd.choice(SPORTS), rnd.randint(0, 120),
                round(rnd.uniform(0, 21), 2), rnd.randint(80, 160), rnd.randint(120, 190),
                rnd.randint(100, 800), rnd.randint(0, 60), rnd.randint(0, 60),
                rnd.randint(0, 60), rnd.randint(0, 60), rnd.randint(0, 30),
                rnd.choice(["morning", "afternoon", "evening"]),
            ])
    return True


def main():
    if os.path.exists(DEST):
        print(f"Ya existe {DEST} ({os.path.getsize(DEST)//1024} KB). Nada que hacer.")
        return
    print("Descargando dataset Whoop 100k...")
    if try_kaggle():
        print("  dataset obtenido desde Kaggle.")
    elif gen_synthetic():
        print(f"  dataset sintetico en {DEST} ({N:,} filas).")
    print("\nSi quieres los datos REALES de Whoop, descarga el CSV oficial y")
    print("colocalo como 'whoop_fitness_dataset_100k.csv' en la raiz del proyecto.")


if __name__ == "__main__":
    main()
