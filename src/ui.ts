import { config } from './sim/config';
import type { Card, Mode, State, Tool as CardTool } from './sim/types';

export type Tool = 'place' | 'remove' | 'lock' | 'pond';
export interface UiState {
  tool: Tool;
  paused: boolean;
  speed: number;
  muted: boolean;
}

export interface Handlers {
  tool(t: Tool): void;
  pause(): void;
  speed(): void;
  mute(): void;
  menu(): void;
  replay(): void;
  pick(i: number): void;
  start(mode: Mode, water: boolean, seed?: string): void;
  resume(): void;
}

const CARD_TEXT: Record<CardTool, [string, string]> = {
  lock: ['Sluis', 'Een extra sluis om een niveau te overbruggen.'],
  pond: ['Vijver', 'Maakt een sluis twee keer zo snel en zuiniger met water.'],
  boat: ['Extra boot', 'Elke wharf mag één boot meer tegelijk sturen.'],
  speed: ['Snellere boten', 'Alle boten varen 20% sneller.'],
};

const MODES: [Mode, string, string][] = [
  ['classic', 'Klassiek', 'Elke week een keuze uit twee kaarten. Een overvol quay beëindigt de run.'],
  ['endless', 'Endless', 'Geen game over. Een kaart na elke 10 afleveringen.'],
  ['expert', 'Expert', 'Gelegd is gelegd: niets wissen. Sneller oplopend, nooit dezelfde kaart twee keer.'],
];

const attr = (el: Element, name: string) => (el as HTMLElement).dataset[name];

/** Bouwt de DOM-laag rond het canvas: balk bovenaan, kaartkeuze en menu. */
export function createUi(h: Handlers, hasSave: () => boolean) {
  const hud = document.querySelector<HTMLElement>('#hud')!;
  const cards = document.querySelector<HTMLElement>('#cards')!;
  const menu = document.querySelector<HTMLElement>('#menu')!;
  let hudHtml = '';
  let cardsHtml = '';

  // pointerdown in plaats van click: de balk wordt vaak ververst en dan zou een klik halverwege verloren gaan
  const route = (root: HTMLElement, fn: (el: HTMLElement) => void) =>
    root.addEventListener('pointerdown', (e) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
      if (el && !(el as HTMLButtonElement).disabled) fn(el);
    });

  route(hud, (el) => {
    const a = attr(el, 'act');
    if (a === 'tool') h.tool(attr(el, 'tool') as Tool);
    else if (a === 'pause') h.pause();
    else if (a === 'speed') h.speed();
    else if (a === 'mute') h.mute();
    else if (a === 'menu') h.menu();
    else if (a === 'replay') h.replay();
  });
  route(cards, (el) => h.pick(Number(attr(el, 'i'))));
  route(menu, (el) => {
    const a = attr(el, 'act');
    const water = menu.querySelector<HTMLInputElement>('#water')?.checked ?? false;
    if (a === 'resume') h.resume();
    else if (a === 'mode') h.start(attr(el, 'mode') as Mode, water);
    else if (a === 'daily') h.start('classic', false, `daily-${new Date().toISOString().slice(0, 10)}`);
  });

  const toolBtn = (ui: UiState, tool: Tool, label: string, disabled = false) =>
    `<button data-act="tool" data-tool="${tool}" aria-pressed="${ui.tool === tool}" ${disabled ? 'disabled' : ''}>${label}</button>`;

  return {
    update(s: State, ui: UiState) {
      const html = `
        <div class="group">
          ${toolBtn(ui, 'place', `Kanaal <b>${s.tilesLeft}</b>`)}
          ${toolBtn(ui, 'lock', `Sluis <b>${s.lockCharges}</b>`)}
          ${toolBtn(ui, 'pond', `Vijver <b>${s.pondCharges}</b>`)}
          ${s.mode === 'expert' ? '' : toolBtn(ui, 'remove', 'Wissen')}
        </div>
        <div class="group">
          <span class="stat">Score <b>${s.score}</b></span>
          <span class="stat">Week <b>${s.week + 1}</b></span>
          ${s.waterOn ? `<span class="stat" title="Water in de bovenpoel">Water <span class="gauge"><i style="width:${(100 * s.water) / config.water.max}%"></i></span></span>` : ''}
        </div>
        <div class="group" style="margin-left:auto">
          <button data-act="pause" aria-pressed="${ui.paused}">${ui.paused ? 'Verder' : 'Pauze'}</button>
          <button data-act="speed">${ui.speed}×</button>
          <button data-act="mute" aria-pressed="${ui.muted}">${ui.muted ? 'Geluid uit' : 'Geluid aan'}</button>
          <button data-act="replay">Replay</button>
          <button data-act="menu">Menu</button>
        </div>`;
      if (html !== hudHtml) hud.innerHTML = hudHtml = html;

      const c = s.choice ? cardsMarkup(s.choice) : '';
      if (c !== cardsHtml) {
        cards.innerHTML = cardsHtml = c;
        cards.hidden = !s.choice;
      }
    },

    showMenu() {
      menu.innerHTML = `
        <div class="panel">
          <h1>Waterways</h1>
          <p>Verbind elke wharf (vierkant) met het quay (cirkel) van dezelfde kleur. Sleep om kanaal te leggen.
          Water hoger dan het kanaal heeft een sluis nodig: kies Sluis en tik op de lage kant van een stap.
          Een quay dat te lang overvol staat, beëindigt de run.</p>
          ${hasSave() ? '<button class="menu-btn" data-act="resume"><b>Verder spelen</b><small>Je laatste run</small></button>' : ''}
          ${MODES.map(([m, name, desc]) => `<button class="menu-btn" data-act="mode" data-mode="${m}"><b>${name}</b><small>${desc}</small></button>`).join('')}
          <button class="menu-btn" data-act="daily"><b>Daily</b><small>Dezelfde kaart voor iedereen vandaag, klassiek.</small></button>
          <label><input type="checkbox" id="water" /> Waterbudget: elke sluiscyclus kost water, regen vult aan (droge weken minder)</label>
        </div>`;
      menu.hidden = false;
    },

    hideMenu() {
      menu.hidden = true;
    },
    menuOpen: () => !menu.hidden,
  };
}

function cardsMarkup(choice: Card[]) {
  return `<div class="panel">
    <h1>Kies een beloning</h1>
    <div class="cards">${choice
      .map((c, i) => {
        const [name, desc] = CARD_TEXT[c.tool];
        return `<button class="card" data-act="pick" data-i="${i}"><strong>+${c.tiles} kanaaltegels</strong><span><b>${name}</b></span><span>${desc}</span></button>`;
      })
      .join('')}</div>
  </div>`;
}
