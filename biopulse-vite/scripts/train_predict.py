#!/usr/bin/env python3
"""
train_predict.py — Entrena un modelo de riesgo a +3 días (Punto 8, Fase 2).

Lee biopulse-datos.json exportado desde la app (botón "Exportar mis datos").
Construye features por día y entrena un RandomForestRegressor para predecir
el Risk Score de hace 3 días hacia adelante. Exporta a api/predict/model.json
para que api/predict.js lo cargue cuando esté disponible.

USO:
    pip install scikit-learn pandas numpy
    python scripts/train_predict.py biopulse-datos.json

NOTA: requiere datos reales y suficientes (>= 30 dias con variacion). Con
datos de demo/sinteticos el modelo NO sera util; esto es intencional.
"""
import json
import sys
import os


def build_features(payload):
    data = payload.get("metrics", [])
    logs = payload.get("logs", [])
    # indice logs por fecha
    by_date = {}
    for l in logs:
        d = (l.get("ts") or "")[:10]
        by_date.setdefault(d, []).append(l)
    # presets unicos para one-hot
    presets = sorted({l.get("preset", "custom") for l in logs})
    feat = []
    for i, d in enumerate(data):
        dk = str(d.get("date", ""))[:10]
        row = {
            "hrv": float(d.get("hrv", 0)),
            "rhr": float(d.get("rhr", 0)),
            "bioScore": float(d.get("bioScore", 0)),
            "sleepScore": float(d.get("sleepScore", 0)),
            "recovery": float(d.get("recovery", 0)),
            "riskScore": float(d.get("riskScore", 0)),
            "n_logs": len(by_date.get(dk, [])),
        }
        for p in presets:
            row["h_" + p] = sum(1 for l in by_date.get(dk, []) if l.get("preset") == p)
        # target: riskScore 3 dias despues (si existe)
        if i + 3 < len(data):
            row["y"] = float(data[i + 3].get("riskScore", 0))
            feat.append(row)
    return feat, presets


def main():
    if len(sys.argv) < 2:
        print("Uso: python train_predict.py <biopulse-datos.json>")
        sys.exit(1)
    with open(sys.argv[1], "r", encoding="utf-8") as f:
        payload = json.load(f)
    rows, presets = build_features(payload)
    if len(rows) < 30:
        print(f"Solo {len(rows)} muestras. Necesitas >= 30 dias con variacion para un modelo util.")
        print("El predictor transparente de api/predict.js sigue siendo el fallback.")
        sys.exit(0)

    try:
        from sklearn.ensemble import RandomForestRegressor
        import pandas as pd
    except ImportError:
        print("Instala dependencias: pip install scikit-learn pandas numpy")
        sys.exit(1)

    df = pd.DataFrame(rows)
    y = df["y"].values
    X = df.drop(columns=["y"]).values
    model = RandomForestRegressor(n_estimators=120, random_state=42)
    model.fit(X, y)
    score = model.score(X, y)
    print(f"Modelo entrenado. R^2 (train) = {score:.3f} en {len(df)} muestras.")

    # Exporta pesos medios por feature (importancia) a JSON para el endpoint.
    importances = dict(zip(df.drop(columns=["y"]).columns, model.feature_importances_.tolist()))
    out = {
        "model": "randomforest-v1",
        "features": list(df.drop(columns=["y"]).columns),
        "importances": importances,
        "note": "Reemplaza la logica de api/predict.js con inferencia real cuando despliegues.",
    }
    out_path = os.path.join(os.path.dirname(__file__), "..", "api", "predict", "model.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2)
    print(f"Importancias exportadas a {out_path}")


if __name__ == "__main__":
    main()
