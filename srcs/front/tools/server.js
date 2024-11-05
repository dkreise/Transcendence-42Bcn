const express = require('express');
const app = express();
const PORT = 2424;

// Serve static files from the /app directory
app.use(express.static('/app'));

// Log server start
app.listen(PORT, () => {
  console.log(`JavaScript server running at http://localhost:${PORT}`);
});