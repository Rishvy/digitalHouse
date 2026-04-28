const express = require('express');
const path = require('path');

const app = express();

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`Mock API running on http://localhost:${PORT}`);
});