# 📋 Como Conectar o Convite do Noah com a sua Planilha Google

Este guia passo a passo ensina como conectar o formulário de confirmação do convite à sua própria planilha do Google em menos de 2 minutos, sem custos e sem precisar de servidor.

---

### Passo 1: Criar a Planilha no Google Drive

1. Acesse o seu Google Drive ou digite no navegador: [sheets.new](https://sheets.new)
2. Dê um nome para a planilha, por exemplo: **`Confirmações - Noah 1 Ano`**
3. Não precisa digitar nada nas células; o nosso script criará os cabeçalhos coloridos e organizados automaticamente na primeira resposta!

---

### Passo 2: Colar o Código do Apps Script

1. No menu superior da planilha, clique em:  
   **Extensões** > **Apps Script**
2. Na tela que abrir, apague o código padrão que estiver lá (`function myFunction() { ... }`).
3. Abra o arquivo [`google-apps-script.js`](./google-apps-script.js) deste projeto, copie todo o conteúdo e cole no editor do Apps Script.
4. Clique no ícone de salvar (💾) ou pressione `Ctrl + S`.

---

### Passo 3: Publicar como App da Web (Implantar)

1. No canto superior direito da tela do Apps Script, clique no botão azul:  
   **Implantar** (ou *Deploy*) > **Nova implantação** (*New deployment*).
2. Na janela que abrir, clique no ícone de engrenagem ⚙️ (ao lado de *Selecione o tipo*) e escolha **App da Web** (*Web App*).
3. Preencha os campos exatamente assim:
   - **Descrição:** `API Convite Noah`
   - **Executar como:** `Eu (seu email)`
   - **Quem pode acessar:** `Qualquer pessoa` *(MUITO IMPORTANTE: escolha "Qualquer pessoa" para que os convidados consigam confirmar sem precisar fazer login no Google!)*
4. Clique em **Implantar**.
5. Se o Google solicitar permissões de segurança:
   - Clique em **Autorizar acesso**
   - Escolha sua conta Google
   - Se aparecer "O Google não verificou este app", clique em **Avançado** (na parte inferior esquerda) e depois em **Acessar [Nome do Projeto] (não seguro)**
   - Clique em **Permitir**.
6. Copie a **URL do app da Web** gerada (ela termina com `/exec`).

---

### Passo 4: Conectar ao Convite

Existem duas formas fáceis de colar a URL:

#### Opção A (Direto no arquivo de configuração):
Abra o arquivo [`js/config.js`](./js/config.js) e cole a URL na variável `googleScriptUrl`:
```javascript
googleScriptUrl: "https://script.google.com/macros/s/SEU_ID_DO_SCRIPT/exec",
```

#### Opção B (Pelo próprio convite na tela):
1. Abra o site do convite (`index.html`) no seu navegador.
2. No rodapé ou no botão de engrenagem ⚙️ "Configurações do Anfitrião", cole o link da planilha e clique em "Salvar Link".
3. Pronto! Ele salva no seu navegador e você pode testar imediatamente.

---

### 🚀 Dados que serão gravados na planilha automaticamente:
- **Data/Hora do Envio**
- **Nome do Convidado**
- **Status de Presença** *(Verde para Confirmado, Vermelho para Não Comparecerá)*
- **Quantidade de Adultos**
- **Quantidade de Crianças**
- **Nomes dos Acompanhantes**
- **WhatsApp / Telefone de Contato**
- **Recado carinhoso para o Noah**

---

### 💡 Backup Automático no Navegador
Mesmo se você ainda não tiver configurado o Google Sheets ou se a internet do convidado oscilar, o site possui um sistema inteligente de backup local (`localStorage`) e permite exportar a lista completa de confirmações em **Excel / CSV** a qualquer momento com apenas 1 clique!
