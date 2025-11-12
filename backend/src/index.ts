import { Hono } from 'hono';
import { cors } from 'hono/cors';

// Define the environment bindings
type Bindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>();

// Apply CORS middleware to allow frontend requests
app.use('*', cors());

// --- Helper function ---
async function getOrCreateEventSource(db: D1Database, name: string): Promise<{ id: number; name: string }> {
  let eventSource = await db.prepare("SELECT * FROM event_sources WHERE name = ?").bind(name).first<{ id: number; name: string }>();
  if (eventSource) {
    return eventSource;
  }

  await db.prepare("INSERT INTO event_sources (name) VALUES (?)").bind(name).run();
  const newEventSource = await db.prepare("SELECT * FROM event_sources WHERE name = ?").bind(name).first<{ id: number; name: string }>();

  if (!newEventSource) {
    throw new Error("Failed to create or find event source after insertion.");
  }
  return newEventSource;
}

// --- API Routes ---

// POST /event-sources
app.post('/event-sources', async (c) => {
  try {
    const { name } = await c.req.json();
    if (!name) {
      return c.json({ error: 'Missing event source name' }, 400);
    }
    const eventSource = await getOrCreateEventSource(c.env.DB, name);
    return c.json(eventSource);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// GET /event-sources
app.get('/event-sources', async (c) => {
  try {
    const { results } = await c.env.DB.prepare("SELECT * FROM event_sources").all();
    return c.json(results);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// GET /event-sources/:id
app.get('/event-sources/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const eventSource = await c.env.DB.prepare("SELECT * FROM event_sources WHERE id = ?").bind(id).first();
    if (!eventSource) {
      return c.json({ error: 'Event source not found' }, 404);
    }
    return c.json(eventSource);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// DELETE /event-sources/:id
app.delete('/event-sources/:id', async (c) => {
  const id = c.req.param('id');
  try {
    // First, check if the event source exists
    const eventSource = await c.env.DB.prepare("SELECT id FROM event_sources WHERE id = ?").bind(id).first();
    if (!eventSource) {
      return c.json({ error: 'Event source not found' }, 404);
    }

    // Use a batch operation to ensure atomicity
    await c.env.DB.batch([
      c.env.DB.prepare("DELETE FROM event_logs WHERE event_source_id = ?").bind(id),
      c.env.DB.prepare("DELETE FROM event_sources WHERE id = ?").bind(id)
    ]);

    return c.json({ message: `Event source with ID ${id} and all associated logs have been deleted.` });
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// POST /event-logs
app.post('/event-logs', async (c) => {
  try {
    const { event_source_name, content } = await c.req.json();
    if (!event_source_name || !content) {
      return c.json({ error: 'Missing event_source_name or content' }, 400);
    }

    const eventSource = await getOrCreateEventSource(c.env.DB, event_source_name);
    const timestamp = new Date().toUTCString();

    const insertResult = await c.env.DB.prepare("INSERT INTO event_logs (event_source_id, timestamp, content) VALUES (?, ?, ?)")
      .bind(eventSource.id, timestamp, content)
      .run();

    if (!insertResult.meta.last_row_id) {
      return c.json({ error: 'Failed to insert event log' }, 500);
    }

    const newLog = await c.env.DB.prepare("SELECT el.*, es.name as event_source_name FROM event_logs el JOIN event_sources es ON el.event_source_id = es.id WHERE el.id = ?")
      .bind(insertResult.meta.last_row_id)
      .first();

    return c.json(newLog);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// GET /event-logs
app.get('/event-logs', async (c) => {
  try {
    const { results } = await c.env.DB.prepare("SELECT el.*, es.name as event_source_name FROM event_logs el JOIN event_sources es ON el.event_source_id = es.id ORDER BY el.timestamp DESC").all();
    return c.json(results);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// GET /event-logs/:id
app.get('/event-logs/:id', async (c) => {
  const id = c.req.param('id');
  try {
    const eventLog = await c.env.DB.prepare("SELECT el.*, es.name as event_source_name FROM event_logs el JOIN event_sources es ON el.event_source_id = es.id WHERE el.id = ?").bind(id).first();
    if (!eventLog) {
      return c.json({ error: 'Event log not found' }, 404);
    }
    return c.json(eventLog);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// GET /event-logs/source/:event_source_id
app.get('/event-logs/source/:event_source_id', async (c) => {
  const event_source_id = c.req.param('event_source_id');
  try {
    const { results } = await c.env.DB.prepare("SELECT el.*, es.name as event_source_name FROM event_logs el JOIN event_sources es ON el.event_source_id = es.id WHERE el.event_source_id = ? ORDER BY el.timestamp DESC").bind(event_source_id).all();
    return c.json(results);
  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

// DELETE /event-logs/prune
app.delete('/event-logs/prune', async (c) => {
  try {
    const { event_source_id, event_source_name, count } = await c.req.json<{
      event_source_id?: number;
      event_source_name?: string;
      count: number;
    }>();

    if (!count || count <= 0) {
      return c.json({ error: 'A positive "count" is required.' }, 400);
    }

    if (!event_source_id && !event_source_name) {
      return c.json({ error: 'Either "event_source_id" or "event_source_name" is required.' }, 400);
    }

    let sourceId: number;

    if (event_source_name) {
      const eventSource = await c.env.DB.prepare("SELECT id FROM event_sources WHERE name = ?").bind(event_source_name).first<{ id: number }>();
      if (!eventSource) {
        return c.json({ error: `Event source with name "${event_source_name}" not found.` }, 404);
      }
      sourceId = eventSource.id;
    } else {
      sourceId = event_source_id!;
      // Verify the id exists
      const eventSource = await c.env.DB.prepare("SELECT id FROM event_sources WHERE id = ?").bind(sourceId).first<{ id: number }>();
      if (!eventSource) {
        return c.json({ error: `Event source with ID ${sourceId} not found.` }, 404);
      }
    }

    const stmt = c.env.DB.prepare(`
      DELETE FROM event_logs
      WHERE id IN (
        SELECT id
        FROM event_logs
        WHERE event_source_id = ?
        ORDER BY timestamp ASC
        LIMIT ?
      )
    `);

    const result = await stmt.bind(sourceId, count).run();
    const deletedRows = result.meta.changes ?? 0;

    return c.json({ message: `Successfully pruned ${deletedRows} old log(s) for event source ID ${sourceId}.`, deleted_count: deletedRows });

  } catch (e: any) {
    return c.json({ error: e.message }, 500);
  }
});

export default app;
