"""
NEXUS AI — Student Risk & Performance Prediction Engine
Powered by trained XGBoost + imblearn pipelines (pkl artifacts).
"""

import os
import pickle
import json
import datetime
import warnings
from functools import lru_cache

import joblib
import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")

_BASE = os.path.join(os.path.dirname(__file__), "..", "ai_model", "student_risk_prediction_model_artifacts")

@lru_cache(maxsize=1)
def _load_models():
    with open(os.path.join(_BASE, "feature_columns.pkl"), "rb") as feature_file:
        feature_columns = pickle.load(feature_file)
    with open(os.path.join(_BASE, "model_metadata.json")) as metadata_file:
        metadata = json.load(metadata_file)
    risk_pipeline = joblib.load(os.path.join(_BASE, "risk_pipeline_v1.pkl"))
    gpa_pipeline = joblib.load(os.path.join(_BASE, "gpa_pipeline_v1.pkl"))
    return risk_pipeline, gpa_pipeline, feature_columns, metadata


# ── Feature engineering ───────────────────────────────────────────────────────
def _build_feature_row(student_data: dict) -> pd.DataFrame:
    """
    Engineers all 19 model features from the student's MongoDB document.
    Missing optional fields are derived from available data.
    """
    gpa        = float(student_data.get("gpa", 3.0))
    attendance = float(student_data.get("attendance_pct", 80.0))
    department = str(student_data.get("department", "General"))

    gpa_prev   = float(student_data.get("gpa_previous_sem",  max(0.0, gpa - 0.1)))
    gpa_2ago   = float(student_data.get("gpa_two_sems_ago",  max(0.0, gpa - 0.2)))
    att_prev   = float(student_data.get("attendance_previous_sem", max(0.0, attendance - 2.0)))

    assignments = float(student_data.get("assignments_submitted_pct", 85.0))
    delay_days  = float(student_data.get("avg_submission_delay_days", 1.5))
    study_hrs   = float(student_data.get("study_hours_weekly", 12.0))
    login_freq  = float(student_data.get("login_frequency_weekly", 5.0))
    extra_hrs   = float(student_data.get("extracurricular_hours", 2.0))
    cohort_gpa  = float(student_data.get("cohort_gpa_avg", 3.0))
    cohort_att  = float(student_data.get("cohort_attendance_avg", 80.0))
    quiz_avg    = float(student_data.get("quiz_avg_score", 70.0))
    quiz_std    = float(student_data.get("quiz_score_std", 10.0))

    gpa_trend     = round(gpa - gpa_prev, 3)
    att_trend     = round(attendance - att_prev, 3)
    gap_vs_cohort = round(gpa - cohort_gpa, 3)

    engagement = round(
        (assignments * 0.35) +
        (min(login_freq / 7.0, 1.0) * 100 * 0.25) +
        (min(study_hrs / 20.0, 1.0) * 100 * 0.25) +
        (max(0.0, 1.0 - delay_days / 7.0) * 100 * 0.15),
        2
    )

    row = {
        "department":                department,
        "gpa_current":               gpa,
        "gpa_previous_sem":          gpa_prev,
        "gpa_two_sems_ago":          gpa_2ago,
        "attendance_pct":            attendance,
        "attendance_previous_sem":   att_prev,
        "assignments_submitted_pct": assignments,
        "avg_submission_delay_days": delay_days,
        "study_hours_weekly":        study_hrs,
        "login_frequency_weekly":    login_freq,
        "extracurricular_hours":     extra_hrs,
        "cohort_gpa_avg":            cohort_gpa,
        "cohort_attendance_avg":     cohort_att,
        "gpa_trend":                 gpa_trend,
        "attendance_trend":          att_trend,
        "quiz_avg_score":            quiz_avg,
        "quiz_score_std":            quiz_std,
        "gap_vs_cohort":             gap_vs_cohort,
        "engagement_score":          engagement,
    }
    return pd.DataFrame([row], columns=_load_models()[2])


def _grade_tier(predicted_gpa: float) -> str:
    if predicted_gpa >= 3.7: return "A / Excellent"
    if predicted_gpa >= 3.2: return "B+ / Above Average"
    if predicted_gpa >= 2.7: return "B / Satisfactory"
    if predicted_gpa >= 2.0: return "C / At Risk"
    return "D-F / Critical Intervention Required"


def _risk_score_from_proba(proba: np.ndarray) -> float:
    """Converts class probabilities to a 0–100 risk score."""
    risk_levels = list(_load_models()[0].classes_)
    weights = {"High": 100.0, "Medium": 50.0, "Low": 0.0}
    score = sum(weights.get(risk_levels[i], 50.0) * float(p) for i, p in enumerate(proba))
    return round(score, 1)


def _build_recommendations(risk_label: str, gpa: float, attendance: float,
                            gpa_trend: float, engagement: float) -> list:
    recs = []
    if attendance < 70:
        recs.append("Critical attendance deficit (<70%). Mandatory academic counseling required.")
    elif attendance < 80:
        recs.append("Attendance below threshold. Schedule advising session with department coordinator.")

    if gpa < 2.0:
        recs.append("GPA critically low. Immediate peer tutoring and faculty mentorship recommended.")
    elif gpa < 2.5:
        recs.append("Assign peer tutor for core departmental courses to stabilize GPA.")

    if gpa_trend < -0.3:
        recs.append("Declining GPA trend detected. Review course load and study strategy.")

    if engagement < 50:
        recs.append("Low digital engagement. Encourage consistent LMS participation and assignment submissions.")

    if risk_label == "High":
        recs.append("HIGH RISK ALERT: Trigger Early Intervention Protocol — notify Department Head and Student Affairs.")

    if not recs:
        recs.append("Academic performance is on track. Eligible for Honors / Research Track consideration.")

    return recs


# ── Public API ─────────────────────────────────────────────────────────────────
def predict_student_risk(student_data: dict) -> dict:
    """
    Main prediction function. Accepts a student dict (from MongoDB or form)
    and returns a full prediction payload compatible with PredictionModel.create().
    """
    risk_pipeline, gpa_pipeline, _, metadata = _load_models()
    X = _build_feature_row(student_data)

    risk_label   = str(risk_pipeline.predict(X)[0])
    risk_proba   = risk_pipeline.predict_proba(X)[0]
    predicted_gpa = float(np.clip(gpa_pipeline.predict(X)[0], 0.0, 4.0))

    risk_score  = _risk_score_from_proba(risk_proba)
    confidence  = round(float(np.max(risk_proba)) * 100, 1)

    gpa        = float(student_data.get("gpa", 3.0))
    attendance = float(student_data.get("attendance_pct", 80.0))
    gpa_prev   = float(student_data.get("gpa_previous_sem", max(0.0, gpa - 0.1)))
    gpa_trend  = round(gpa - gpa_prev, 3)
    engagement = float(X["engagement_score"].iloc[0])

    risk_levels = list(risk_pipeline.classes_)
    proba_dict = {risk_levels[i]: round(float(p) * 100, 1) for i, p in enumerate(risk_proba)}

    return {
        "predicted_at":       datetime.datetime.now(datetime.timezone.utc),
        "risk_score":         risk_score,
        "risk_level":         risk_label.upper(),
        "confidence":         confidence,
        "risk_probabilities": proba_dict,
        "performance_forecast": {
            "predicted_gpa": round(predicted_gpa, 2),
            "grade_tier":    _grade_tier(predicted_gpa),
        },
        "recommendations":    _build_recommendations(risk_label, gpa, attendance, gpa_trend, engagement),
        "model_version":     f"NEXUS-ML-v{metadata['version']}-pkl",
        "model_accuracy":    round(metadata["classifier_metrics"]["accuracy"] * 100, 1),
        "regressor_r2":      round(metadata["regressor_metrics"]["r2"] * 100, 1),
    }


def get_model_info() -> dict:
    """Returns model metadata for admin settings / about pages."""
    risk_pipeline, _, feature_columns, metadata = _load_models()
    return {
        "name":        metadata["model_name"],
        "version":     metadata["version"],
        "created":     metadata["creation_date"],
        "accuracy":    round(metadata["classifier_metrics"]["accuracy"] * 100, 1),
        "macro_f1":    round(metadata["classifier_metrics"]["macro_f1"] * 100, 1),
        "gpa_rmse":    round(metadata["regressor_metrics"]["rmse"], 4),
        "gpa_r2":      round(metadata["regressor_metrics"]["r2"] * 100, 1),
        "features":    len(feature_columns),
        "risk_levels": list(risk_pipeline.classes_),
    }
