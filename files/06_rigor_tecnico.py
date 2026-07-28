"""
BIO PULSE - Modulo 6: Rigor Tecnico para Sustentacion
Compara 3 modelos (Regresion Logistica -> baseline, Random Forest -> el elegido,
Gradient Boosting -> alternativa de boosting), con validacion cruzada 5-fold,
curvas ROC superpuestas, matriz de confusion y reporte de metricas.

Genera 4 figuras PNG listas para pegar en la presentacion:
  - roc_comparison.png
  - confusion_matrix_rf.png
  - cv_metrics_comparison.png
  - feature_importance_rf.png
"""
import pandas as pd
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_validate
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    roc_curve, roc_auc_score, confusion_matrix,
    classification_report, precision_recall_fscore_support
)

APEN_PATH = "/home/claude/biopulse/with_apen.pkl"
OUT_DIR = "/home/claude/biopulse/figures"
import os
os.makedirs(OUT_DIR, exist_ok=True)

FEATURE_COLS = [
    "age", "weight_kg", "height_cm",
    "recovery_score", "day_strain",
    "sleep_hours", "sleep_efficiency", "sleep_performance",
    "light_sleep_hours", "rem_sleep_hours", "deep_sleep_hours",
    "wake_ups", "time_to_fall_asleep_min",
    "hrv", "resting_heart_rate", "hrv_baseline", "rhr_baseline",
    "respiratory_rate", "skin_temp_deviation",
    "hrv_dev", "rhr_dev", "sleep_fragmentation", "sleep_debt",
    "strain_recovery_ratio",
]

# --- Paleta consistente con la app (para que las figuras combinen con el pitch deck) ---
BG = "#0A1420"
CARD = "#101F30"
TEXT = "#EAF2F5"
MUTED = "#8AA0B2"
TEAL = "#4FD8C4"
AMBER = "#F2B84B"
ROSE = "#F0687A"
PURPLE = "#9BA8F2"
GRID = "#1D3348"

plt.rcParams.update({
    "figure.facecolor": BG, "axes.facecolor": CARD, "savefig.facecolor": BG,
    "axes.edgecolor": GRID, "axes.labelcolor": TEXT, "text.color": TEXT,
    "xtick.color": MUTED, "ytick.color": MUTED, "grid.color": GRID,
    "font.size": 11, "axes.titlecolor": TEXT, "axes.titleweight": "bold",
})


def build_risk_label(df):
    control_flag = df["control_anomaly_count"] >= 1
    apen_flag = df["apen_risk_score"] >= 50
    acute_pattern = (df["recovery_score"] < 40) & (df["hrv_dev"] < -5) & (df["rhr_dev"] > 3)
    fever_pattern = (df["skin_temp_deviation"] > 1.0) & (df["respiratory_rate"] > 16)
    return (control_flag | apen_flag | acute_pattern | fever_pattern).astype(int)


def load_data(sample_n=25000):
    """
    Para la comparacion de modelos se usa una submuestra ESTRATIFICADA de
    sample_n filas (en vez de las 100k completas). Motivo: este entorno de
    demo corre en 1 CPU, y 3 modelos x 5 folds sobre 100k filas no es viable
    en tiempo razonable. El modelo de PRODUCCION (Modulo 4) SI se entreno
    sobre las 100k filas completas; esta submuestra es solo para poder
    comparar 3 algoritmos y hacer CV de forma agil para la sustentacion.
    La prevalencia de la clase se preserva exactamente (stratify=y).
    """
    df = pd.read_pickle(APEN_PATH)
    df["high_risk"] = build_risk_label(df)
    model_df = df.dropna(subset=FEATURE_COLS + ["high_risk"])
    X_full = model_df[FEATURE_COLS]
    y_full = model_df["high_risk"]
    if sample_n < len(X_full):
        X, _, y, _ = train_test_split(
            X_full, y_full, train_size=sample_n, stratify=y_full, random_state=42
        )
    else:
        X, y = X_full, y_full
    return X, y


def get_models():
    """
    3 modelos deliberadamente distintos en su forma de aprender:
      - Regresion Logistica: baseline lineal, interpretable, rapido
      - Random Forest: bagging de arboles, el elegido para produccion
      - Gradient Boosting: boosting secuencial, alternativa de mayor capacidad
        (mismo rol que XGBoost en esta comparacion; XGBoost no estaba disponible
        sin conexion a internet en este entorno, pero la interfaz es intercambiable)
    """
    return {
        "Regresion Logistica": Pipeline([
            ("scaler", StandardScaler()),
            ("clf", LogisticRegression(max_iter=2000, class_weight="balanced", random_state=42)),
        ]),
        "Random Forest": RandomForestClassifier(
            n_estimators=150, max_depth=12, min_samples_leaf=5,
            class_weight="balanced", random_state=42, n_jobs=-1,
        ),
        "Gradient Boosting": GradientBoostingClassifier(
            n_estimators=80, max_depth=3, learning_rate=0.1, random_state=42,
        ),
    }


def run_cross_validation(X, y, models, n_splits=5):
    """5-fold CV estratificada. Devuelve DataFrame largo con metricas por fold."""
    cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)
    scoring = {
        "roc_auc": "roc_auc",
        "precision": "precision",
        "recall": "recall",
        "f1": "f1",
    }
    rows = []
    for name, model in models.items():
        scores = cross_validate(model, X, y, cv=cv, scoring=scoring, n_jobs=-1)
        for metric in scoring:
            for fold_val in scores[f"test_{metric}"]:
                rows.append({"model": name, "metric": metric, "value": fold_val})
    return pd.DataFrame(rows)


def plot_cv_comparison(cv_df, path):
    metrics = ["roc_auc", "precision", "recall", "f1"]
    metric_labels = {"roc_auc": "ROC-AUC", "precision": "Precision", "recall": "Recall", "f1": "F1-score"}
    models = cv_df["model"].unique()
    colors = {models[0]: PURPLE, models[1]: TEAL, models[2]: AMBER}

    fig, axes = plt.subplots(1, 4, figsize=(15, 4.2))
    for ax, metric in zip(axes, metrics):
        means, stds, names, cols = [], [], [], []
        for m in models:
            vals = cv_df[(cv_df.model == m) & (cv_df.metric == metric)]["value"]
            means.append(vals.mean()); stds.append(vals.std()); names.append(m); cols.append(colors[m])
        bars = ax.bar(range(len(names)), means, yerr=stds, capsize=4, color=cols, width=0.6,
                       edgecolor="none", error_kw={"ecolor": MUTED, "elinewidth": 1.2})
        ax.set_xticks(range(len(names)))
        ax.set_xticklabels([n.replace(" ", "\n") for n in names], fontsize=8.5)
        ax.set_title(metric_labels[metric], fontsize=12)
        ax.set_ylim(0, 1.0)
        ax.grid(axis="y", alpha=0.25)
        for spine in ["top", "right"]:
            ax.spines[spine].set_visible(False)
        for i, m in enumerate(means):
            ax.text(i, m + stds[i] + 0.03, f"{m:.2f}", ha="center", fontsize=9, color=TEXT, fontweight="bold")
    fig.suptitle("Comparacion de modelos — validacion cruzada 5-fold estratificada", fontsize=13.5, y=1.04)
    fig.tight_layout()
    fig.savefig(path, dpi=180, bbox_inches="tight")
    plt.close(fig)


def plot_roc_comparison(X_test, y_test, fitted_models, path):
    fig, ax = plt.subplots(figsize=(6.5, 6))
    colors = {"Regresion Logistica": PURPLE, "Random Forest": TEAL, "Gradient Boosting": AMBER}
    for name, model in fitted_models.items():
        proba = model.predict_proba(X_test)[:, 1]
        fpr, tpr, _ = roc_curve(y_test, proba)
        auc = roc_auc_score(y_test, proba)
        ax.plot(fpr, tpr, label=f"{name} (AUC={auc:.3f})", color=colors[name], linewidth=2.4)
    ax.plot([0, 1], [0, 1], linestyle="--", color=MUTED, linewidth=1, label="Azar (AUC=0.500)")
    ax.set_xlabel("Tasa de falsos positivos")
    ax.set_ylabel("Tasa de verdaderos positivos (Recall)")
    ax.set_title("Curvas ROC — comparacion de modelos", fontsize=13)
    ax.legend(loc="lower right", fontsize=9, frameon=False, labelcolor=TEXT)
    ax.grid(alpha=0.25)
    for spine in ["top", "right"]:
        ax.spines[spine].set_visible(False)
    fig.tight_layout()
    fig.savefig(path, dpi=180, bbox_inches="tight")
    plt.close(fig)


def plot_confusion_matrix(y_test, y_pred, path):
    cm = confusion_matrix(y_test, y_pred)
    labels = ["Bajo riesgo", "Alto riesgo"]
    fig, ax = plt.subplots(figsize=(5, 4.6))
    im = ax.imshow(cm, cmap="BuGn")
    for i in range(2):
        for j in range(2):
            color = BG if cm[i, j] > cm.max() / 1.7 else TEXT
            ax.text(j, i, f"{cm[i, j]:,}", ha="center", va="center", fontsize=15, fontweight="bold", color=color)
    ax.set_xticks([0, 1]); ax.set_yticks([0, 1])
    ax.set_xticklabels(labels); ax.set_yticklabels(labels)
    ax.set_xlabel("Prediccion"); ax.set_ylabel("Real")
    ax.set_title("Matriz de confusion — Random Forest (test set)", fontsize=12.5)
    for spine in ax.spines.values():
        spine.set_visible(False)
    fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04)
    fig.tight_layout()
    fig.savefig(path, dpi=180, bbox_inches="tight")
    plt.close(fig)


def plot_feature_importance(model, feature_names, path, top_n=10):
    importances = pd.Series(model.feature_importances_, index=feature_names).sort_values(ascending=True).tail(top_n)
    fig, ax = plt.subplots(figsize=(7, 5))
    colors_grad = [ROSE if v == importances.max() else (AMBER if v > importances.median() else TEAL) for v in importances]
    ax.barh(importances.index, importances.values, color=colors_grad)
    ax.set_title(f"Top {top_n} variables mas importantes — Random Forest", fontsize=12.5)
    ax.set_xlabel("Importancia (Gini)")
    for spine in ["top", "right"]:
        ax.spines[spine].set_visible(False)
    ax.grid(axis="x", alpha=0.25)
    fig.tight_layout()
    fig.savefig(path, dpi=180, bbox_inches="tight")
    plt.close(fig)


def main():
    print("Cargando datos y etiqueta de riesgo...")
    X, y = load_data()
    print(f"N={len(X)}, prevalencia de riesgo={y.mean()*100:.2f}%")

    models = get_models()

    print("\nCorriendo validacion cruzada 5-fold estratificada (esto compensa tener un solo split)...")
    cv_df = run_cross_validation(X, y, models)
    summary = cv_df.groupby(["model", "metric"])["value"].agg(["mean", "std"]).round(3)
    print(summary)
    plot_cv_comparison(cv_df, f"{OUT_DIR}/cv_metrics_comparison.png")

    print("\nEntrenando en split final 80/20 para ROC y matriz de confusion...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    fitted = {}
    for name, model in models.items():
        model.fit(X_train, y_train)
        fitted[name] = model

    plot_roc_comparison(X_test, y_test, fitted, f"{OUT_DIR}/roc_comparison.png")

    rf = fitted["Random Forest"]
    y_pred_rf = rf.predict(X_test)
    plot_confusion_matrix(y_test, y_pred_rf, f"{OUT_DIR}/confusion_matrix_rf.png")
    plot_feature_importance(rf, FEATURE_COLS, f"{OUT_DIR}/feature_importance_rf.png")

    print("\n--- Reporte final Random Forest (test set) ---")
    print(classification_report(y_test, y_pred_rf, digits=3, target_names=["Bajo riesgo", "Alto riesgo"]))

    print(f"\nFiguras guardadas en {OUT_DIR}/")
    return cv_df, fitted


if __name__ == "__main__":
    main()
