# Planilha do convite do Noah

A URL da implantação existente está configurada em `data/settings.json` e em `js/config.js`. O código atualizado está em `google-apps-script.js`.

## Como os registros são guardados

- O navegador guarda uma fila antes de enviar a resposta. Itens sem confirmação permanecem na fila e são reenviados quando a conexão volta ou o convite é reaberto nesse aparelho.
- Com o servidor Node ativo, a resposta é gravada em disco antes da confirmação ao convidado. O servidor tenta entregar os registros à planilha em segundo plano e retoma os pendentes após reiniciar.
- Em hospedagem estática, o navegador envia diretamente à implantação do Google e confere o ID e a revisão retornados antes de tirar o item da fila.
- A planilha atualiza o registro identificado pelo ID ou pelo telefone. Uma nova tentativa com os mesmos dados preserva a linha, e revisões antigas não sobrescrevem as mais recentes.
- O Apps Script aguarda o bloqueio de escrita, aplica as alterações e lê os campos de identificação antes de responder com sucesso.

As abas são **Confirmações**, **Caçadores de aliens** e **Teste de conexão**. Quando a planilha já possui a tabela antiga com o cabeçalho “Nome do Convidado”, essa aba é reaproveitada. As oito primeiras colunas são preservadas e os campos de identificação são acrescentados à direita.

## Conferir o funcionamento

1. Inicie o servidor com `npm start`.
2. Abra o Painel dos Pais e a aba **Integração Planilha**.
3. Confira quantos registros estão confirmados e quantos aguardam envio.
4. Use **Testar Envio na Planilha Agora** para confirmar gravação e leitura em uma linha técnica na aba de testes.
5. Use **Enviar Todas as Confirmações Salvas** para antecipar uma nova tentativa dos registros pendentes.

O teste de conexão reutiliza a mesma linha. Os testes de desenvolvimento usam uma pasta temporária e dados fictícios.

## Atualizar a implantação

Após editar `google-apps-script.js`, copie o conteúdo para o projeto vinculado à planilha. Salve e abra **Implantar → Gerenciar implantações → Editar → Nova versão**. Atualize a implantação existente para manter a URL `/exec`.

Quando trocar a URL, salve-a no Painel dos Pais para o servidor e atualize `js/config.js` na publicação estática.

## Conquistas da caça

A missão tem cinco aliens com esconderijos sorteados por aparelho e aparições de 3,5 segundos em ciclos de 17 segundos. O progresso fica guardado no navegador. O aviso surge após a entrada no convite.

Ao concluir, o convidado informa o nome e recebe um distintivo com código. O registro vai para a aba **Caçadores de aliens**. A imagem pode ser baixada ou compartilhada e apresentada na festa. Em caso de falta de conexão, a conquista fica pendente e recebe o código quando for registrada.

Os aliens decorativos também reproduzem a voz enviada. Os cinco botões escondidos são os que contam para a missão.

## Recuperação e limites operacionais

O servidor precisa de armazenamento persistente para manter a fila e as cópias em `data/` entre reinicializações da hospedagem. A confirmação de gravação na planilha depende de internet e da disponibilidade do Google.

Em hospedagem estática, um envio ainda pendente depende de reabrir o convite no mesmo navegador. Apagar os dados desse navegador remove cópias que ainda não foram entregues. A tela informa quando o envio permanece pendente.

A rotina de bloqueio e confirmação segue a documentação oficial do Google para [Lock](https://developers.google.com/apps-script/reference/lock/lock) e [Content Service](https://developers.google.com/apps-script/guides/content).
