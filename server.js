import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initDatabase, insertEvent, getEvents, getEventsSummary } from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
initDatabase();

app.use(express.static('public'));
app.use('/node_modules', express.static('node_modules'));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

app.get('/article/:id', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'article.html'));
});

app.get('/category/:slug', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

// Analytics collection endpoint
app.post('/analytics', async (req, res) => {
  try {
    const body = req.body;

    // Support both Segment batch format { batch: [...] } and simple { type, properties }
    let events = [];
    if (body.batch && Array.isArray(body.batch)) {
      // Exacaster SDK sends Segment-compatible batch format
      events = body.batch.map(e => ({
        type: e.event || e.type || e.name || 'Unknown',
        properties: { ...e.properties, ...e.context, anonymousId: e.anonymousId }
      }));
    } else if (Array.isArray(body)) {
      events = body;
    } else {
      events = [body];
    }

    for (const event of events) {
      const { type, properties = {} } = event;
      const sessionId = properties.sessionId || req.headers['x-session-id'];
      const userAgent = req.headers['user-agent'];
      const pageUrl = req.headers.referer || properties.url;

      await insertEvent(type, sessionId, userAgent, pageUrl, properties);

      console.log('Analytics Event:', { type, sessionId, properties, timestamp: new Date().toISOString() });
    }

    res.status(200).json({
      success: true,
      eventsProcessed: events.length
    });
  } catch (error) {
    console.error('Analytics endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Analytics dashboard endpoint
app.get('/analytics', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'analytics-dashboard.html'));
});

// API endpoint to get analytics data
app.get('/api/analytics', async (req, res) => {
  try {
    const { type, session, limit = 100, startDate, endDate } = req.query;

    const filters = {
      eventType: type,
      sessionId: session,
      limit: parseInt(limit),
      startDate,
      endDate
    };

    const events = await getEvents(filters);
    res.json({ success: true, events });
  } catch (error) {
    console.error('Analytics API error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// API endpoint to get analytics summary
app.get('/api/analytics/summary', async (req, res) => {
  try {
    const summary = await getEventsSummary();
    res.json({ success: true, ...summary });
  } catch (error) {
    console.error('Analytics summary error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test endpoint to verify database connection
app.get('/api/test', async (req, res) => {
  try {
    const { pool } = await import('./database.js');
    const result = await pool.query('SELECT NOW() as current_time, COUNT(*) as event_count FROM analytics_events');
    res.json({
      success: true,
      database_time: result.rows[0].current_time,
      total_events: result.rows[0].event_count,
      message: 'Database connection working!'
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Database connection failed'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Analytics dashboard: http://localhost:${PORT}/analytics`);
});