# ATLAS VIVO · Craft Studio

Aplicativo mobile-first de estudo visual com o Craft como repositório editorial. **Edite suas notas no Craft, sem tocar em código.** Altere a interface e os recursos do aplicativo aqui no GitHub.

## Funcionalidades

- Biblioteca de documentos e pesquisa por título.
- Leitor de notas com textos e imagens, mapa por tópicos.
- Atalho para edição nativa dos documentos no Craft.
- Estúdio para criação de novas notas via API.
- Identidade ColorHub × Universo e modo claro/escuro.
- API privada `api/craft.js` autenticada por cookie HttpOnly.

## Segurança

**Nunca publique credenciais.** Configure `CRAFT_API_URL` e `APP_ACCESS_KEY` em Vercel → Project Settings → Environment Variables, com criptografia. A URL de conexão ao Craft não deve estar neste repositório público. O acesso ao backend requer sessão privada.

## Arquitetura

`Craft → Vercel Function (/api/craft) → Atlas Vivo (index.html)`

Mudanças no texto feitas no Craft podem ser recuperadas pelo botão **Atualizar**, sem novo deploy. Mudanças no código feitas no GitHub são publicadas automaticamente somente **após associar o repositório ao projeto Vercel**.

## Desenvolvimento

Node.js 20+. Frontend estático, sem build. Use `vercel dev` localmente após configurar as credenciais em ambiente privado. Exemplo de variáveis em `.env.example`, sem valores reais.

## Limitações

Imagens e elementos complexos do Craft podem não ter apresentação integral no leitor; o original continua acessível no Craft. Não há autenticação multiusuário nem sincronização de progresso entre dispositivos nesta versão.

Site publicado inicialmente: https://atlas-vivo-craft-studio.vercel.app
