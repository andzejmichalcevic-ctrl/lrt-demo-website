import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database tables
export async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS analytics_events (
        id SERIAL PRIMARY KEY,
        event_type VARCHAR(100) NOT NULL,
        session_id VARCHAR(100),
        user_agent TEXT,
        page_url TEXT,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        event_data JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_events_type ON analytics_events(event_type);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_events_session ON analytics_events(session_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_events_timestamp ON analytics_events(timestamp);
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// Insert analytics event
export async function insertEvent(eventType, sessionId, userAgent, pageUrl, eventData) {
  try {
    const result = await pool.query(
      `INSERT INTO analytics_events (event_type, session_id, user_agent, page_url, event_data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, created_at`,
      [eventType, sessionId, userAgent, pageUrl, JSON.stringify(eventData)]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error inserting event:', error);
    throw error;
  }
}

// Get analytics events
export async function getEvents(filters = {}) {
  try {
    let query = 'SELECT * FROM analytics_events';
    let params = [];
    let whereConditions = [];

    if (filters.eventType) {
      whereConditions.push(`event_type = $${params.length + 1}`);
      params.push(filters.eventType);
    }

    if (filters.sessionId) {
      whereConditions.push(`session_id = $${params.length + 1}`);
      params.push(filters.sessionId);
    }

    if (filters.startDate) {
      whereConditions.push(`created_at >= $${params.length + 1}`);
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      whereConditions.push(`created_at <= $${params.length + 1}`);
      params.push(filters.endDate);
    }

    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ` LIMIT $${params.length + 1}`;
      params.push(filters.limit);
    }

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error getting events:', error);
    throw error;
  }
}

// Get analytics summary
export async function getEventsSummary() {
  try {
    const summaryQuery = `
      SELECT
        event_type,
        COUNT(*) as count,
        DATE_TRUNC('hour', created_at) as hour
      FROM analytics_events
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY event_type, hour
      ORDER BY hour DESC, count DESC
    `;

    const totalQuery = `
      SELECT
        event_type,
        COUNT(*) as total_count
      FROM analytics_events
      GROUP BY event_type
      ORDER BY total_count DESC
    `;

    const sessionsQuery = `
      SELECT
        COUNT(DISTINCT session_id) as unique_sessions,
        COUNT(*) as total_events
      FROM analytics_events
      WHERE created_at >= NOW() - INTERVAL '24 hours'
    `;

    const [summary, totals, sessions] = await Promise.all([
      pool.query(summaryQuery),
      pool.query(totalQuery),
      pool.query(sessionsQuery)
    ]);

    return {
      hourlyBreakdown: summary.rows,
      eventTypeTotals: totals.rows,
      sessionStats: sessions.rows[0]
    };
  } catch (error) {
    console.error('Error getting summary:', error);
    throw error;
  }
}

export { pool };