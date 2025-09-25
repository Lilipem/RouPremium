const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/carrinho/adicionar - Adicionar um item ao carrinho
router.post('/carrinho/adicionar', async (req, res) => {
    const { clienteId, produtoId } = req.body;

    try {
        // Verifica se o item já existe no carrinho para esse cliente
        const itemExistente = await prisma.carrinhoItem.findUnique({
            where: {
                clienteId_produtoId: {
                    clienteId: clienteId,
                    produtoId: produtoId,
                },
            },
        });

        let itemAtualizado;
        if (itemExistente) {
            // Se existe, incrementa a quantidade
            itemAtualizado = await prisma.carrinhoItem.update({
                where: {
                    clienteId_produtoId: {
                        clienteId: clienteId,
                        produtoId: produtoId,
                    },
                },
                data: {
                    quantidade: itemExistente.quantidade + 1,
                },
            });
        } else {
            // Se não existe, cria o item com quantidade 1
            itemAtualizado = await prisma.carrinhoItem.create({
                data: {
                    clienteId: clienteId,
                    produtoId: produtoId,
                    quantidade: 1,
                },
            });
        }
        res.status(201).json(itemAtualizado);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao adicionar item ao carrinho.' });
    }
});

// GET /api/carrinho/:clienteId - Consultar o carrinho de um cliente
router.get('/carrinho/:clienteId', async (req, res) => {
    const { clienteId } = req.params;

    try {
        const carrinho = await prisma.carrinhoItem.findMany({
            where: {
                clienteId: parseInt(clienteId),
            },
            // Inclui os dados do produto junto com o item do carrinho
            include: {
                produto: true,
            },
        });
        res.json(carrinho);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar o carrinho.' });
    }
});

module.exports = router;