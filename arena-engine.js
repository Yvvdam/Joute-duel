/* Moteur des trois arènes dark fantasy de Joute Duel. */
class RealisticMedievalArenas {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {HTMLElement|null} postFxElement
   */
  constructor(canvas, postFxElement = null) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.postFxElement = postFxElement;

    this.currentArena = "forge";
    this.showGroundAnchors = true;
    this.width = 0;
    this.height = 0;
    this.dpr = 1;
    this.time = 0;
    this.lastTimestamp = null;
    this.rafId = null;

    // État atmosphérique dynamique
    this.lightningIntensity = 0;
    this.nextLightningTimer = 3.5;
    this.lightningBolt = [];

    // Génération des textures procédurales haute définition (offscreen)
    this.textures = {
      basalt: this.createStoneTexture("#181412", "#26201d", "#0b0908", true),
      limestone: this.createStoneTexture("#262b30", "#363d44", "#15191d", false, true),
      mud: this.createMudTexture(),
      filmGrain: this.createFilmGrainTexture()
    };

    this.initAtmosphericParticles();
    this.resize();
    this.handleResize = () => this.resize();
    window.addEventListener("resize", this.handleResize);
  }

  /**
   * Retourne les coordonnées normalisées (0..1) et en pixels pour placer
   * Joueur 1 (premier plan gauche) et Joueur 2 (arrière-plan droit).
   */
  getFighterAnchors() {
    const p1 = { nx: 0.27, ny: 0.73, scale: 1.08 };
    const p2 = { nx: 0.73, ny: 0.57, scale: 0.86 };
    return {
      player1: { ...p1, x: p1.nx * this.width, y: p1.ny * this.height },
      player2: { ...p2, x: p2.nx * this.width, y: p2.ny * this.height }
    };
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = Math.max(320, rect.width || 960);
    this.height = Math.max(180, rect.height || 540);

    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  /**
   * Génère une texture procédurale de pierre (basalte fissuré ou calcaire moussu).
   */
  createStoneTexture(baseHex, lightHex, darkHex, withCracks = false, withMoss = false) {
    const size = 256;
    const off = document.createElement("canvas");
    off.width = size;
    off.height = size;
    const c = off.getContext("2d");

    c.fillStyle = baseHex;
    c.fillRect(0, 0, size, size);

    // Grain minéral multi-échelle
    for (let i = 0; i < 3600; i++) {
      const x = (i * 73) % size;
      const y = (i * 137 + Math.floor(i / 40) * 19) % size;
      const r = (i % 3) + 0.6;
      c.fillStyle = i % 2 === 0 ? lightHex : darkHex;
      c.globalAlpha = 0.08 + (i % 5) * 0.025;
      c.fillRect(x, y, r, r);
    }

    // Veines et micro-fissures naturelles
    if (withCracks) {
      c.globalAlpha = 0.42;
      c.strokeStyle = "#060504";
      c.lineWidth = 1.2;
      for (let k = 0; k < 14; k++) {
        let cx = (k * 47) % size;
        let cy = (k * 83) % size;
        c.beginPath();
        c.moveTo(cx, cy);
        for (let step = 0; step < 6; step++) {
          cx += ((k + step) % 2 === 0 ? 1 : -1) * (8 + (step * 3) % 11);
          cy += 6 + (step * 5) % 9;
          c.lineTo(cx, cy);
        }
        c.stroke();
      }
    }

    // Lichen et mousse humide pour le cloître gothique
    if (withMoss) {
      for (let m = 0; m < 45; m++) {
        const mx = (m * 61) % size;
        const my = (m * 97) % size;
        const rad = 6 + (m % 14);
        const g = c.createRadialGradient(mx, my, 1, mx, my, rad);
        g.addColorStop(0, "rgba(42, 62, 46, 0.28)");
        g.addColorStop(1, "rgba(42, 62, 46, 0)");
        c.fillStyle = g;
        c.globalAlpha = 1;
        c.beginPath();
        c.arc(mx, my, rad, 0, Math.PI * 2);
        c.fill();
      }
    }

    c.globalAlpha = 1;
    return off;
  }

  /**
   * Génère une texture procédurale de boue sombre piétinée.
   */
  createMudTexture() {
    const size = 256;
    const off = document.createElement("canvas");
    off.width = size;
    off.height = size;
    const c = off.getContext("2d");

    c.fillStyle = "#191410";
    c.fillRect(0, 0, size, size);

    for (let i = 0; i < 4200; i++) {
      const x = (i * 89) % size;
      const y = (i * 53 + Math.floor(i / 32) * 13) % size;
      c.fillStyle = i % 3 === 0 ? "#282019" : i % 3 === 1 ? "#0e0b09" : "#352b22";
      c.globalAlpha = 0.14;
      c.fillRect(x, y, 2 + (i % 4), 1.5);
    }
    c.globalAlpha = 1;
    return off;
  }

  /**
   * Génère un calque de grain photographique subtil (anti-rendu plat).
   */
  createFilmGrainTexture() {
    const size = 160;
    const off = document.createElement("canvas");
    off.width = size;
    off.height = size;
    const c = off.getContext("2d");
    const img = c.createImageData(size, size);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = ((i * 19) % 255);
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 10;
    }
    c.putImageData(img, 0, 0);
    return off;
  }

  initAtmosphericParticles() {
    // Fumée lourde & braises de forge avec profondeur de champ (near / far)
    this.forgeSmoke = Array.from({ length: 14 }, (_, i) => ({
      x: (i * 0.13) % 1,
      y: 0.25 + (i % 5) * 0.12,
      r: 45 + (i % 4) * 28,
      vx: 0.012 + (i % 3) * 0.006,
      vy: -0.018 - (i % 3) * 0.005,
      alpha: 0.07 + (i % 3) * 0.03
    }));

    this.forgeEmbers = Array.from({ length: 48 }, (_, i) => ({
      x: ((i * 67) % 100) / 100,
      y: ((i * 41) % 100) / 100,
      depth: i % 3 === 0 ? 1.8 : i % 2 === 0 ? 1.0 : 0.55, // Profondeur de champ
      speedY: 0.05 + (i % 6) * 0.022,
      phase: i * 0.9
    }));

    // Poussière lunaire & nappes de brouillard au ras du sol (Cloître)
    this.dustMotes = Array.from({ length: 42 }, (_, i) => ({
      x: ((i * 83) % 100) / 100,
      y: ((i * 37) % 100) / 100,
      r: 0.8 + (i % 3) * 0.65,
      speedY: -0.008 - (i % 4) * 0.004,
      phase: i * 1.1
    }));

    this.groundMistLayers = Array.from({ length: 7 }, (_, i) => ({
      yRatio: 0.54 + i * 0.065,
      speed: (i % 2 === 0 ? 1 : -1) * (8 + i * 2.5),
      offset: i * 140,
      height: 34 + (i % 3) * 16,
      alpha: 0.09 + (i % 3) * 0.03
    }));

    // Pluie battante réaliste (Lice d'Orage)
    this.raindrops = Array.from({ length: 130 }, (_, i) => ({
      x: ((i * 61) % 100) / 100,
      y: ((i * 29) % 100) / 100,
      depth: 0.5 + (i % 4) * 0.25,
      len: 14 + (i % 4) * 7,
      speed: 680 + (i % 5) * 110
    }));
  }

  destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    window.removeEventListener("resize", this.handleResize);
  }

  setArena(arenaId) {
    if (!["forge", "cloitre", "lice"].includes(arenaId)) return;
    this.currentArena = arenaId;
    this.lightningIntensity = 0;

    if (this.postFxElement) {
      this.postFxElement.classList.remove("fx-forge", "fx-cloitre", "fx-lice", "flash-active");
      this.postFxElement.classList.add(`fx-${arenaId}`);
    }
  }

  start() {
    if (this.rafId) return;
    const tick = (now) => {
      if (this.lastTimestamp === null) this.lastTimestamp = now;
      const dt = Math.min(0.05, (now - this.lastTimestamp) / 1000);
      this.lastTimestamp = now;
      this.time += dt;

      this.update(dt);
      this.render();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  update(dt) {
    if (this.currentArena === "forge") {
      for (const s of this.forgeSmoke) {
        s.x = (s.x + s.vx * dt) % 1.15;
        s.y += s.vy * dt;
        if (s.y < 0.05) {
          s.y = 0.68;
          s.x = Math.random();
        }
      }
      for (const e of this.forgeEmbers) {
        e.y -= e.speedY * e.depth * dt;
        e.x += Math.sin(this.time * 2.2 + e.phase) * 0.018 * dt;
        if (e.y < -0.04) {
          e.y = 1.04;
          e.x = Math.random();
        }
      }
    } else if (this.currentArena === "cloitre") {
      for (const d of this.dustMotes) {
        d.y += d.speedY * dt;
        d.x += Math.sin(this.time * 0.9 + d.phase) * 0.008 * dt;
        if (d.y < 0.05) d.y = 0.85;
      }
      for (const m of this.groundMistLayers) {
        m.offset += m.speed * dt;
      }
    } else if (this.currentArena === "lice") {
      for (const r of this.raindrops) {
        r.y += (r.speed * r.depth * dt) / this.height;
        r.x -= (r.speed * 0.26 * r.depth * dt) / this.width;
        if (r.y > 1.06) {
          r.y = -0.06;
          r.x = Math.random() * 1.25;
        }
      }

      this.nextLightningTimer -= dt;
      if (this.nextLightningTimer <= 0) {
        this.triggerLightning();
        this.nextLightningTimer = 4.5 + Math.random() * 4.5;
      }
      if (this.lightningIntensity > 0) {
        this.lightningIntensity = Math.max(0, this.lightningIntensity - dt * 2.4);
      }
    }
  }

  triggerLightning() {
    this.lightningIntensity = 1.0;
    // Génère un tracé d'éclair ramifié réaliste dans les nuages
    const startX = this.width * (0.35 + Math.random() * 0.45);
    const endY = this.height * 0.44;
    const pts = [{ x: startX, y: 0 }];
    let cx = startX;
    let cy = 0;
    const steps = 8;
    for (let i = 1; i <= steps; i++) {
      cx += (Math.random() - 0.52) * 38;
      cy = (endY / steps) * i;
      pts.push({ x: cx, y: cy });
    }
    this.lightningBolt = pts;

    if (this.postFxElement) {
      this.postFxElement.classList.remove("flash-active");
      void this.postFxElement.offsetWidth;
      this.postFxElement.classList.add("flash-active");
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    if (this.currentArena === "forge") {
      this.renderForge(ctx);
    } else if (this.currentArena === "cloitre") {
      this.renderCloitre(ctx);
    } else if (this.currentArena === "lice") {
      this.renderLice(ctx);
    }

    // Socles gravés réalistes au sol pour J1 et J2 (optionnel)
    if (this.showGroundAnchors) {
      this.renderRealisticGroundAnchors(ctx);
    }

    // Grain photographique subtil sur toute l'image
    const grainPattern = ctx.createPattern(this.textures.filmGrain, "repeat");
    if (grainPattern) {
      ctx.save();
      ctx.fillStyle = grainPattern;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    }
  }

  /**
   * Dessine des repères réalistes gravés dans le sol (pierre ou boue)
   * en perspective 2.5D : J1 premier plan gauche, J2 arrière-plan droit.
   */
  renderRealisticGroundAnchors(ctx) {
    const anchors = this.getFighterAnchors();
    const isForge = this.currentArena === "forge";
    const isCloitre = this.currentArena === "cloitre";

    const specs = [
      { label: "J1", data: anchors.player1, rx: this.width * 0.075, ry: this.height * 0.032 },
      { label: "J2", data: anchors.player2, rx: this.width * 0.058, ry: this.height * 0.024 }
    ];

    for (const item of specs) {
      const { x, y } = item.data;
      ctx.save();
      ctx.translate(x, y);

      // Ombre de contact au sol
      const shadowGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, item.rx * 1.15);
      shadowGrad.addColorStop(0, "rgba(0, 0, 0, 0.65)");
      shadowGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(0, 2, item.rx * 1.15, item.ry * 1.2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cercle gravé / sillon dans la matière
      ctx.beginPath();
      ctx.ellipse(0, 0, item.rx, item.ry, 0, 0, Math.PI * 2);
      ctx.strokeStyle = isForge
        ? "rgba(234, 88, 12, 0.45)"
        : isCloitre
          ? "rgba(148, 163, 184, 0.35)"
          : "rgba(120, 113, 108, 0.42)";
      ctx.lineWidth = 1.6;
      ctx.stroke();

      // Anneau intérieur fin
      ctx.beginPath();
      ctx.ellipse(0, 0, item.rx * 0.82, item.ry * 0.82, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Marquage discret
      ctx.fillStyle = "rgba(231, 229, 228, 0.55)";
      ctx.font = `600 ${Math.max(10, Math.round(this.width * 0.011))}px Cinzel, serif`;
      ctx.textAlign = "center";
      ctx.fillText(item.label, 0, item.ry + 14);
      ctx.restore();
    }
  }

  /* =======================================================================
     ARÈNE 1 : LA FOSSE DES FORGERONS (Dark Fantasy Basalte & Métal en fusion)
     ======================================================================= */
  renderForge(ctx) {
    const w = this.width;
    const h = this.height;
    const horizonY = h * 0.43;
    const flicker = 0.88 + 0.12 * Math.sin(this.time * 5.2) * Math.cos(this.time * 3.1);

    // 1. Paroi de caverne basaltique sombre en arrière-plan
    const wallGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    wallGrad.addColorStop(0, "#070504");
    wallGrad.addColorStop(0.6, "#170e0a");
    wallGrad.addColorStop(1, "#2b1309");
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, w, horizonY);

    // Hauts-fourneaux / gueules de forge incandescents au fond
    const furnaces = [w * 0.24, w * 0.5, w * 0.76];
    for (let i = 0; i < furnaces.length; i++) {
      const fx = furnaces[i];
      const fw = w * 0.13;
      const fh = horizonY * 0.52;

      // Voûte de pierre sombre
      ctx.fillStyle = "#100c0a";
      ctx.beginPath();
      ctx.arc(fx, horizonY - fh * 0.55, fw * 0.55, Math.PI, 0);
      ctx.lineTo(fx + fw * 0.55, horizonY);
      ctx.lineTo(fx - fw * 0.55, horizonY);
      ctx.closePath();
      ctx.fill();

      // Foyer rougeoyant profond
      const hearth = ctx.createRadialGradient(fx, horizonY - 8, 2, fx, horizonY - 12, fw * 0.55);
      hearth.addColorStop(0, `rgba(254, 240, 138, ${0.75 * flicker})`);
      hearth.addColorStop(0.35, `rgba(234, 88, 12, ${0.45 * flicker})`);
      hearth.addColorStop(1, "rgba(124, 45, 18, 0)");
      ctx.fillStyle = hearth;
      ctx.fillRect(fx - fw * 0.6, horizonY - fh, fw * 1.2, fh);
    }

    // 2. Chaînes lourdes en fer rouillé suspendues dans la pénombre
    const chainConfigs = [
      { x: w * 0.08, len: h * 0.58, sway: 0.015 },
      { x: w * 0.14, len: h * 0.36, sway: -0.02 },
      { x: w * 0.87, len: h * 0.52, sway: 0.018 },
      { x: w * 0.93, len: h * 0.34, sway: -0.015 }
    ];
    for (const ch of chainConfigs) {
      ctx.save();
      ctx.translate(ch.x, 0);
      ctx.rotate(Math.sin(this.time * 1.4 + ch.x) * ch.sway);
      const linkH = 12;
      const count = Math.floor(ch.len / linkH);
      for (let j = 0; j < count; j++) {
        const ly = j * linkH;
        ctx.strokeStyle = j % 2 === 0 ? "#29221e" : "#3f2e24";
        ctx.lineWidth = j % 2 === 0 ? 3.2 : 2.2;
        ctx.beginPath();
        ctx.ellipse(0, ly + linkH * 0.5, j % 2 === 0 ? 4.5 : 2.2, linkH * 0.48, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 3. Sol en roche basaltique texturée
    const basaltPattern = ctx.createPattern(this.textures.basalt, "repeat");
    ctx.fillStyle = basaltPattern || "#171311";
    ctx.fillRect(0, horizonY, w, h - horizonY);

    // Ombrage de profondeur et reflets spéculaires huileux sur le basalte
    const floorShade = ctx.createLinearGradient(0, horizonY, 0, h);
    floorShade.addColorStop(0, "rgba(5, 4, 3, 0.78)");
    floorShade.addColorStop(0.35, "rgba(20, 15, 12, 0.25)");
    floorShade.addColorStop(1, "rgba(5, 4, 3, 0.65)");
    ctx.fillStyle = floorShade;
    ctx.fillRect(0, horizonY, w, h - horizonY);

    // Reflets spéculaires réalistes sur la pierre humide/huileuse
    const specularPatches = [
      { x: w * 0.36, y: horizonY + (h - horizonY) * 0.48, rx: w * 0.09, ry: h * 0.025 },
      { x: w * 0.63, y: horizonY + (h - horizonY) * 0.42, rx: w * 0.08, ry: h * 0.022 },
      { x: w * 0.48, y: horizonY + (h - horizonY) * 0.76, rx: w * 0.14, ry: h * 0.03 }
    ];
    for (const sp of specularPatches) {
      const specGrad = ctx.createRadialGradient(sp.x, sp.y, 2, sp.x, sp.y, sp.rx);
      specGrad.addColorStop(0, `rgba(251, 146, 60, ${0.14 * flicker})`);
      specGrad.addColorStop(1, "rgba(251, 146, 60, 0)");
      ctx.fillStyle = specGrad;
      ctx.beginPath();
      ctx.ellipse(sp.x, sp.y, sp.rx, sp.ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Coulées de métal en fusion dans les fissures du basalte
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const channels = [
      [
        { x: w * 0.03, y: horizonY + (h - horizonY) * 0.22 },
        { x: w * 0.17, y: horizonY + (h - horizonY) * 0.34 },
        { x: w * 0.14, y: horizonY + (h - horizonY) * 0.68 },
        { x: w * 0.38, y: h * 0.96 }
      ],
      [
        { x: w * 0.97, y: horizonY + (h - horizonY) * 0.20 },
        { x: w * 0.84, y: horizonY + (h - horizonY) * 0.36 },
        { x: w * 0.87, y: horizonY + (h - horizonY) * 0.66 },
        { x: w * 0.63, y: h * 0.96 }
      ]
    ];

    for (const pts of channels) {
      // Halo thermique diffus autour de la rigole
      ctx.strokeStyle = `rgba(194, 65, 12, ${0.34 * flicker})`;
      ctx.lineWidth = Math.max(18, w * 0.026);
      this.strokePolyline(ctx, pts);

      // Coulée orange-rouge en fusion
      ctx.strokeStyle = `rgba(249, 115, 22, ${0.88 * flicker})`;
      ctx.lineWidth = Math.max(6, w * 0.009);
      this.strokePolyline(ctx, pts);

      // Cœur chauffé à blanc/jaune
      ctx.strokeStyle = `rgba(254, 243, 199, ${0.9 * flicker})`;
      ctx.lineWidth = Math.max(2, w * 0.0028);
      this.strokePolyline(ctx, pts);
    }
    ctx.restore();

    // 5. Enclume de guerre massive en acier forgé noirci et ébréché (centre)
    const ax = w * 0.51;
    const ay = horizonY + (h - horizonY) * 0.28;
    const s = Math.min(w, h) / 480;

    ctx.save();
    ctx.translate(ax, ay);
    ctx.scale(s, s);

    // Ombre portée massive au sol
    ctx.fillStyle = "rgba(0, 0, 0, 0.72)";
    ctx.beginPath();
    ctx.ellipse(4, 24, 58, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Billot de bois cerclé de fer sous l'enclume
    ctx.fillStyle = "#1c1613";
    ctx.fillRect(-30, 8, 60, 16);
    ctx.strokeStyle = "#3f352f";
    ctx.lineWidth = 2;
    ctx.strokeRect(-30, 8, 60, 16);

    // Corps de l'enclume en acier noirci martelé
    const steelGrad = ctx.createLinearGradient(-42, -18, 46, 10);
    steelGrad.addColorStop(0, "#44403c");
    steelGrad.addColorStop(0.45, "#292524");
    steelGrad.addColorStop(1, "#141210");
    ctx.fillStyle = steelGrad;

    ctx.beginPath();
    ctx.moveTo(-40, -14);
    ctx.lineTo(28, -14);
    ctx.lineTo(52, -7); // Bigorne massive
    ctx.lineTo(25, -1);
    ctx.lineTo(20, 8);
    ctx.lineTo(-24, 8);
    ctx.lineTo(-28, -2);
    ctx.lineTo(-42, -5);
    ctx.closePath();
    ctx.fill();

    // Arête métallique supérieure avec reflets chauds et ébréchures
    ctx.strokeStyle = `rgba(251, 146, 60, ${0.55 * flicker})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-40, -14);
    ctx.lineTo(-12, -14);
    ctx.lineTo(-9, -12); // Ébréchure
    ctx.lineTo(-6, -14);
    ctx.lineTo(28, -14);
    ctx.lineTo(52, -7);
    ctx.stroke();
    ctx.restore();

    // 6. Fumée épaisse en profondeur
    for (const sm of this.forgeSmoke) {
      const sx = sm.x * w;
      const sy = sm.y * h;
      const g = ctx.createRadialGradient(sx, sy, 4, sx, sy, sm.r);
      g.addColorStop(0, `rgba(28, 25, 23, ${sm.alpha})`);
      g.addColorStop(1, "rgba(28, 25, 23, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(sx, sy, sm.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 7. Braises incandescentes avec profondeur de champ (flou sur premier plan)
    for (const e of this.forgeEmbers) {
      const ex = e.x * w;
      const ey = e.y * h;
      const radius = 1.2 * e.depth;
      ctx.save();
      if (e.depth > 1.4) {
        ctx.shadowColor = "#ea580c";
        ctx.shadowBlur = 8;
      }
      ctx.fillStyle = e.depth > 1.2
        ? `rgba(251, 146, 60, ${0.72 * flicker})`
        : `rgba(254, 215, 170, ${0.85 * flicker})`;
      ctx.beginPath();
      ctx.arc(ex, ey, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  /* =======================================================================
     ARÈNE 2 : LE CLOÎTRE DES RELIQUES BRISÉES (Gothique, Calcaire & Lune)
     ======================================================================= */
  renderCloitre(ctx) {
    const w = this.width;
    const h = this.height;
    const horizonY = h * 0.45;

    // 1. Ciel nocturne profond et brumeux
    const nightSky = ctx.createLinearGradient(0, 0, 0, horizonY);
    nightSky.addColorStop(0, "#05080f");
    nightSky.addColorStop(0.55, "#0f172a");
    nightSky.addColorStop(1, "#1e293b");
    ctx.fillStyle = nightSky;
    ctx.fillRect(0, 0, w, horizonY);

    // Halo lunaire diffus derrière l'abside effondrée
    const moonX = w * 0.48;
    const moonY = h * 0.14;
    const moonHalo = ctx.createRadialGradient(moonX, moonY, 6, moonX, moonY, w * 0.28);
    moonHalo.addColorStop(0, "rgba(226, 232, 240, 0.34)");
    moonHalo.addColorStop(0.35, "rgba(148, 163, 184, 0.12)");
    moonHalo.addColorStop(1, "rgba(15, 23, 42, 0)");
    ctx.fillStyle = moonHalo;
    ctx.fillRect(0, 0, w, horizonY + 80);

    // 2. Arches gothiques en pierre calcaire ancienne & brèches effondrées
    const archCenters = [w * 0.22, w * 0.48, w * 0.74];
    for (let i = 0; i < archCenters.length; i++) {
      const ax = archCenters[i];
      const aw = w * 0.20;
      const topY = h * 0.06;

      // Piliers latéraux en calcaire sombre
      ctx.fillStyle = "#192028";
      ctx.fillRect(ax - aw * 0.56, topY, aw * 0.14, horizonY - topY);
      ctx.fillRect(ax + aw * 0.42, topY, aw * 0.14, horizonY - topY);

      // Arc brisé gothique
      ctx.strokeStyle = "#2b3540";
      ctx.lineWidth = Math.max(6, w * 0.009);
      ctx.beginPath();
      ctx.moveTo(ax - aw * 0.49, horizonY * 0.62);
      ctx.quadraticCurveTo(ax - aw * 0.45, topY, ax - (i === 1 ? 6 : 0), topY - 4);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(ax + aw * 0.49, horizonY * 0.62);
      ctx.quadraticCurveTo(ax + aw * 0.45, topY, ax + (i === 1 ? 14 : 0), topY + (i === 1 ? 10 : -4));
      ctx.stroke();
    }

    // 3. Statues de chevaliers en pierre érodée dans les alcôves latérales
    const knightPositions = [w * 0.12, w * 0.88];
    for (let idx = 0; idx < knightPositions.length; idx++) {
      const kx = knightPositions[idx];
      const baseY = horizonY + 2;

      ctx.save();
      ctx.translate(kx, baseY);
      // Piédestal érodé
      ctx.fillStyle = "#1b222a";
      ctx.fillRect(-20, -18, 40, 18);
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 1;
      ctx.strokeRect(-20, -18, 40, 18);

      // Silhouette drapée du chevalier gisant debout
      ctx.fillStyle = "#26303b";
      ctx.beginPath();
      ctx.moveTo(-13, -18);
      ctx.lineTo(-10, -64);
      ctx.lineTo(0, -76);
      ctx.lineTo(10, -64);
      ctx.lineTo(13, -18);
      ctx.closePath();
      ctx.fill();

      // Épée longue tenue verticalement devant le torse
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(0, -56);
      ctx.lineTo(0, -22);
      ctx.moveTo(-6, -50);
      ctx.lineTo(6, -50);
      ctx.stroke();
      ctx.restore();
    }

    // 4. Sol en dalles de pierre calcaire ancienne couverte de mousse
    const limestonePattern = ctx.createPattern(this.textures.limestone, "repeat");
    ctx.fillStyle = limestonePattern || "#1c2229";
    ctx.fillRect(0, horizonY, w, h - horizonY);

    // Joints de dalles funéraires usées en perspective
    ctx.save();
    ctx.strokeStyle = "rgba(9, 13, 18, 0.65)";
    ctx.lineWidth = 1.5;
    const rows = 5;
    for (let r = 1; r <= rows; r++) {
      const t = Math.pow(r / rows, 1.35);
      const y = horizonY + t * (h - horizonY);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    const cols = 8;
    for (let c = 0; c <= cols; c++) {
      const topX = w * (0.15 + (c / cols) * 0.70);
      const botX = w * (-0.1 + (c / cols) * 1.20);
      ctx.beginPath();
      ctx.moveTo(topX, horizonY);
      ctx.lineTo(botX, h);
      ctx.stroke();
    }
    ctx.restore();

    // 5. Lumière lunaire froide et volumétrique filtrant à travers les arches
    const beams = [
      { topX: w * 0.45, topW: w * 0.11, botX: w * 0.36, botW: w * 0.24 },
      { topX: w * 0.68, topW: w * 0.08, botX: w * 0.64, botW: w * 0.19 }
    ];
    for (const b of beams) {
      const beamGrad = ctx.createLinearGradient(b.topX, h * 0.08, b.botX, h * 0.85);
      beamGrad.addColorStop(0, "rgba(226, 232, 240, 0.16)");
      beamGrad.addColorStop(0.6, "rgba(186, 230, 253, 0.07)");
      beamGrad.addColorStop(1, "rgba(186, 230, 253, 0)");
      ctx.fillStyle = beamGrad;
      ctx.beginPath();
      ctx.moveTo(b.topX - b.topW * 0.5, h * 0.08);
      ctx.lineTo(b.topX + b.topW * 0.5, h * 0.08);
      ctx.lineTo(b.botX + b.botW * 0.5, h * 0.88);
      ctx.lineTo(b.botX - b.botW * 0.5, h * 0.88);
      ctx.closePath();
      ctx.fill();
    }

    // 6. Nappes de brouillard dense au ras du sol
    for (const mist of this.groundMistLayers) {
      const y = mist.yRatio * h;
      const x = ((mist.offset % (w + 340)) + (w + 340)) % (w + 340) - 170;
      const mGrad = ctx.createLinearGradient(x - 160, y, x + 160, y);
      mGrad.addColorStop(0, "rgba(148, 163, 184, 0)");
      mGrad.addColorStop(0.5, `rgba(186, 200, 216, ${mist.alpha})`);
      mGrad.addColorStop(1, "rgba(148, 163, 184, 0)");
      ctx.fillStyle = mGrad;
      ctx.fillRect(0, y - mist.height * 0.5, w, mist.height);
    }

    // 7. Poussières en suspension dans les rayons lunaires
    for (const mote of this.dustMotes) {
      ctx.fillStyle = "rgba(226, 232, 240, 0.35)";
      ctx.beginPath();
      ctx.arc(mote.x * w, mote.y * h, mote.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* =======================================================================
     ARÈNE 3 : LA LICE DES BRUMES D'ORAGE (Boue, Palissades, Pluie & Éclairs)
     ======================================================================= */
  renderLice(ctx) {
    const w = this.width;
    const h = this.height;
    const horizonY = h * 0.43;
    const flashBoost = this.lightningIntensity * 0.38;

    // 1. Ciel d'orage lourd et tourmenté
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGrad.addColorStop(0, this.lightningIntensity > 0.2 ? "#1e293b" : "#070a10");
    skyGrad.addColorStop(0.55, this.lightningIntensity > 0.2 ? "#334155" : "#131b26");
    skyGrad.addColorStop(1, "#222b36");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, horizonY);

    // Nuages bas volumétriques
    for (let c = 0; c < 6; c++) {
      const cx = w * (0.1 + c * 0.17) + Math.sin(this.time * 0.25 + c) * 12;
      const cy = horizonY * (0.28 + (c % 2) * 0.18);
      const rad = w * 0.19;
      const cloudGrad = ctx.createRadialGradient(cx, cy, 8, cx, cy, rad);
      cloudGrad.addColorStop(0, `rgba(30, 41, 59, ${0.55 + flashBoost})`);
      cloudGrad.addColorStop(1, "rgba(15, 23, 42, 0)");
      ctx.fillStyle = cloudGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Éclair ramifié dans les nuages
    if (this.lightningIntensity > 0.05 && this.lightningBolt.length > 1) {
      ctx.save();
      ctx.strokeStyle = `rgba(241, 245, 249, ${this.lightningIntensity})`;
      ctx.lineWidth = 2.6;
      ctx.shadowColor = "#bae6fd";
      ctx.shadowBlur = 22;
      this.strokePolyline(ctx, this.lightningBolt);
      ctx.restore();
    }

    // Silhouette sombre de remparts et tribunes détrempées au loin
    ctx.fillStyle = "#0e131a";
    ctx.fillRect(w * 0.14, horizonY * 0.56, w * 0.72, horizonY * 0.44);
    // Tours d'angle
    ctx.fillRect(w * 0.11, horizonY * 0.36, w * 0.07, horizonY * 0.64);
    ctx.fillRect(w * 0.82, horizonY * 0.36, w * 0.07, horizonY * 0.64);

    // 2. Sol de tournoi boueux avec texture et ornières
    const mudPattern = ctx.createPattern(this.textures.mud, "repeat");
    ctx.fillStyle = mudPattern || "#1a1511";
    ctx.fillRect(0, horizonY, w, h - horizonY);

    // Ornières profondes creusées dans la boue
    ctx.save();
    ctx.strokeStyle = "rgba(8, 6, 5, 0.72)";
    ctx.lineWidth = 6;
    for (let r = 0; r < 4; r++) {
      const ry = horizonY + (h - horizonY) * (0.28 + r * 0.18);
      ctx.beginPath();
      ctx.moveTo(w * 0.05, ry);
      ctx.bezierCurveTo(w * 0.35, ry + 10, w * 0.65, ry - 8, w * 0.95, ry + 6);
      ctx.stroke();
    }
    ctx.restore();

    // 3. Flaques d'eau sombres reflétant le ciel d'orage et les éclairs
    const puddles = [
      { x: w * 0.25, y: horizonY + (h - horizonY) * 0.66, rx: w * 0.13, ry: h * 0.042 },
      { x: w * 0.52, y: horizonY + (h - horizonY) * 0.44, rx: w * 0.15, ry: h * 0.048 },
      { x: w * 0.76, y: horizonY + (h - horizonY) * 0.64, rx: w * 0.12, ry: h * 0.038 }
    ];

    for (const p of puddles) {
      ctx.save();
      const puddleGrad = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, p.rx);
      const skyReflAlpha = 0.24 + this.lightningIntensity * 0.42;
      puddleGrad.addColorStop(0, `rgba(148, 163, 184, ${skyReflAlpha})`);
      puddleGrad.addColorStop(0.7, `rgba(51, 65, 85, ${skyReflAlpha * 0.85})`);
      puddleGrad.addColorStop(1, "rgba(15, 23, 42, 0.1)");

      ctx.fillStyle = puddleGrad;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bordure humide sombre
      ctx.strokeStyle = "rgba(12, 10, 9, 0.75)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // 4. Palissades en bois sombre détrempé, ferrures rouillées et bannières déchirées
    const fenceBaseY = horizonY + 10;
    // Lisses horizontales en chêne noirci par la pluie
    ctx.fillStyle = "#1f1712";
    ctx.fillRect(0, fenceBaseY - 22, w, 6);
    ctx.fillRect(0, fenceBaseY - 10, w, 6);

    const posts = 11;
    for (let i = 0; i <= posts; i++) {
      const px = (w / posts) * i;
      // Pieu de bois sombre
      ctx.fillStyle = "#18110d";
      ctx.fillRect(px - 5, fenceBaseY - 34, 10, 36);
      // Ferrure rouillée sur le pieu
      ctx.fillStyle = "#452316";
      ctx.fillRect(px - 5, fenceBaseY - 23, 10, 3);

      // Bannières trempées et déchirées sur certains pieux
      if (i === 2 || i === 5 || i === 8) {
        const wind = Math.sin(this.time * 4.5 + i) * 5;
        ctx.fillStyle = i === 5 ? "#3f1515" : "#1e2631";
        ctx.beginPath();
        ctx.moveTo(px + 4, fenceBaseY - 30);
        ctx.lineTo(px + 26 + wind, fenceBaseY - 27);
        ctx.lineTo(px + 22 + wind * 1.2, fenceBaseY - 8);
        ctx.lineTo(px + 14 + wind * 0.8, fenceBaseY - 14);
        ctx.lineTo(px + 5, fenceBaseY - 6);
        ctx.closePath();
        ctx.fill();
      }
    }

    // 5. Pluie battante inclinée avec profondeur
    ctx.save();
    for (const drop of this.raindrops) {
      const rx = drop.x * w;
      const ry = drop.y * h;
      ctx.strokeStyle = `rgba(186, 202, 220, ${0.22 * drop.depth + flashBoost * 0.25})`;
      ctx.lineWidth = 0.9 * drop.depth;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - drop.len * 0.26, ry + drop.len);
      ctx.stroke();
    }
    ctx.restore();
  }

  strokePolyline(ctx, pts) {
    if (!pts || pts.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();
  }
}

window.RealisticMedievalArenas = RealisticMedievalArenas;
