"""Entrenamiento REAL de los 3 motores de BioPulse sobre el dataset Whoop 100k.

Este script reemplaza los valores ilustrativos del deck con numeros autenticos:
  - Deriva etiquetas deterministas y justificables desde las columnas del dataset.
  - Entrena Random Forest para cada motor con split 80/20 y 5-fold CV reales.
  - Produce ROC (AUC), medias/desv. de 5-fold CV y matriz de confusion.
  - Vuelca resultados a files/training_results.json y graficas a files/.

Las etiquetas se derivan asi (criterios clinicos aproximados, documentados):
  flag_recovery : hrv < 0.80 * hrv_baseline   (HRV cae vs. linea base personal)
  flag_acute    : rhr > 1.10 * rhr_baseline Y recovery_score < 50   (patron agudo)
  flag_infection: abs(skin_temp_deviation) > 0.5 Y respiratory_rate > 18
                  Y recovery_score < 40   (proceso infeccioso probable)
"""
import json
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.metrics import roc_auc_score, roc_curve, confusion_matrix, classification_report
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

SRC = "whoop_fitness_dataset_100k.csv"
OUT_JSON = "files/training_results.json"

print("Cargando dataset...")
df = pd.read_csv(SRC)
print(f"  filas: {len(df):,}")

# --- Limpieza minima ---
for c in ["hrv", "resting_heart_rate", "hrv_baseline", "rhr_baseline",
          "recovery_score", "skin_temp_deviation", "respiratory_rate",
          "sleep_hours", "sleep_efficiency", "sleep_performance"]:
    df[c] = pd.to_numeric(df[c], errors="coerce")
df = df.dropna(subset=["hrv", "resting_heart_rate", "hrv_baseline",
                       "rhr_baseline", "recovery_score",
                       "skin_temp_deviation", "respiratory_rate"]).reset_index(drop=True)
print(f"  filas validas tras limpieza: {len(df):,}")

# --- Etiquetas derivadas ---
df["flag_recovery"] = ((df["hrv"] < 0.80 * df["hrv_baseline"])).astype(int)
df["flag_acute"] = ((df["resting_heart_rate"] > 1.10 * df["rhr_baseline"]) &
                    (df["recovery_score"] < 50)).astype(int)
df["flag_infection"] = ((df["skin_temp_deviation"].abs() > 0.5) &
                        (df["respiratory_rate"] > 18) &
                        (df["recovery_score"] < 40)).astype(int)

# --- Features (las mismas que el pipeline de la app, sin leakage de la etiqueta) ---
FEATURES = ["hrv", "resting_heart_rate", "hrv_baseline", "rhr_baseline",
            "recovery_score", "sleep_hours", "sleep_efficiency",
            "sleep_performance", "respiratory_rate", "skin_temp_deviation",
            "day_strain", "wake_ups", "age"]

motors = {
    "control_estadistico": "flag_recovery",
    "patron_agudo": "flag_acute",
    "proceso_infeccioso": "flag_infection",
}

results = {}
skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

for name, target in motors.items():
    y = df[target].values
    X = df[FEATURES].values
    pos = int(y.sum())
    print(f"\n=== Motor: {name} | positivos: {pos:,} ({100*pos/len(y):.2f}%) ===")

    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=0.20, stratify=y, random_state=42)

    clf = RandomForestClassifier(
        n_estimators=120, max_depth=12, min_samples_leaf=20,
        class_weight="balanced", n_jobs=-1, random_state=42)
    clf.fit(X_tr, y_tr)

    # 5-fold CV real sobre TODO el dataset
    cv = cross_val_score(clf, X, y, cv=skf, scoring="roc_auc", n_jobs=-1)
    # Curva ROC del hold-out
    proba = clf.predict_proba(X_te)[:, 1]
    auc = roc_auc_score(y_te, proba)
    fpr, tpr, _ = roc_curve(y_te, proba)
    yhat = (proba >= 0.5).astype(int)
    cm = confusion_matrix(y_te, yhat)

    results[name] = {
        "n": int(len(y)),
        "positivos": pos,
        "prevalencia": round(float(y.mean()), 4),
        "cv_auc_mean": round(float(cv.mean()), 4),
        "cv_auc_std": round(float(cv.std()), 4),
        "holdout_auc": round(float(auc), 4),
        "accuracy": round(float((yhat == y_te).mean()), 4),
        "confusion_matrix": cm.tolist(),
        "feature_importances": dict(sorted(
            zip(FEATURES, [round(float(v), 4) for v in clf.feature_importances_]),
            key=lambda kv: -kv[1])),
        "fpr": [round(float(v), 4) for v in fpr[::max(1, len(fpr)//50)]],
        "tpr": [round(float(v), 4) for v in tpr[::max(1, len(tpr)//50)]],
    }
    print(f"  CV AUC: {cv.mean():.3f} ± {cv.std():.3f} | Hold-out AUC: {auc:.3f}")
    print(f"  Accuracy: {results[name]['accuracy']:.3f} | Confusion: {cm.tolist()}")

    # --- Graficas ---
    plt.figure(figsize=(5, 4))
    plt.plot(fpr, tpr, color="#9BA8F2", lw=2, label=f"AUC={auc:.3f}")
    plt.plot([0, 1], [0, 1], "--", color="#64748B", lw=1)
    plt.title(f"ROC — {name}")
    plt.xlabel("False Positive Rate"); plt.ylabel("True Positive Rate")
    plt.legend(loc="lower right"); plt.tight_layout()
    plt.savefig(f"files/roc_{name}.png", dpi=110); plt.close()

    plt.figure(figsize=(4, 4))
    plt.imshow(cm, cmap="Blues")
    plt.title(f"Matriz de confusion — {name}")
    plt.xlabel("Predicho"); plt.ylabel("Real")
    plt.xticks([0, 1], ["0", "1"]); plt.yticks([0, 1], ["0", "1"])
    plt.tight_layout(); plt.savefig(f"files/confusion_{name}.png", dpi=110); plt.close()

with open(OUT_JSON, "w") as f:
    json.dump(results, f, indent=2, ensure_ascii=False)
print(f"\nResultados guardados en {OUT_JSON}")
