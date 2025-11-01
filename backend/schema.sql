DROP TABLE IF EXISTS event_logs;
DROP TABLE IF EXISTS event_sources;

CREATE TABLE event_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE event_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_source_id INTEGER NOT NULL,
  timestamp TEXT NOT NULL, -- ISO8601 format (YYYY-MM-DDTHH:MM:SSZ)
  content TEXT NOT NULL,
  FOREIGN KEY (event_source_id) REFERENCES event_sources(id)
);
