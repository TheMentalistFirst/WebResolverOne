import express from 'express';
import handler from './api/run.js'; 
import dotenv from 'dotenv';
dotenv.config();

const app = express();

app.get('/resolver', handler);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT} http://localhost:3000/resolver`);
});
