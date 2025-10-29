# MUNDO PET — Agenda de Agendamentos

Aplicação web simples para gerenciamento de agendamentos de um pet shop. Permite visualizar a agenda do dia, selecionar outras datas e criar novos agendamentos com informações do tutor, pet, telefone, descrição do serviço, data e hora — tudo em HTML, CSS e JavaScript puro.

## Visão geral

- Visualize a agenda do dia com períodos listados na tela
- Seletor de data acessível (date picker) no topo
- Criação de novo agendamento via modal
- Campos do formulário: tutor, pet, telefone, serviço, data e hora
- Foco em acessibilidade (uso de `aria-*`, `role="dialog"`, labels, etc.)
- Layout responsivo com a fonte Inter
- Sem dependências de build ou frameworks

## Tecnologias

- HTML5
- CSS3 (`style.css` e `icons.css`)
- JavaScript Vanilla (`script.js`)
- Google Fonts (Inter)

## Estrutura do projeto

```text
agendamento-pet/
├─ index.html     # Estrutura da aplicação e modais
├─ style.css      # Estilos principais da interface
├─ icons.css      # Ícones via CSS (classes .icon)
└─ script.js      # Lógica de agenda, date/time pickers e formulário
```


## Como usar

1. Use o seletor de data no topo para mudar o dia da agenda.
2. Clique em “NOVO AGENDAMENTO”.
3. Preencha os campos:
   - Nome do tutor
   - Nome do pet
   - Telefone
   - Descrição do serviço
   - Data e Hora (use os seletores no modal)
4. Clique em “Agendar” para salvar o atendimento.
5. Os itens agendados são exibidos por período na página principal.

Observações:
- Campos obrigatórios possuem validação básica e mensagens de erro contextuais.
- O modal de agendamento utiliza papéis e atributos ARIA para melhor acessibilidade.
