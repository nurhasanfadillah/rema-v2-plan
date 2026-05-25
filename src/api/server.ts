import app from './index.ts';

const PORT = parseInt(process.env.API_PORT || '3001', 10);

app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
});
