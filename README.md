Guia Rápido de Instalação Completa

Para rodar o projeto completo, você precisará de dois terminais abertos: um para o back-end e um para o front-end.

**1. Clone o Repositório**
```bash
git clone <URL_DO_SEU_REPOSITORIO>
cd roupremium
```

**2. Configure e Rode o Back-end**
* Navegue até a pasta do back-end e instale as dependências:
  ```bash
  cd roupremium-backend
  npm install
  ```
* Crie e configure seu arquivo `.env` com as chaves de API.
* Inicie o servidor (este terminal permanecerá em execução):
  ```bash
  npm run dev
  ```

**3. Configure e Rode o Front-end**
* Em um **novo terminal**, navegue até a pasta do front-end:
  ```bash
  cd roupremium-frontend
  npm install
  ```
* Inicie a aplicação de front-end:
  ```bash
  npm run dev
  ```

Após esses passos, a aplicação web estará rodando e conectada ao seu servidor local.
