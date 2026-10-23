# ATLAS VIVO — Administração pelo Craft

Toda personalização do aplicativo é feita nesta [Central de Controle do Craft](https://docs.craft.do/editor/d/c3b34bfd-9b77-6809-f4d0-a206276df43a/3dac343a-bb21-81b7-db40-70de6fd8a51f).

## Acesso

Edite o valor do bloco **Código de acesso:** no Craft. A senha nunca é enviada ao frontend por endpoints de configurações e não deve ser incluída neste repositório GitHub. O aplicativo verifica o código diretamente no servidor. Após a alteração, novas entradas usam o valor atual e as sessões anteriores com o código antigo perdem validade.

## Biblioteca

O bloco **Modo da biblioteca:** aceita `selecionadas` ou `todas`. No modo selecionadas, mantenha um bloco nativo do Craft por documento:

`Exibir: Título exato do documento`

Reordene os blocos no Craft para alterar a ordem do aplicativo. Para ocultar uma nota, remova seu bloco **Exibir:** (não apaga a nota original). Você também pode informar um rootBlockId em vez do título. A API do aplicativo filtra a lista antes de enviá-la ao navegador.

## Aparência e permissões

- **Página inicial:** biblioteca / painel
- **Visualização padrão:** imersivo / lousas / mapa / leitura
- **Tema padrão:** escuro / claro
- **Densidade editorial:** compacta / equilibrada / ampla
- **Atualizar ao abrir:** sim / não
- **Permitir edição no ATLAS:** sim / não
- **Permitir criar notas:** sim / não

A nota controla as opções sem precisar gerar nova build. Componentes científicos são editados no Craft; o Canvas edita a composição visual e grava seu layout num documento separado do Craft.

## Arquitetura

1. **Craft** guarda o conteúdo médico, as imagens, a central administrativa e os layouts.
2. **Vercel** hospeda o servidor que lê a central administrativa e verifica o acesso.
3. **GitHub** mantém o código. A senha e o link privado de conexão não fazem parte dele.

O servidor recebe exclusivamente o ID da Central de Controle via variável privada `ATLAS_CONTROL_ROOT_ID`. Nunca exponha o link API Connection ou credenciais no código-fonte.

Para recuperação emergencial se a Central não estiver acessível, o mantenedor ainda dispõe da variável privada `APP_ACCESS_KEY` na Vercel, sem publicá-la no Craft ou no GitHub. Esse fallback vale apenas quando a configuração não pode ser carregada, não como segunda senha simultânea.
