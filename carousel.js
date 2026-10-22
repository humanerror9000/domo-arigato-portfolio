const works = [
  {title:'Reel 2026', id:'6m9t-P_0z8I', type:{es:'Reel del estudio',en:'Studio reel'}, description:{es:'Hacemos video. Animación. Música. 3D. Para que tu idea se vea, se escuche y se entienda.',en:'We make video. Animation. Music. 3D. So your idea is seen, heard and understood.'}},
  {title:'El Camino', id:'3KKLrafJkb4', image:'./media/el-camino-feature.jpg', type:{es:'Película destacada · 00:47',en:'Featured film · 00:47'}, description:{es:'Cuatro ciclistas, cuatro épocas y una misma carretera de montaña. Una pieza personal sobre el camino que nos va haciendo.',en:'Four cyclists, four eras, one mountain road. A personal film about the journey that shapes us.'}},
  {title:'Hallway Maze', id:'Ll_XkMD3p58', makingOf:{id:'0GyGMwyzTo4',link:'https://youtube.com/shorts/0GyGMwyzTo4?feature=share'}, type:{es:'3D + IA · Creación audiovisual',en:'3D + AI · Filmmaking'}, description:{es:'Un ejercicio de creación audiovisual que combina 3D e inteligencia artificial.',en:'A filmmaking experiment combining 3D and AI.'}},
  {title:'Tomorrow on Demand', id:'C1o2wDDHSAk', type:{es:'Cortometraje original · Ciencia ficción',en:'Original short film · Science fiction'}, description:{es:'¿Y si pudieras ver tu propio futuro?',en:'What if you could see your own future?'}},
  {title:'Here', id:'XBWSGUxN3VY', type:{es:'Tráiler conceptual original · Ficción especulativa',en:'Original concept trailer · Speculative fiction'}, description:{es:'En un futuro donde sobrevivir ya no determina el camino, ¿qué hace que valga la pena quedarse?',en:'In a future where survival no longer chooses your path, what makes a life worth staying for?'}},
  {title:'Savital', id:'w742eKkXbfI', type:{es:'Animatic · 2025',en:'Animatic · 2025'}, description:{es:'Animatic para campaña de Savital 2025. Creación de modelo de voz y animación de personaje realista — Taliana Vargas. Cliente: RCN Comerciales.',en:'Animatic for Savital’s 2025 campaign. Voice model creation and realistic character animation — Taliana Vargas. Client: RCN Comerciales.'}},
  {title:'Atenea', id:'AXj6Zb2A6CE', type:{es:'Video institucional por encargo',en:'Commissioned institutional film'}, description:{es:'Un video explicativo claro para Atenea, la agencia distrital de Bogotá para la educación posmedia, la ciencia y la tecnología.',en:'A clear visual explainer for Atenea, Bogotá’s district agency for postsecondary education, science, and technology.'}},
  {title:'Cuates Primates', id:'yd_wUP0pFMA', link:'https://youtube.com/shorts/yd_wUP0pFMA?si=SHY3M_bqwz0Yk4S9', type:{es:'Corto vertical · Episodio 01',en:'Vertical short · Episode 01'}, description:{es:'Dos primates, un mal hábito y una discusión muy familiar sobre productividad.',en:'Two primates, one bad habit, and a familiar argument about productivity.'}},
  {title:'Zia — Break the Signal', id:'YSLBSyj9xAk', type:{es:'Artista virtual · Música e imagen en movimiento',en:'Virtual artist · Music and moving image'}, description:{es:'Una artista virtual que cobra forma a través de música original, personaje y puesta en escena visual.',en:'A virtual artist taking shape through original music, character, and visual performance.'}},
  {title:'Zia — Tesseract', id:'v3pJwU923RM', type:{es:'Artista virtual · Música e imagen en movimiento',en:'Virtual artist · Music and moving image'}, description:{es:'Una artista virtual que cobra forma a través de música original, personaje y puesta en escena visual.',en:'A virtual artist taking shape through original music, character, and visual performance.'}},
  {title:'Zia — Hypercube', id:'-2wvM_LeJAI', type:{es:'Artista virtual · Música e imagen en movimiento',en:'Virtual artist · Music and moving image'}, description:{es:'Una artista virtual que cobra forma a través de música original, personaje y puesta en escena visual.',en:'A virtual artist taking shape through original music, character, and visual performance.'}}
];

const track = document.querySelector('#library-track');
const count = document.querySelector('#library-count');
const featureArt = document.querySelector('.feature-art');
const featureHero = document.querySelector('#film-frame');
const playButton = document.querySelector('#play-film');
const makingOfButton = document.querySelector('#play-making-of');
const youtubeLink = document.querySelector('#youtube-link');
const cards = works.map((work, index) => {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'work-card';
  card.setAttribute('aria-label', `${work.title}, ${index + 1} de ${works.length}`);
  card.setAttribute('aria-roledescription', 'slide');
  card.dataset.index = index;
  const image = document.createElement('img');
  image.alt = '';
  image.loading = index < 4 ? 'eager' : 'lazy';
  image.src = work.image || `https://i.ytimg.com/vi/${work.id}/maxresdefault.jpg`;
  if (!work.image) image.addEventListener('load', () => {
    if (image.naturalWidth < 500 && !image.dataset.fallback) {
      image.dataset.fallback = '1';
      image.src = `https://i.ytimg.com/vi/${work.id}/hqdefault.jpg`;
    }
  });
  image.addEventListener('error', () => {
    if (!image.dataset.fallback) {
      image.dataset.fallback = '1';
      image.src = `https://i.ytimg.com/vi/${work.id}/hqdefault.jpg`;
    } else card.classList.add('image-missing');
  });
  const shade = document.createElement('span'); shade.className = 'work-shade';
  const number = document.createElement('span'); number.className = 'work-number'; number.textContent = String(index + 1).padStart(2, '0');
  const title = document.createElement('span'); title.className = 'work-title'; title.textContent = work.title;
  card.append(image, shade, number, title);
  track.append(card);
  return card;
});

let active = 1;
let hoveredIndex = null;
let pinnedIndex = null;
let previewIndex = 1;
let previewRevision = 0;
let frame = 0;
let dragging = false;
let dragMoved = false;
let dragX = 0;
let dragScroll = 0;
let suppressClick = false;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
window.selectedPortfolioWork = works[1];

function renderPreviewCopy() {
  const work = works[previewIndex];
  const language = document.documentElement.lang === 'en' ? 'en' : 'es';
  document.querySelector('#panel-kicker').textContent = work.type[language];
  document.querySelector('#panel-title').textContent = work.title;
  document.querySelector('#panel-note').textContent = work.description[language];
  playButton.innerHTML = work.link ? (language === 'en' ? 'Open short <span>↗</span>' : 'Abrir corto <span>↗</span>') : (language === 'en' ? 'Watch film <span>▶</span>' : 'Ver película <span>▶</span>');
  makingOfButton.hidden = !work.makingOf;
  makingOfButton.textContent = language === 'en' ? 'Making of ▶' : 'Cómo se hizo ▶';
  youtubeLink.href = work.link || `https://youtu.be/${work.id}`;
  youtubeLink.textContent = language === 'en' ? 'Watch on YouTube ↗' : 'Ver en YouTube ↗';
  youtubeLink.hidden = Boolean(work.link);
  featureHero.classList.toggle('long-title', work.title.length > 19);
}
function setPreview(index) {
  if (index === previewIndex) return;
  previewIndex = index;
  const work = works[index];
  window.selectedPortfolioWork = work;
  renderPreviewCopy();
  const revision = ++previewRevision;
  const cardImage = cards[index].querySelector('img');
  const source = work.image || (cardImage.complete && cardImage.naturalWidth > 0 ? cardImage.currentSrc : `https://i.ytimg.com/vi/${work.id}/maxresdefault.jpg`);
  const probe = new Image();
  probe.onload = () => {
    if (revision !== previewRevision) return;
    if (probe.naturalWidth < 500 && !work.image && !probe.src.endsWith('hqdefault.jpg')) {
      probe.src = `https://i.ytimg.com/vi/${work.id}/hqdefault.jpg`;
      return;
    }
    featureArt.src = probe.src;
    featureHero.style.setProperty('--feature-image', `url("${probe.src}")`);
  };
  probe.onerror = () => {
    if (revision === previewRevision && !work.image && !probe.src.endsWith('hqdefault.jpg')) probe.src = `https://i.ytimg.com/vi/${work.id}/hqdefault.jpg`;
  };
  probe.src = source;
}
function updateCards() {
  const trackRect = track.getBoundingClientRect();
  const center = trackRect.left + track.clientWidth / 2;
  const step = cards[0].offsetWidth + parseFloat(getComputedStyle(track).gap || 0);
  let nearest = 0;
  let nearestDistance = Infinity;
  const distances = cards.map((card, index) => {
    const box = card.getBoundingClientRect();
    const distance = Math.abs(box.left + box.width / 2 - center) / step;
    if (distance < nearestDistance) { nearest = index; nearestDistance = distance; }
    return distance;
  });
  active = hoveredIndex ?? pinnedIndex ?? nearest;
  cards.forEach((card, index) => {
    const influence = hoveredIndex !== null || pinnedIndex !== null ? (index === active ? 1 : 0) : Math.max(0, 1 - distances[index]);
    card.style.setProperty('--card-scale', (1 + influence * .13).toFixed(3));
    card.style.setProperty('--card-opacity', hoveredIndex !== null || pinnedIndex !== null ? (index === active ? '1' : Math.abs(index - active) === 1 ? '.63' : '.43') : Math.max(.43, 1 - distances[index] * .35).toFixed(3));
    card.classList.toggle('is-active', index === active);
    card.setAttribute('aria-current', index === active ? 'true' : 'false');
  });
  count.textContent = `${String(active + 1).padStart(2, '0')} / ${String(works.length).padStart(2, '0')}`;
  setPreview(active);
}
function centerOn(index, behavior = 'smooth') {
  index = Math.max(0, Math.min(works.length - 1, index));
  hoveredIndex = null;
  pinnedIndex = index;
  active = index;
  const card = cards[index];
  const target = track.scrollLeft + card.getBoundingClientRect().left + card.getBoundingClientRect().width / 2 - track.getBoundingClientRect().left - track.clientWidth / 2;
  track.scrollTo({left: target, behavior: reducedMotion.matches ? 'instant' : behavior});
  updateCards();
}
window.selectPortfolioWork = centerOn;
track.addEventListener('scroll', () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(updateCards); }, {passive:true});
track.addEventListener('scrollend', () => { pinnedIndex = null; updateCards(); });
addEventListener('resize', () => centerOn(active, 'instant'));
requestAnimationFrame(() => centerOn(1, 'instant'));

cards.forEach((card, index) => {
  card.addEventListener('focus', () => { if (!dragging) { hoveredIndex = index; updateCards(); } });
  card.addEventListener('blur', () => { if (hoveredIndex === index) { hoveredIndex = null; updateCards(); } });
  card.addEventListener('click', () => {
    if (suppressClick) { suppressClick = false; return; }
    centerOn(index);
  });
});
document.querySelector('#library-prev').addEventListener('click', () => centerOn(active - 1));
document.querySelector('#library-next').addEventListener('click', () => centerOn(active + 1));
track.addEventListener('keydown', event => {
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault();
    centerOn(active + (event.key === 'ArrowRight' ? 1 : -1));
  }
});
track.addEventListener('pointerdown', event => {
  if (event.pointerType === 'touch') return;
  dragging = true; dragMoved = false; dragX = event.clientX; dragScroll = track.scrollLeft;
  hoveredIndex = null; pinnedIndex = null;
  track.classList.add('is-dragging');
});
track.addEventListener('pointermove', event => {
  if (!dragging) {
    if (event.pointerType === 'touch') return;
    const hoveredCard = event.target.closest('.work-card');
    if (hoveredCard) {
      const nextHovered = Number(hoveredCard.dataset.index);
      if (nextHovered !== hoveredIndex) { hoveredIndex = nextHovered; updateCards(); }
    }
    return;
  }
  const delta = event.clientX - dragX;
  if (Math.abs(delta) > 5) dragMoved = true;
  if (dragMoved) { track.setPointerCapture(event.pointerId); track.scrollLeft = dragScroll - delta; }
});
track.addEventListener('pointerleave', () => {
  if (hoveredIndex !== null) centerOn(hoveredIndex);
});
function endDrag() {
  if (!dragging) return;
  dragging = false;
  track.classList.remove('is-dragging');
  if (dragMoved) {
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 120);
    updateCards();
    centerOn(active);
  }
}
track.addEventListener('pointerup', endDrag);
track.addEventListener('pointercancel', endDrag);
track.addEventListener('wheel', event => {
  if (Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.shiftKey) {
    pinnedIndex = null;
    event.preventDefault(); track.scrollLeft += event.deltaX || event.deltaY;
  }
}, {passive:false});

window.updateLibraryLanguage = english => {
  document.querySelector('#library').setAttribute('aria-label', english ? 'Explore projects' : 'Explorar proyectos');
  document.querySelector('#library-eyebrow').textContent = english ? 'Selected work / Archive' : 'Selección / Archivo';
  document.querySelector('#library-title').textContent = english ? 'Explore the work.' : 'Explora el trabajo.';
  document.querySelector('#library-track').setAttribute('aria-label', english ? 'Video projects' : 'Proyectos en video');
  document.querySelector('#library-instruction').textContent = english ? 'Hover, drag, swipe, or use the arrows to explore.' : 'Pasa el cursor, arrastra, desliza o usa las flechas para explorar.';
  document.querySelector('#zia-link').textContent = english ? 'More from Zia ↗' : 'Más de Zia ↗';
  document.querySelector('#library-prev').setAttribute('aria-label', english ? 'Previous project' : 'Proyecto anterior');
  document.querySelector('#library-next').setAttribute('aria-label', english ? 'Next project' : 'Proyecto siguiente');
  cards.forEach((card, index) => card.setAttribute('aria-label', `${works[index].title}, ${index + 1} ${english ? 'of' : 'de'} ${works.length}`));
  renderPreviewCopy();
};
renderPreviewCopy();
