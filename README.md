# 我的旅行 · Minha viagem à China

De Curitiba à China, com uma escala em Istambul no meio do caminho.

Vinte e três dias, quinze paradas no total, sete cidades chinesas. Duas voltas por Guangzhou, passeios em Hong Kong, Shenzhen, Beijing e um reencontro com a família em Yangzhou que é o motivo de tudo isso existir. Este repositório guarda o roteiro inteiro e o site nasceu pra contar essa história.

**[→ ver o site no ar](https://zhujaxuen.github.io/luxing/)**

---

## O roteiro

| | Cidade | Quando | O que rolou por lá |
|---|---|---|---|
| ✈️ | Curitiba | 09 out | Partida |
| ✈️ | São Paulo | 09–10 out | Conexão |
| ✈️ | Istambul | 10–11 out | Conexão |
| 🛬 | Guangzhou | 12 out | Chegada à China |
| 🚇 | Shenzhen | 12–15 out | Compras |
| 🚇 | Hong Kong | 14 out | Kowloon Bay |
| 🚇 | Guangzhou | 15–17 out | Canton Fair |
| ✈️ | Beijing | 17–21 out | Muralha da China |
| 🚆 | Nanjing | 21–24 out | Muralha Ming |
| 🚆 | Yangzhou | 24–27 out | Família ❤️ |
| 🚆 | Shanghai | 27–30 out | The Bund |
| ✈️ | Guangzhou → Istambul → São Paulo → Curitiba | 30 out – 01 nov | Volta pra casa |

Duas passagens por Guangzhou não são coincidência nem erro de planejamento, é o hub entre a parte "turista" da viagem (Shenzhen, Hong Kong) e a parte "roteiro principal" (Beijing pra cima). Todo o trajeto por dentro da China mistura avião, trem-bala e metrô; lá fora, é avião do início ao fim.

## Sobre o site

Um globo 3D que gira de verdade, com textura de satélite da Terra, mas é uma ilustração, não um mapa real. Cada parada é um ponto no mapa; cada trajeto é um arco que a câmera acompanha quando você clica na cidade de origem, com um ícone (avião, trem ou metrô) percorrendo o caminho de verdade.

Ele sabe também em que momento a viagem está: antes de outubro, mostra a contagem regressiva; durante, destaca automaticamente em qual cidade a gente está agora — marcador maior, cor diferente, pulso duplo; depois, vira um registro do que foi. Dá pra ler tudo em português, inglês ou mandarim, e o link já carrega no idioma escolhido.

Não tem build, não tem framework, não tem backend. Três arquivos e um navegador.

---

<details>
<summary><strong>Detalhes técnicos</strong> (pra quem for mexer no código)</summary>

### Stack

Three.js puro, carregado via CDN. Sem Node, sem npm, sem etapa de build — é abrir o `index.html` (com um servidor local, ver abaixo) e pronto.

### Estrutura

```
├── index.html            estrutura da página
├── style.css             visual — cores, tipografia, painel lateral
├── data.js               os dados da viagem: paradas e trajetos
├── translations.js       textos em inglês e mandarim
├── main.js               toda a lógica do globo
├── favicon-selo.svg      ícone 中国 (vermelho-selo)
├── favicon-noturno.svg   ícone 中国 (céu-noturno, alterna com o de cima)
└── favicon.ico           reserva pra navegadores sem suporte a SVG favicon
```

### Editar o roteiro

Tudo em `data.js`. Cada parada:

```js
{
  id: "cidade",              // identificador único, sem espaços
  name: "Nome da cidade",
  lat: 39.9042,
  lon: 116.4074,
  date: "12–16 out",         // texto livre, é só o que aparece na tela
  dateStart: "2026-10-12",   // data real (ISO) — usada pro site saber
  dateEnd: "2026-10-16",     //   em que cidade a viagem está agora
  tag: "Alguma coisa curta",
  description: "Descrição da parada.",
}
```

E cada trajeto:

```js
{ from: "cidade", to: "outra-cidade", type: "trem" }
// type: "voo" | "trem" | "metro" | "onibus"
```

Pra traduzir uma parada nova pro inglês/mandarim, adiciona ela também em
`translations.js`, com o mesmo `id`.

### Rodar localmente

O site usa ES modules, então não abre direto como arquivo (`file://`) — precisa de um servidor local:

```bash
python3 -m http.server 8000
# ou
npx serve .
```

### Publicar

Settings → Pages → Deploy from a branch → `main` / `root`. Alguns minutos depois está no ar.

</details>
