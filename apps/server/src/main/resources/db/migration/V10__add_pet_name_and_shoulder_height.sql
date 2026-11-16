-- 默认值仅用于满足 SQLite 对 ADD COLUMN NOT NULL 的限制；写入时必须显式提供有效值。
ALTER TABLE pet
    ADD COLUMN name TEXT NOT NULL DEFAULT ''
    CHECK (length(trim(name)) > 0);

ALTER TABLE pet
    ADD COLUMN shoulder_height_cm REAL NOT NULL DEFAULT 0
    CHECK (shoulder_height_cm > 0);
