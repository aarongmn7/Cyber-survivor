# Neon Protocol: Cyber Survivor

Um mini-jogo roguelike de sobrevivência com estética dark synthwave / cyberpunk futurista construído com Canvas HTML5/JS puro e também com Godot 4.4 Engine.

## Estética e Visual
- Fundo azulado escuro com grade cibernética (*cyber grid*) animada em perspectiva.
- Elementos em neon brilhante: ciano (`#00f0ff`), magenta (`#ff007f`) e amarelo elétrico (`#ffe600`).
- Sistema dinâmico de partículas neon para propulsão, disparos, impactos e explosões digitais.
- Efeitos visuais de screen shake (tremor de tela), anéis de choque EMP e textos flutuantes de combate.

## Jogabilidade e Mecânicas
- **Controles**: Movimentação fluida via teclado com **WASD** ou as **Setas Direcionais**.
- **Auto-Targeting**: A nave detecta automaticamente o glitch/vírus mais próximo no raio de alcance e dispara pulsos laser.
- **Inimigos Glitch em Ondas**:
  - *Bit Mite*: Pequeno, veloz e agressivo (magenta).
  - *Data Byte*: Formato de losango com movimento ágil e vida intermediária (amarelo).
  - *Trojan Corruptor*: Chefe corrompido de grande escala, alta resistência e pulsação ameaçadora (vermelho/roxo).
- **Bits de XP Luminosos**: Cristais soltos por vírus eliminados que flutuam e são atraídos magneticamente até o jogador.
- **Sistema de Nível & Upgrades**:
  - Ao encher a barra de XP, o jogo pausa e abre um modal futurista com 3 cartas de melhoria:
    1. *Laser Overclock*: Reduz o intervalo de recarga dos disparos.
    2. *Disparo Triplo*: Dispara três lasers em leque frontal.
    3. *Escudo Orbital Giratório*: Orbes neon de proteção em rotação que causam dano por contato.
    4. *Propulsores Warp*: Aumenta a velocidade de movimento da nave.
    5. *Ímã Quântico*: Aumenta o raio de coleta magnética de XP.
    6. *Pulso EMP*: Descargas elétricas periódicas em área a cada 4 segundos.
    7. *Blindagem Nanite*: Cura e elevação da integridade máxima do casco.
- **Interface (HUD)**: Barra de Vida, Nível do Protocolo, Barra de XP e Timer digital de Sobrevivência.
- **Game Over & Reinício**: Tela com resumo completo de estatísticas e botão para reiniciar instantaneamente (tecla **R** ou clique).

## Como Executar
1. **Versão Web (Canvas HTML5 / JS puro)**:
   - Abra diretamente o arquivo `index.html` em qualquer navegador web moderno.
2. **Versão Godot Engine**:
   - Abra a pasta `app/` no editor Godot 4.4 ou execute `Godot_v4.4.1-stable_win64.exe --path app`.
