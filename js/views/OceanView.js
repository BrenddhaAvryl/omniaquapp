export function initializeOcean() {
  const movimentoReduzido = window.matchMedia("(prefers-reduced-motion: reduce)");
  const oceano = document.getElementById("oceano");
  const pincel = oceano.getContext("2d");
  let tempo = 0;
  let quadro = 0;
  let anterior = 0;

  const fundo = document.querySelector(".fundo-marinho");
  for (let i = 0; i < 18; i++) {
    const bolha = document.createElement("span");
    bolha.className = "bolha";
    bolha.style.setProperty("--x", `${(i * 37 + 2) % 100}%`);
    bolha.style.setProperty("--diametro", `${4 + i % 7}px`);
    bolha.style.setProperty("--duracao", `${40 + i % 13}s`);
    bolha.style.setProperty("--atraso", `-${(i * 17 + 8) % 41}s`);
    fundo.append(bolha);
  }

  const anemonas = Array.from(fundo.querySelectorAll("canvas"), (tela, lado) => {
    const contexto = tela.getContext("2d");
    const pigmento = contexto.createLinearGradient(0, 30, 0, tela.height);
    pigmento.addColorStop(0, lado ? "#b893af" : "#86c4b7");
    pigmento.addColorStop(.58, lado ? "#805e80" : "#427f82");
    pigmento.addColorStop(1, "#103a48");
    return { tela, contexto, pigmento, lado };
  });

  function desenharAnemonas() {
    for (const { tela, contexto, pigmento, lado } of anemonas) {
      contexto.clearRect(0, 0, tela.width, tela.height);
      contexto.fillStyle = pigmento;
      for (let i = 0; i < 20; i++) {
        // A base fica presa ao recife. A corrente curva apenas as extremidades.
        const posicao = ((i * 11) % 20) / 19;
        const abertura = posicao * 2 - 1;
        const raiz = 150 + abertura * 46;
        const altura = 130 - 56 * abertura ** 2 + 22 * Math.cos(i * 2 + lado);
        const corrente = 8 * Math.sin(tempo * .35 + posicao * 2 + lado);
        const ponta = raiz + abertura * 93 + corrente;
        const topo = 210 - altura;
        const curva = ponta + 15 * Math.sin(i + tempo * .24);
        contexto.globalAlpha = .55 + (i % 4) * .13;
        contexto.beginPath();
        contexto.moveTo(raiz - 9, 210);
        contexto.bezierCurveTo(raiz - 7, 162, curva - 8, topo + 25, ponta - 4, topo);
        contexto.bezierCurveTo(ponta - 5, topo - 9, ponta + 6, topo - 9, ponta + 4, topo);
        contexto.bezierCurveTo(curva + 7, topo + 30, raiz + 9, 162, raiz + 9, 210);
        contexto.fill();
      }
    }
  }

  // Um cardume de tetras: os peixes ao fundo são menores e mais translúcidos.
  const cardume = [
    { x: -75, y: -33, tamanho: .58, opacidade: .48 },
    { x: 42, y: -45, tamanho: .68, opacidade: .63 },
    { x: 104, y: -17, tamanho: .57, opacidade: .55 },
    { x: 74, y: 29, tamanho: .86, opacidade: .84 },
    { x: -61, y: 30, tamanho: .79, opacidade: .88 },
    { x: -16, y: -7, tamanho: 1, opacidade: 1 }
  ];
  const corpoPeixe = new Path2D("M -28 0 C -21 -12 -6 -13 7 -7 Q 17 -2 23 -2 L 23 2 Q 15 3 7 7 C -7 15 -23 12 -28 0 Z");
  const caudaPeixe = new Path2D("M 0 -2 Q 6 -4 15 -11 Q 14 -4 10 0 Q 14 4 15 10 Q 6 7 0 2 Z");
  const nadadeiras = new Path2D("M -7 -9 Q -1 -18 8 -16 L 4 -7 Z M -1 8 L 6 14 L 9 6 Z");

  function desenharPeixe(x, y, escala, fase, opacidade) {
    pincel.save();
    pincel.translate(x + Math.cos(fase * .53) * 4, y + Math.sin(fase) * 3);
    pincel.rotate(-.045 + Math.cos(fase) * .045);
    pincel.scale(escala, escala);
    pincel.globalAlpha = opacidade;
    pincel.fillStyle = "#67abaa";
    pincel.fill(nadadeiras);
    pincel.save();
    pincel.translate(22, 0);
    pincel.scale(.84 + Math.sin(fase * 3) * .16, 1);
    pincel.fill(caudaPeixe);
    pincel.restore();
    pincel.fillStyle = "#77b6be";
    pincel.fill(corpoPeixe);
    pincel.beginPath();
    pincel.arc(-19, -3, 2.2, 0, Math.PI * 2);
    pincel.fillStyle = "#082e3d";
    pincel.fill();
    pincel.restore();
  }

  function desenharMar() {
    desenharAnemonas();
    const largura = oceano.clientWidth;
    const altura = oceano.clientHeight;
    const densidade = Math.min(window.devicePixelRatio || 1, 2);
    const pixelsX = Math.round(largura * densidade);
    const pixelsY = Math.round(altura * densidade);
    if (oceano.width !== pixelsX || oceano.height !== pixelsY) {
      oceano.width = pixelsX;
      oceano.height = pixelsY;
    }
    pincel.setTransform(densidade, 0, 0, densidade, 0, 0);
    pincel.clearRect(0, 0, largura, altura);
    const compacto = window.matchMedia("(max-width: 599px)").matches && altura >= 230;

    // A luz atravessa a superfície em faixas que se deslocam lentamente.
    for (let i = 0; i < 6; i++) {
      const x = largura * (.2 + i * .16) + Math.sin(tempo * .16 + i) * 14;
      const luz = pincel.createLinearGradient(x, 0, x - 60, altura);
      luz.addColorStop(0, "#b2fff91a"); luz.addColorStop(1, "#86e5e400");
      pincel.fillStyle = luz;
      pincel.beginPath(); pincel.moveTo(x, 0); pincel.lineTo(x + 14 + i * 2, 0);
      pincel.lineTo(x - 36, altura); pincel.lineTo(x - 135, altura); pincel.fill();
    }
    for (let i = 0; i < 3; i++) {
      pincel.beginPath();
      for (let x = -4; x <= largura + 4; x += 4) {
        const y = 5 + i * 6 + Math.sin(x / 86 + tempo * .42 + i) * 5;
        if (x === -4) pincel.moveTo(x, y); else pincel.lineTo(x, y);
      }
      pincel.strokeStyle = "#9aefe82d"; pincel.lineWidth = 1; pincel.stroke();
    }

    // Dois planos de recife dão profundidade ao fundo do aquário.
    for (let i = 0; i < 2; i++) {
      pincel.beginPath(); pincel.moveTo(0, altura);
      for (let x = 0; x <= largura + 5; x += 5) {
        const y = altura * (.81 + i * .09) + Math.sin(x / 88 + i * 6) * 12 + Math.sin(x / 31 + i) * 4;
        pincel.lineTo(x, y);
      }
      pincel.lineTo(largura, altura); pincel.fillStyle = i ? "#082b3b" : "#105064"; pincel.fill();
    }
    for (let i = 0; i < 14; i++) {
      const y = altura + 4 - ((i * 43 + tempo * (3 + i % 4)) % (altura + 8));
      const x = largura * ((i * .618) % 1) + Math.sin(tempo * .32 + i) * 3;
      pincel.beginPath(); pincel.arc(x, y, 1 + i % 3, 0, Math.PI * 2);
      pincel.strokeStyle = "#a4e8e73d"; pincel.stroke();
    }
    const escala = compacto ? Math.min(largura / 365, 1.15) : Math.min(largura / 750, 1.5);
    const x = largura * (compacto ? .48 : .76) + Math.cos(tempo * .15) * 16;
    const y = altura * (compacto ? .37 : .5) + Math.sin(tempo * .22) * 5;
    cardume.forEach((peixe, indice) => {
      desenharPeixe(x + peixe.x * escala, y + peixe.y * escala,
        escala * peixe.tamanho, tempo * .95 + indice * 1.7, peixe.opacidade);
    });
  }

  function animarMar(agora) {
    if (anterior) tempo += Math.min(agora - anterior, 100) / 1000;
    anterior = agora;
    desenharMar();
    quadro = requestAnimationFrame(animarMar);
  }

  function atualizarMovimento() {
    cancelAnimationFrame(quadro);
    anterior = 0;
    desenharMar();
    if (!movimentoReduzido.matches && !document.hidden) quadro = requestAnimationFrame(animarMar);
  }
  movimentoReduzido.addEventListener("change", atualizarMovimento);
  document.addEventListener("visibilitychange", atualizarMovimento);
  new ResizeObserver(desenharMar).observe(oceano);
  atualizarMovimento();
}
