const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rota de teste
app.get('/', (req, res) => {
  res.send('Funcionando!');
});

// Importando as rotas
const clienteRoutes = require('./routes/cliente');
const produtoRoutes = require('./routes/produto');
const carrinhoRoutes = require('./routes/carrinho'); // Sugestão de nome
const simulacaoRoutes = require('./routes/simulacao'); // Sugestão de nome

// Registrando as rotas
// A API inteira responderá sob o prefixo /api
app.use('/api', clienteRoutes);
app.use('/api', produtoRoutes);
app.use('/api', carrinhoRoutes);
app.use('/api', simulacaoRoutes);


app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});