const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando o seeding...');

  // Criar Clientes de teste
  const cliente1 = await prisma.cliente.create({
    data: {
      nome: 'Moisés',
      metodoPagamento: 'credito_final_4242',
    },
  });

  const cliente2 = await prisma.cliente.create({
    data: {
      nome: 'Gabrielle',
      metodoPagamento: 'credito_final_5151',
    },
  });

    const cliente3 = await prisma.cliente.create({
    data: {
      nome: 'Liliana',
      metodoPagamento: 'credito_final_8987',
    },
  });

      const cliente4 = await prisma.cliente.create({
    data: {
      nome: 'Luis',
      metodoPagamento: 'credito_final_3654',
    },
  });

      const cliente5 = await prisma.cliente.create({
    data: {
      nome: 'Pedro',
      metodoPagamento: 'credito_final_7435',
    },
  });

  // Criar Produtos de teste
  await prisma.produto.createMany({
    data: [
      { nome: 'Camisa de Seda', preco: 799.90 },
      { nome: 'Calça Jeans', preco: 499.90 },
      { nome: 'Bermuda Cargo', preco: 350.00 },
      { nome: 'Camisa Polo', preco: 299.50 },
      { nome: 'Jaqueta de Couro', preco: 1250.00 },
    ],
  });

  console.log('Seeding finalizado com sucesso!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });