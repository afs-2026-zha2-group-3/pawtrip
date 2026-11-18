CREATE TABLE trip_packing_checklist (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id    INTEGER NOT NULL UNIQUE,
    created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (trip_id) REFERENCES trip(id) ON DELETE CASCADE
);

CREATE TABLE trip_packing_item (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    checklist_id        INTEGER NOT NULL,
    category            TEXT    NOT NULL CHECK (category IN ('DOCUMENTS', 'FOOD', 'TRAVEL', 'HEALTH', 'CLEANING')),
    name                TEXT    NOT NULL,
    quantity            INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 99),
    checked             INTEGER NOT NULL DEFAULT 0 CHECK (checked IN (0, 1)),
    source              TEXT    NOT NULL CHECK (source IN ('TEMPLATE', 'CUSTOM')),
    template_key        TEXT,
    state               TEXT    NOT NULL CHECK (state IN ('ACTIVE', 'HIDDEN', 'DELETED')),
    quantity_overridden INTEGER NOT NULL DEFAULT 0 CHECK (quantity_overridden IN (0, 1)),
    sort_order          INTEGER NOT NULL,
    created_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at          TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    FOREIGN KEY (checklist_id) REFERENCES trip_packing_checklist(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX uq_packing_item_template ON trip_packing_item(checklist_id, template_key);
CREATE INDEX idx_packing_item_checklist ON trip_packing_item(checklist_id, state, sort_order);
