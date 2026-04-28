const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function paginateArrayWithFilter(array, size = 30, index = 0, keyword = '') {
  const startIndex = index * size;
  const endIndex = startIndex + size;
  let filteredArray = array;
  if (keyword && keyword !== '') {
    const lowerCaseKeyword = keyword.toLowerCase();
    filteredArray = array.filter((item) =>
      JSON.stringify(item).toLowerCase().includes(lowerCaseKeyword)
    );
  }
  return filteredArray.slice(startIndex, endIndex);
}

const jsonDir = path.join(__dirname, 'json');

app.get('/api/fonts', async (req, res) => {
  const jsonPath = path.join(jsonDir, 'fonts.json');
  try {
    const jsonString = await require('fs').promises.readFile(jsonPath, 'utf8');
    const { ps = 30, pi = 0, kw = '' } = req.query;
    const filtered = paginateArrayWithFilter(JSON.parse(jsonString).data, +ps, +pi, kw);
    res.send({ data: filtered });
  } catch (err) {
    res.status(500).send({ error: 'Failed to load fonts' });
  }
});

app.get('/api/search-templates', async (req, res) => {
  const jsonPath = path.join(jsonDir, 'templates.json');
  try {
    const jsonString = await require('fs').promises.readFile(jsonPath, 'utf8');
    const { ps = 30, pi = 0, kw = '' } = req.query;
    const filtered = paginateArrayWithFilter(JSON.parse(jsonString).data, +ps, +pi, kw);
    res.send({ data: filtered });
  } catch (err) {
    res.status(500).send({ error: 'Failed to load templates' });
  }
});

app.get('/api/search-texts', async (req, res) => {
  const jsonPath = path.join(jsonDir, 'texts.json');
  try {
    const jsonString = await require('fs').promises.readFile(jsonPath, 'utf8');
    const { ps = 30, pi = 0, kw = '' } = req.query;
    const filtered = paginateArrayWithFilter(JSON.parse(jsonString).data, +ps, +pi, kw);
    res.send({ data: filtered });
  } catch (err) {
    res.status(500).send({ error: 'Failed to load texts' });
  }
});

app.get('/api/search-frames', async (req, res) => {
  const jsonPath = path.join(jsonDir, 'frames.json');
  try {
    const jsonString = await require('fs').promises.readFile(jsonPath, 'utf8');
    const { ps = 30, pi = 0, kw = '' } = req.query;
    const filtered = paginateArrayWithFilter(JSON.parse(jsonString).data, +ps, +pi, kw);
    res.send({ data: filtered });
  } catch (err) {
    res.status(500).send({ error: 'Failed to load frames' });
  }
});

app.get('/api/search-shapes', async (req, res) => {
  const jsonPath = path.join(jsonDir, 'shapes.json');
  try {
    const jsonString = await require('fs').promises.readFile(jsonPath, 'utf8');
    const { ps = 30, pi = 0, kw = '' } = req.query;
    const filtered = paginateArrayWithFilter(JSON.parse(jsonString).data, +ps, +pi, kw);
    res.send({ data: filtered });
  } catch (err) {
    res.status(500).send({ error: 'Failed to load shapes' });
  }
});

app.get('/api/search-images', async (req, res) => {
  const jsonPath = path.join(jsonDir, 'images.json');
  try {
    const jsonString = await require('fs').promises.readFile(jsonPath, 'utf8');
    const { ps = 30, pi = 0, kw = '' } = req.query;
    const filtered = paginateArrayWithFilter(JSON.parse(jsonString).data, +ps, +pi, kw);
    res.send({ data: filtered });
  } catch (err) {
    res.status(500).send({ error: 'Failed to load images' });
  }
});

app.get('/api/search-fonts', async (req, res) => {
  const jsonPath = path.join(jsonDir, 'fonts.json');
  try {
    const jsonString = await require('fs').promises.readFile(jsonPath, 'utf8');
    const { ps = 30, pi = 0, kw = '' } = req.query;
    const filtered = paginateArrayWithFilter(JSON.parse(jsonString).data, +ps, +pi, kw);
    res.send({ data: filtered });
  } catch (err) {
    res.status(500).send({ error: 'Failed to load fonts' });
  }
});

app.get('/api/user-images', (req, res) => {
  res.send({ data: [] });
});

app.post('/api/upload-image', (req, res) => {
  res.send({ data: { url: '', id: Date.now() } });
});

app.delete('/api/remove-image', (req, res) => {
  res.send({ success: true });
});

app.get('/api/template-suggestion', (req, res) => {
  res.send([]);
});

app.get('/api/text-suggestion', (req, res) => {
  res.send([]);
});

app.get('/api/image-suggestion', (req, res) => {
  res.send([]);
});

app.get('/api/shape-suggestion', (req, res) => {
  res.send([]);
});

app.get('/api/frame-suggestion', (req, res) => {
  res.send([]);
});

app.get('/api/draft-fonts', async (req, res) => {
  const jsonPath = path.join(jsonDir, 'draft-fonts.json');
  try {
    const jsonString = await require('fs').promises.readFile(jsonPath, 'utf8');
    res.send(JSON.parse(jsonString));
  } catch (err) {
    res.status(500).send({ error: 'Failed to load draft fonts' });
  }
});

app.get('/api/health', (req, res) => {
  res.send({ status: 'ok' });
});

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`Mock API running on http://localhost:${PORT}`);
});