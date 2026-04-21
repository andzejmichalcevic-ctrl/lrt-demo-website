import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.use('/node_modules', express.static('node_modules'));

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

app.get('/article/:id', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'article.html'));
});

// Add analytics endpoint to capture data
app.use(express.json());

app.post('/', (req, res) => {
  console.log('Analytics Event:', JSON.stringify(req.body, null, 2));
  res.status(200).json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});