const express = require('express');
const { PrismaClient, Prisma } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/simulacao/entrar - Simular a entrada do cliente
router.post('/simulacao/entrar', async (req, res) => {
    const { clienteId } = req.body;
    try {
        const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
        if (!cliente) {
            return res.status(404).json({ error: 'Cliente não encontrado.' });
        }
        res.json({ status: 'sucesso', mensagem: `Cliente ${cliente.nome} entrou na loja.` });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao processar a entrada do cliente.' });
    }
});

// POST /api/simulacao/sair - Finalizar a compra
router.post('/simulacao/sair', async (req, res) => {
    const { clienteId } = req.body;

    try {
        // Usamos uma transação para garantir que todas as operações funcionem ou nenhuma delas
        const compraRealizada = await prisma.$transaction(async (tx) => {
            // 1. Encontrar todos os itens do carrinho do cliente
            const itensCarrinho = await tx.carrinhoItem.findMany({
                where: { clienteId: clienteId },
                include: { produto: true },
            });

            if (itensCarrinho.length === 0) {
                throw new Error('O carrinho está vazio. Nenhuma compra foi realizada.');
            }

            // 2. Calcular o valor total e criar o JSON de itens
            let valorTotal = new Prisma.Decimal(0);
            const itensComprados = itensCarrinho.map(item => {
                const subtotal = item.produto.preco.times(item.quantidade);
                valorTotal = valorTotal.plus(subtotal);
                return {
                    id: item.produto.id,
                    nome: item.produto.nome,
                    preco: item.produto.preco,
                    quantidade: item.quantidade,
                };
            });

            // 3. Criar o registro da compra
            const novaCompra = await tx.compra.create({
                data: {
                    clienteId: clienteId,
                    valorTotal: valorTotal,
                    itensComprados: itensComprados, // Prisma lida com a conversão para JSON
                },
            });

            // 4. Limpar o carrinho do cliente
            await tx.carrinhoItem.deleteMany({
                where: { clienteId: clienteId },
            });

            return novaCompra;
        });

        res.status(201).json(compraRealizada);

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;