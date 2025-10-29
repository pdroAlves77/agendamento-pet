<div align="center">

# 🐾 MUNDO PET — Agenda de Agendamentos

Aplicação web em HTML/CSS/JS para agenda de pet shop: visualize a agenda do dia, escolha a data e crie novos agendamentos com tutor, pet, telefone, serviço, data e hora.

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](#tecnologias)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](#tecnologias)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=222)](#tecnologias)
[![Acessibilidade](https://img.shields.io/badge/A11y-Friendly-3B82F6?logo=w3c&logoColor=white)](#acessibilidade)
[![Status](https://img.shields.io/badge/Build-None_(Vanilla)-10B981)](#vis%C3%A3o-geral)

</div>

---

## ✨ Visão geral

- Visualize a agenda do dia com períodos listados na tela
- Seletor de data acessível (date picker) no topo
- Criação de novo agendamento via modal
- Campos do formulário: tutor, pet, telefone, serviço, data e hora
- Foco em acessibilidade (uso de `aria-*`, `role="dialog"`, labels, etc.)
- Layout responsivo com a fonte Inter
- Sem dependências de build ou frameworks

> Composição do código: JavaScript 46.2% • CSS 38.6% • HTML 15.2%

---

## 🛠 Tecnologias

- HTML5
- CSS3 (`style.css` e `icons.css`)
- JavaScript Vanilla (`script.js`)
- Google Fonts (Inter)

---

## 📁 Estrutura do projeto

```text
agendamento-pet/
├─ index.html     # Estrutura da aplicação e modais
├─ style.css      # Estilos principais da interface
├─ icons.css      # Ícones via CSS (classes .icon)
└─ script.js      # Lógica de agenda, date/time pickers e formulário
```

Sugestão: adicione capturas de tela em `docs/` e referencie-as neste README:
```md
![Tela principal](docs/screenshot-01.png)
![Modal de agendamento](docs/screenshot-02.png)
```

---

## 📚 Como usar

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

---

## ♿ Acessibilidade

- Elementos com `role="dialog"` e controle de foco ao abrir o modal
- Labels associados a inputs e uso de `aria-*` quando necessário
- Contraste e hierarquia tipográfica pensados para leitura
- Navegação por teclado respeitada nos campos do formulário

---

## 🌐 Minhas redes sociais

<div align="center" style="display: flex; gap: 20px;">

  <a href="https://github.com/pdroAlves77" target="_blank">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg" alt="GitHub" width="50" title="GitHub"/>
  </a>

  <a href="https://www.linkedin.com/in/pdroalves77/" target="_blank">
    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linkedin/linkedin-original.svg" alt="LinkedIn" width="50" title="LinkedIn"/>
  </a>

</div>

---
