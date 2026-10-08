(() => {
  const $ = s => document.querySelector(s);
  const jar = $('#jar'), label = $('#label'), shine = $('#shine'), panel = $('#panel');
  const hero = $('#hero'), inside = $('#inside'), story = $('#story'), finale = $('#finale');
  const ings = [...document.querySelectorAll('.ing')];
  const bar = $('#progress');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  // Where the jar should be at each point of the page.
  // el = section, at = 0..1 through that section, x in vw, y in vh, r = tilt, s = scale, spin = label turn
  const DESKTOP = [
    { el: hero,   at: 0,  x: 0,   y: 9, r: -6,  s: 1,    spin: 0 },
    { el: inside, at: 0,  x: 0,   y: 9, r: -10, s: 1.05, spin: 90 },
    { el: inside, at: .35, x: -24, y: 6, r: 12,  s: 1,    spin: 220 },
    { el: inside, at: 1,  x: -24, y: 6, r: 8,   s: 1,    spin: 340 },
    { el: story,  at: 0,  x: 27,  y: 4, r: -16, s: .85,  spin: 430 },
    { el: story,  at: 1,  x: 27,  y: 4, r: -10, s: .85,  spin: 520 },
    { el: finale, at: 0,  x: 0,   y: 10, r: 40, s: 1.25, spin: 640 },
    { el: finale, at: 1,  x: 0,   y: 14, r: 100, s: 1.3, spin: 760 },
  ];
  const MOBILE = [
    { el: hero,   at: 0,  x: 0,  y: 0,   r: -6,  s: .85, spin: 0 },
    { el: inside, at: 0,  x: 0,  y: 0,   r: -10, s: .85, spin: 90 },
    { el: inside, at: .35, x: 0, y: -24, r: 10,  s: .6,  spin: 220 },
    { el: inside, at: 1,  x: 0,  y: -24, r: 8,   s: .6,  spin: 340 },
    { el: story,  at: 0,  x: 30, y: -34, r: -16, s: .45, spin: 430 },
    { el: story,  at: 1,  x: 30, y: -34, r: -10, s: .45, spin: 520 },
    { el: finale, at: 0,  x: 0,  y: 6,   r: 40,  s: .95, spin: 640 },
    { el: finale, at: 1,  x: 0,  y: 10,  r: 100, s: 1,   spin: 760 },
  ];

  let mobile = innerWidth <= 820;
  let stops = [];
  const build = () => {
    mobile = innerWidth <= 820;
    const vh = innerHeight;
    stops = (mobile ? MOBILE : DESKTOP).map(k => ({
      ...k,
      pos: k.el.offsetTop + k.at * Math.max(k.el.offsetHeight - vh, vh),
    }));
  };

  const target = sy => {
    if (sy <= stops[0].pos) return stops[0];
    for (let i = 0; i < stops.length - 1; i++) {
      const a = stops[i], b = stops[i + 1];
      if (sy <= b.pos) {
        const t = ease(clamp((sy - a.pos) / Math.max(1, b.pos - a.pos)));
        return {
          x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), r: lerp(a.r, b.r, t),
          s: lerp(a.s, b.s, t), spin: lerp(a.spin, b.spin, t),
        };
      }
    }
    return stops[stops.length - 1];
  };

  let cur = null;
  const frame = time => {
    const sy = scrollY;
    const tg = target(sy);
    const k = reduce ? 1 : .12;
    cur = cur
      ? { x: lerp(cur.x, tg.x, k), y: lerp(cur.y, tg.y, k), r: lerp(cur.r, tg.r, k), s: lerp(cur.s, tg.s, k), spin: lerp(cur.spin, tg.spin, k) }
      : { x: tg.x, y: tg.y, r: tg.r, s: tg.s, spin: tg.spin };

    const bob = reduce ? 0 : Math.sin(time / 900) * .8;
    jar.style.transform = `translate3d(${cur.x}vw, ${cur.y + bob}vh, 0) rotate(${cur.r}deg) scale(${cur.s})`;

    // Fake a 3D turn: the label slides sideways and squeezes as the jar "rotates"
    const a = cur.spin * Math.PI / 180;
    label.style.transform = `translateX(${Math.sin(a) * 40}px) scaleX(${.55 + .45 * Math.abs(Math.cos(a))})`;
    shine.style.transform = `translateX(${Math.sin(a + 1) * 62 + 62}px)`;

    // Pink panel + ingredient list
    const p = clamp((sy - inside.offsetTop) / (inside.offsetHeight - innerHeight));
    const pt = ease(clamp(p / .35));
    panel.style.transform = mobile ? `translateY(${(1 - pt) * 100}%)` : `translateX(${(1 - pt) * 100}%)`;
    ings.forEach((el, i) => el.classList.toggle('on', p > .42 + i * .1));

    // Scroll progress bar
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? sy / max : 0})`;

    requestAnimationFrame(frame);
  };

  // Reveal cards once
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .25 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  addEventListener('resize', build);
  addEventListener('load', build);
  build();
  requestAnimationFrame(frame);
})();
