"""
Germino-Punzal Dental Clinic: analytics job (PySpark).

Reads appointments, services and patients from MongoDB, computes the numbers
shown on the admin "Analytics" page with Spark, and saves them in the
`analytics_results` collection (one document with _id "latest").

Run it by hand:   python clinic_analytics.py
or from the admin Analytics page (the "Refresh" button runs this same script).
"""
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient
from pyspark.sql import SparkSession, functions as F, types as T

# Use the same Python for Spark's workers (avoids "Python worker failed to connect" on Windows)
os.environ.setdefault("PYSPARK_PYTHON", sys.executable)
os.environ.setdefault("PYSPARK_DRIVER_PYTHON", sys.executable)

# Reuse the backend's .env for the MongoDB connection
load_dotenv(Path(__file__).resolve().parent.parent / "backend" / ".env")

MONGO_URI = (
    os.getenv("MONGO_URI")
    or os.getenv("MONGODB_URI")
    or os.getenv("DATABASE_URL")
    or "mongodb://127.0.0.1:27017/dental_clinic_db"
)
DEFAULT_DB = "dental_clinic_db"

STATUSES = ["Pending", "Confirmed", "Completed", "Cancelled"]
# Spark's dayofweek(): 1 = Sunday ... 7 = Saturday. We show Monday first.
WEEKDAY_ORDER = [(2, "Mon"), (3, "Tue"), (4, "Wed"), (5, "Thu"), (6, "Fri"), (7, "Sat"), (1, "Sun")]
MONTHS_SHOWN = 6


# ---------------------------------------------------------------- data loading
def load_rows(db):
    """Pull the three collections out of MongoDB as plain Python rows."""

    def day(value):
        # Dates are sent to Spark as "YYYY-MM-DD" text, so time zones can never shift the day.
        return value.strftime("%Y-%m-%d") if value else None

    appointments = [
        {
            "id": str(a["_id"]),
            "patient": str(a.get("patient")),
            "service": str(a.get("service")),
            "date": day(a.get("appointmentDate")),
            "time": a.get("appointmentTime") or "00:00",
            "status": a.get("status") or "Pending",
        }
        for a in db.appointments.find({})
    ]
    services = [
        {"id": str(s["_id"]), "name": s.get("name"), "price": float(s.get("price") or 0)}
        for s in db.dentalservices.find({})
    ]
    patients = [{"id": str(p["_id"]), "created": day(p.get("createdAt"))} for p in db.patients.find({})]
    return appointments, services, patients


# --------------------------------------------------------------------- Spark
def build_spark():
    spark = (
        SparkSession.builder.appName("GerminoPunzalAnalytics")
        .master("local[*]")
        .config("spark.sql.session.timeZone", "UTC")
        .config("spark.ui.enabled", "false")
        .config("spark.driver.host", "127.0.0.1")
        .config("spark.sql.shuffle.partitions", "4")
        .getOrCreate()
    )
    spark.sparkContext.setLogLevel("ERROR")
    return spark


def last_months(count, today=None):
    """['2026-05', ..., '2026-10']: the last `count` months, oldest first."""
    today = today or datetime.now(timezone.utc)
    y, m = today.year, today.month
    months = []
    for _ in range(count):
        months.append(f"{y:04d}-{m:02d}")
        m -= 1
        if m == 0:
            y, m = y - 1, 12
    return list(reversed(months))


def hour_label(h):
    return f"{h % 12 or 12} {'AM' if h < 12 else 'PM'}"


def compute(spark, appointments, services, patients, today=None):
    """All the Spark work. Returns a dict that can be saved to MongoDB as is."""
    appt_schema = T.StructType([T.StructField(n, T.StringType()) for n in ("id", "patient", "service", "date", "time", "status")])
    svc_schema = T.StructType([
        T.StructField("service_id", T.StringType()),
        T.StructField("name", T.StringType()),
        T.StructField("price", T.DoubleType()),
    ])
    pat_schema = T.StructType([T.StructField("id", T.StringType()), T.StructField("created", T.StringType())])

    appts = (
        spark.createDataFrame(appointments, appt_schema)
        .withColumn("date", F.to_date("date"))
        .withColumn("month", F.date_format("date", "yyyy-MM"))
        .withColumn("hour", F.substring("time", 1, 2).cast("int"))
        .withColumn("dow", F.dayofweek("date"))
    )
    svc = spark.createDataFrame(
        [{"service_id": s["id"], "name": s["name"], "price": s["price"]} for s in services], svc_schema
    )

    is_completed = F.col("status") == "Completed"
    is_cancelled = F.col("status") == "Cancelled"

    joined = (
        appts.join(svc, appts.service == svc.service_id, "left")
        .withColumn("price", F.coalesce("price", F.lit(0.0)))
        .withColumn("name", F.coalesce("name", F.lit("Unknown service")))
        # Revenue is only counted for completed visits
        .withColumn("revenue", F.when(is_completed, F.col("price")).otherwise(F.lit(0.0)))
        .cache()
    )

    # ---- summary
    total = joined.count()
    counts = {r["status"]: r["count"] for r in joined.groupBy("status").count().collect()}
    by_status = {s: int(counts.get(s, 0)) for s in STATUSES}
    revenue_total = float(joined.agg(F.sum("revenue")).first()[0] or 0.0)
    pct = lambda n: round(100.0 * n / total, 1) if total else 0.0
    summary = {
        "totalAppointments": int(total),
        "byStatus": by_status,
        "completionRate": pct(by_status["Completed"]),
        "cancellationRate": pct(by_status["Cancelled"]),
        "estimatedRevenue": round(revenue_total, 2),
        "averagePerVisit": round(revenue_total / by_status["Completed"], 2) if by_status["Completed"] else 0.0,
    }

    # ---- appointments + revenue per month (last N months, empty months shown as 0)
    rows = joined.groupBy("month").agg(
        F.count("*").alias("total"),
        F.sum(F.when(is_completed, 1).otherwise(0)).alias("completed"),
        F.sum(F.when(is_cancelled, 1).otherwise(0)).alias("cancelled"),
        F.sum("revenue").alias("revenue"),
    ).collect()
    by_month = {r["month"]: r for r in rows if r["month"]}
    monthly = []
    for m in last_months(MONTHS_SHOWN, today):
        r = by_month.get(m)
        monthly.append({
            "month": m,
            "total": int(r["total"]) if r else 0,
            "completed": int(r["completed"]) if r else 0,
            "cancelled": int(r["cancelled"]) if r else 0,
            "revenue": round(float(r["revenue"] or 0), 2) if r else 0.0,
        })

    # ---- most booked services (cancelled bookings are not counted)
    top_rows = (
        joined.filter(~is_cancelled)
        .groupBy("name")
        .agg(
            F.count("*").alias("bookings"),
            F.sum(F.when(is_completed, 1).otherwise(0)).alias("completed"),
            F.sum("revenue").alias("revenue"),
        )
        .orderBy(F.desc("bookings"), F.asc("name"))
        .limit(8)
        .collect()
    )
    top_services = [
        {"name": r["name"], "bookings": int(r["bookings"]), "completed": int(r["completed"]), "revenue": round(float(r["revenue"] or 0), 2)}
        for r in top_rows
    ]

    # ---- busiest hours and days (cancelled bookings are not counted)
    active = joined.filter(~is_cancelled)
    hour_counts = {r["hour"]: int(r["count"]) for r in active.groupBy("hour").count().collect() if r["hour"] is not None}
    hours = sorted(set(range(8, 18)) | set(hour_counts))
    busiest_hours = [{"hour": h, "label": hour_label(h), "count": hour_counts.get(h, 0)} for h in hours]

    dow_counts = {r["dow"]: int(r["count"]) for r in active.groupBy("dow").count().collect() if r["dow"] is not None}
    busiest_days = [{"day": name, "count": dow_counts.get(n, 0)} for n, name in WEEKDAY_ORDER]

    # ---- patients
    pats = spark.createDataFrame(patients, pat_schema).withColumn("month", F.date_format(F.to_date("created"), "yyyy-MM"))
    total_patients = pats.count()
    new_counts = {r["month"]: int(r["count"]) for r in pats.groupBy("month").count().collect() if r["month"]}
    new_patients = [{"month": m, "count": new_counts.get(m, 0)} for m in last_months(MONTHS_SHOWN, today)]

    per_patient = joined.filter(is_completed).groupBy("patient").count()
    returning = per_patient.filter(F.col("count") >= 2).count()
    one_time = per_patient.filter(F.col("count") == 1).count()
    patient_stats = {
        "totalPatients": int(total_patients),
        "returningPatients": int(returning),
        "oneTimePatients": int(one_time),
        "returningRate": round(100.0 * returning / (returning + one_time), 1) if (returning + one_time) else 0.0,
    }

    joined.unpersist()
    return {
        "summary": summary,
        "monthly": monthly,
        "topServices": top_services,
        "busiestHours": busiest_hours,
        "busiestDays": busiest_days,
        "newPatients": new_patients,
        "patients": patient_stats,
    }


# ---------------------------------------------------------------------- main
def main():
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=8000)
    db = client.get_default_database(default=DEFAULT_DB)

    appointments, services, patients = load_rows(db)
    print(f"Loaded {len(appointments)} appointments, {len(services)} services, {len(patients)} patients")

    spark = build_spark()
    try:
        metrics = compute(spark, appointments, services, patients)
    finally:
        spark.stop()

    document = {"_id": "latest", "generatedAt": datetime.now(timezone.utc), **metrics}
    db.analytics_results.replace_one({"_id": "latest"}, document, upsert=True)
    print("Analytics saved to the analytics_results collection.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # the backend shows a friendly message based on this output
        print(f"ERROR: {exc}", file=sys.stderr)
        raise SystemExit(1)