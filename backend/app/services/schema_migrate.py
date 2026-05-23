from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


def migrate_schema(engine: Engine) -> None:
    """Add columns introduced after initial deploy (create_all does not alter tables)."""
    inspector = inspect(engine)
    if "users" in inspector.get_table_names():
        user_cols = {c["name"] for c in inspector.get_columns("users")}
        if "building_id" not in user_cols:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN building_id VARCHAR(36)"))

    if "units" in inspector.get_table_names():
        unit_cols = {c["name"] for c in inspector.get_columns("units")}
        if "building_id" not in unit_cols:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE units ADD COLUMN building_id VARCHAR(36)"))
