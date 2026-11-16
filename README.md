# DS KOMBAT

Protótipo de luta 2D para navegador, feito com HTML, CSS e JavaScript Canvas. Tem sete personagens, jogo local para duas pessoas e modo contra CPU.

## Abrir o jogo

1. Abra o terminal na pasta do jogo.
2. Execute `python3 -m http.server 8000`.
3. Acesse `http://localhost:8000` no navegador.

Também é possível abrir `index.html` diretamente. O servidor local costuma evitar bloqueios do navegador ao carregar imagens.

## Controles

| Ação | Jogador 1 | Jogador 2 |
|---|---|---|
| Mover, pular, agachar | A, D, W, S | Setas |
| Soco, chute, defesa | F, G, H | J, K, L |
| Especial 1 e 2 | R, T | U, I |
| Ultimate | Y | O |
| Pausar | Esc | Esc |

No controle Xbox, A é soco, B é chute, LB é Especial 1, RB é Especial 2, LT é ultimate e RT é bloqueio. O direcional ou analógico esquerdo move o lutador.

## Onde mexer

- Regras dos golpes: `src/combat.js`. Movimento e tempo da luta: `src/simulation.js`.
- Controles, menus e tela de luta: `src/input.js`, `src/menu.js` e `src/render.js`.
- Aparência da página: `style.css` e `index.html`.
- Dados dos lutadores e golpes: `data/`.
- Desenho das poses: `revision-render.js`.
- Efeitos animados dos poderes: `power-fx.js`.
- Artes do jogo: `assets/`.
- Ferramentas e relatórios: `tools/` e `docs/`.

Veja [o mapa do projeto](docs/estrutura-do-projeto.md) para os passos de edição no VS Code.

## Sprites e estado atual

As fichas originais estão em `assets/reference/`; as artes preparadas ficam em `assets/fighters/`. Spritesheets foram montadas a partir das poses disponíveis. Algumas ações ainda usam quadros aproximados e precisam de revisão artística. O arquivo [relatório das animações](docs/status-animacoes.md) registra a cobertura e as limitações.

A prévia independente dos efeitos é `poderes-preview.html`; a prévia de personagens é `sprites-revisao.html`.
