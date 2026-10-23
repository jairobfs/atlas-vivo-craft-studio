# ATLAS VIVO · Craft Studio

Aplicativo de estudo médico visual, mobile-first. **O ATLAS é o ambiente de trabalho e administração; o Craft é a base sincronizada, não uma etapa obrigatória de edição.**

## Edição em dois sentidos

- **ATLAS → Craft:** criar notas, editar blocos, inserir imagens, construir pranchas e salvar preferências.
- **Craft → ATLAS:** conteúdo, biblioteca selecionada, aparência e preferências voltam ao aplicativo ao sincronizar ou reabrir.
- **Entre dispositivos:** a fonte compartilhada é o Craft; nada essencial depende do armazenamento local do telefone.

## Meu ATLAS · Administração dentro do aplicativo

O proprietário tem um painel com quatro áreas: **Biblioteca**, **Aparência**, **Acesso** e **Nova nota**.

É possível selecionar/ocultar documentos sem apagá-los, alterar a ordem, redefinir o código de acesso, ajustar a duração da sessão, a identidade e os modos visuais, controlar permissões de edição e criar notas. **Salvar alterações** escreve os campos correspondentes na Central de Controle nativa do Craft. O Craft continua sendo uma opção de edição manual, mas não é necessário abri-lo para essas tarefas.

O servidor recusa gravações com versões antigas da Central. A atualização do código invalida sessões antigas e preserva o login do navegador que fez a alteração. As credenciais nunca são expostas nos endpoints públicos de configuração.

## Recursos científicos e editoriais

Leitura imersiva, galerias com imagens originais, mapas, fluxos, comparações, revisões interativas, apresentação 16:9, Canvas livre e criação de componentes. O Estúdio permite edição textual e upload de PNG, JPEG, WEBP e SVG nativos para documentos reais. O arquivo é transmitido à API do Craft, preservando sua transparência quando aplicável.

## Infraestrutura

`Aplicativo ATLAS ↔ API privada na Vercel ↔ Documentos e Central do Craft`

`GitHub → Vercel` para publicar melhorias no motor do aplicativo; **não** é necessário novo deploy para alterar as preferências ou o conteúdo no Craft.

- Código do backend: `api/craft.js`
- Validação e gravação administrativa: `api/atlas-admin.js` e `api/atlas-control.js`
- Painel web: `admin-panel.js` e `admin-panel.css`
- Visualização e estudo: `visual-app.js` e módulos de atlas.

## Segurança e limites

**Nunca envie senhas, URLs privadas do Craft nem tokens ao GitHub.** `CRAFT_API_URL`, `APP_ACCESS_KEY`, `ATLAS_CONTROL_ROOT_ID` e `ATLAS_LAYOUT_ROOT_ID` permanecem em variáveis privadas da Vercel. O login utiliza cookie HttpOnly e autorização no servidor.

O aplicativo não implementa integralmente todos os recursos avançados do editor Craft (whiteboards complexos e alguns tipos de mídia ainda podem exigir o original). A sincronização entre dispositivos ocorre por novas leituras do Craft, não por push instantâneo permanente. O projeto é pessoal, sem papéis multiusuário.

Testes: `npm test` (Node.js 20+). A validação inclui escrita, atualização e reordenação de campos nativos do Craft, verificação de conflito e renovação da sessão após mudança de acesso.

**Endereço oficial:** https://atlas-vivo-craft-git.vercel.app
