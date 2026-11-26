CREATE TABLE equipment (
  equipment_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(80) NOT NULL,
  quantity BIGINT UNSIGNED NOT NULL,
  `condition` ENUM('Good', 'Damaged', 'Maintenance') NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  CONSTRAINT equipment_quantity_safe CHECK (quantity <= 9007199254740991)
);
