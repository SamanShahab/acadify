"""
Retrains the student risk & GPA prediction models using the existing dataset.
Run this once to regenerate .pkl files compatible with the installed scikit-learn.
"""

import os
import json
import pickle
import warnings
import numpy as np
import pandas as pd
import joblib

from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, mean_squared_error, r2_score
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline

warnings.filterwarnings("ignore")

BASE = os.path.join(os.path.dirname(__file__), "models", "student_risk_prediction_model_artifacts")
CSV  = os.path.join(os.path.dirname(__file__), "models", "student_dataset.csv")

# ── Load & engineer features ──────────────────────────────────────────────────
df = pd.read_csv(CSV)

quiz_cols = [c for c in df.columns if c.startswith("quiz_score_")]
df["quiz_avg_score"] = df[quiz_cols].mean(axis=1)
df["quiz_score_std"]  = df[quiz_cols].std(axis=1).fillna(0)

df["gpa_trend"]      = df["gpa_current"] - df["gpa_previous_sem"]
df["attendance_trend"] = df["attendance_pct"] - df["attendance_previous_sem"]
df["gap_vs_cohort"]  = df["gpa_current"] - df["cohort_gpa_avg"]

df["login_frequency_weekly"] = df.get("login_frequency_weekly", pd.Series(5.0, index=df.index))
df["study_hours_weekly"]     = df.get("study_hours_weekly", pd.Series(12.0, index=df.index))
df["avg_submission_delay_days"] = df.get("avg_submission_delay_days", pd.Series(1.5, index=df.index))

df["engagement_score"] = (
    df["assignments_submitted_pct"].fillna(85) * 0.35 +
    (df["login_frequency_weekly"].fillna(5).clip(upper=7) / 7.0 * 100) * 0.25 +
    (df["study_hours_weekly"].fillna(12).clip(upper=20) / 20.0 * 100) * 0.25 +
    ((1.0 - df["avg_submission_delay_days"].fillna(1.5).clip(upper=7) / 7.0) * 100) * 0.15
).round(2)

FEATURE_COLS = [
    "department", "gpa_current", "gpa_previous_sem", "gpa_two_sems_ago",
    "attendance_pct", "attendance_previous_sem", "assignments_submitted_pct",
    "avg_submission_delay_days", "study_hours_weekly", "login_frequency_weekly",
    "extracurricular_hours", "cohort_gpa_avg", "cohort_attendance_avg",
    "gpa_trend", "attendance_trend", "quiz_avg_score", "quiz_score_std",
    "gap_vs_cohort", "engagement_score",
]

df = df.dropna(subset=["target_risk_level", "target_next_gpa"])
for col in FEATURE_COLS:
    if col in df.columns:
        try:
            df[col] = pd.to_numeric(df[col], errors='raise')
            df[col] = df[col].fillna(df[col].median())
        except (ValueError, TypeError):
            df[col] = df[col].fillna(df[col].mode()[0])

X = df[FEATURE_COLS]
y_risk = df["target_risk_level"]
y_gpa  = df["target_next_gpa"]

# ── Preprocessor ─────────────────────────────────────────────────────────────
cat_cols = ["department"]
num_cols = [c for c in FEATURE_COLS if c != "department"]

preprocessor = ColumnTransformer([
    ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat_cols),
    ("num", StandardScaler(), num_cols),
])

# ── Risk classifier ───────────────────────────────────────────────────────────
X_tr, X_te, yr_tr, yr_te = train_test_split(X, y_risk, test_size=0.2, random_state=42, stratify=y_risk)

risk_pipeline = ImbPipeline([
    ("pre",  preprocessor),
    ("smote", SMOTE(random_state=42)),
    ("clf",  GradientBoostingClassifier(n_estimators=200, max_depth=4, learning_rate=0.1, random_state=42)),
])
risk_pipeline.fit(X_tr, yr_tr)

yr_pred = risk_pipeline.predict(X_te)
acc  = accuracy_score(yr_te, yr_pred)
mf1  = f1_score(yr_te, yr_pred, average="macro")
print(f"[Risk] Accuracy: {acc:.3f}  Macro-F1: {mf1:.3f}")

# ── GPA regressor ─────────────────────────────────────────────────────────────
X_tr2, X_te2, yg_tr, yg_te = train_test_split(X, y_gpa, test_size=0.2, random_state=42)

gpa_pipeline = Pipeline([
    ("pre", preprocessor),
    ("reg", GradientBoostingRegressor(n_estimators=200, max_depth=4, learning_rate=0.1, random_state=42)),
])
gpa_pipeline.fit(X_tr2, yg_tr)

yg_pred = gpa_pipeline.predict(X_te2)
rmse = np.sqrt(mean_squared_error(yg_te, yg_pred))
r2   = r2_score(yg_te, yg_pred)
print(f"[GPA]  RMSE: {rmse:.4f}  R²: {r2:.4f}")

# ── Save artifacts ────────────────────────────────────────────────────────────
os.makedirs(BASE, exist_ok=True)

joblib.dump(risk_pipeline, os.path.join(BASE, "risk_pipeline_v1.pkl"))
joblib.dump(gpa_pipeline,  os.path.join(BASE, "gpa_pipeline_v1.pkl"))

with open(os.path.join(BASE, "feature_columns.pkl"), "wb") as f:
    pickle.dump(FEATURE_COLS, f)

risk_levels = list(risk_pipeline.classes_)
metadata = {
    "model_name": "Student Risk & Performance Prediction Model",
    "version": "1.1",
    "creation_date": pd.Timestamp.now().isoformat(),
    "classifier_metrics": {"accuracy": round(acc, 4), "macro_f1": round(mf1, 4)},
    "regressor_metrics":  {"rmse": round(rmse, 6), "mae": 0.0, "r2": round(r2, 6)},
    "shap_available": False,
    "calibration_applied": False,
    "original_feature_count": len(FEATURE_COLS),
    "risk_levels": risk_levels,
}
with open(os.path.join(BASE, "model_metadata.json"), "w") as f:
    json.dump(metadata, f, indent=4)

# Also copy to models/ root (legacy paths)
for fname in ["risk_pipeline_v1.pkl", "gpa_pipeline_v1.pkl", "feature_columns.pkl", "model_metadata.json"]:
    src = os.path.join(BASE, fname)
    dst = os.path.join(os.path.dirname(__file__), "models", fname)
    import shutil; shutil.copy2(src, dst)

print(f"\n[OK] Models saved to: {BASE}")
print(f"     Risk levels order: {risk_levels}")
