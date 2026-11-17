ALTER TABLE trip
ADD COLUMN transport_mode TEXT CHECK (
    transport_mode IS NULL
    OR transport_mode IN ('flight', 'high_speed_rail', 'train', 'drive')
);
