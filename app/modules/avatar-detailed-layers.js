// Focused Canvas drawing layers (torso, attire, back/front hair, accessories)
// for the Detailed Realistic 2.5D portrait renderer.

export function drawRoundedRectPath(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

export function hexToRgba(hex, alpha) {
  const clean = String(hex || '').replace('#', '');
  if (clean.length !== 6) return `rgba(180, 110, 100, ${alpha})`;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function resolveHairStyle(style, gender) {
  const female = ['bob', 'ponytail', 'bun', 'layered', 'pixie'];
  const male = ['quiff', 'parted', 'spiky', 'slick', 'curly'];
  if (gender === 'female' && male.includes(style)) return female[male.indexOf(style) % female.length];
  if (gender === 'male' && female.includes(style)) return male[female.indexOf(style) % male.length];
  return style || (gender === 'female' ? 'layered' : 'parted');
}

export function drawHairBack(ctx, style, hairGrad, hairDark) {
  ctx.save();
  ctx.fillStyle = hairGrad;
  if (style === 'bob') {
    ctx.beginPath();
    ctx.moveTo(156, 225);
    ctx.bezierCurveTo(148, 102, 210, 62, 280, 62);
    ctx.bezierCurveTo(350, 62, 412, 102, 404, 225);
    ctx.bezierCurveTo(414, 304, 396, 362, 366, 376);
    ctx.lineTo(194, 376);
    ctx.bezierCurveTo(164, 362, 146, 304, 156, 225);
    ctx.fill();
  } else if (style === 'layered') {
    ctx.beginPath();
    ctx.moveTo(146, 228);
    ctx.bezierCurveTo(140, 96, 206, 56, 280, 56);
    ctx.bezierCurveTo(354, 56, 420, 96, 414, 228);
    ctx.bezierCurveTo(426, 330, 408, 394, 374, 412);
    ctx.lineTo(186, 412);
    ctx.bezierCurveTo(152, 394, 134, 330, 146, 228);
    ctx.fill();
  } else if (style === 'ponytail') {
    ctx.beginPath();
    ctx.moveTo(354, 144);
    ctx.bezierCurveTo(424, 156, 442, 258, 404, 338);
    ctx.bezierCurveTo(382, 302, 376, 238, 362, 198);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(280, 178, 128, 114, 0, Math.PI, Math.PI * 2);
    ctx.fill();
  } else if (style === 'bun') {
    ctx.beginPath();
    ctx.arc(280, 64, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hairDark;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(280, 64, 32, 0.3, Math.PI * 1.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(280, 176, 126, 110, 0, Math.PI, Math.PI * 2);
    ctx.fill();
  } else if (style === 'curly') {
    for (const [cx, cy, r] of [[186, 138, 34], [374, 138, 34], [168, 186, 30], [392, 186, 30]]) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

export function drawShouldersAndAttire(ctx, { meta, palette, skin, breathY }) {
  const accent = palette.accent || '#38bdf8';
  const badgeText = meta?.badgeText || 'AI';

  ctx.save();
  ctx.translate(0, breathY);

  ctx.shadowColor = 'rgba(15, 23, 42, 0.28)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;

  const suitGrad = ctx.createLinearGradient(110, 360, 450, 580);
  suitGrad.addColorStop(0, palette.suitA || '#2563eb');
  suitGrad.addColorStop(1, palette.suitB || '#1e3a8a');

  ctx.fillStyle = suitGrad;
  ctx.beginPath();
  ctx.moveTo(46, 580);
  ctx.bezierCurveTo(58, 434, 136, 376, 280, 376);
  ctx.bezierCurveTo(424, 376, 502, 434, 514, 580);
  ctx.closePath();
  ctx.fill();

  ctx.shadowColor = 'transparent';

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.24)';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(74, 515);
  ctx.bezierCurveTo(96, 424, 152, 386, 218, 381);
  ctx.stroke();

  if (meta?.persona === 'tech') {
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(214, 382);
    ctx.quadraticCurveTo(280, 434, 346, 382);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(226, 232, 240, 0.55)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(246, 396);
    ctx.lineTo(258, 514);
    ctx.moveTo(314, 396);
    ctx.lineTo(302, 514);
    ctx.stroke();

    drawRoundedRectPath(ctx, 230, 492, 100, 40, 12);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.62)';
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.font = '800 20px ui-monospace, SFMono-Regular, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, 280, 513);
  } else {
    ctx.fillStyle = '#fcfaf7';
    ctx.beginPath();
    ctx.moveTo(222, 376);
    ctx.lineTo(280, 488);
    ctx.lineTo(338, 376);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(15, 23, 42, 0.14)';
    ctx.beginPath();
    ctx.moveTo(206, 382);
    ctx.lineTo(244, 466);
    ctx.lineTo(224, 520);
    ctx.lineTo(192, 435);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(354, 382);
    ctx.lineTo(316, 466);
    ctx.lineTo(336, 520);
    ctx.lineTo(368, 435);
    ctx.closePath();
    ctx.fill();

    if (meta?.tie) {
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.moveTo(270, 392);
      ctx.lineTo(290, 392);
      ctx.lineTo(296, 484);
      ctx.lineTo(280, 506);
      ctx.lineTo(264, 484);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(280, 436, 8.5, 0, Math.PI * 2);
      ctx.fill();
    }

    drawRoundedRectPath(ctx, 342, 492, 62, 30, 10);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.34)';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 16px "Plus Jakarta Sans", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, 373, 508);
  }

  const neckGrad = ctx.createLinearGradient(280, 326, 280, 405);
  neckGrad.addColorStop(0, skin.mid);
  neckGrad.addColorStop(0.55, skin.mid);
  neckGrad.addColorStop(1, skin.shadow);
  ctx.fillStyle = neckGrad;
  drawRoundedRectPath(ctx, 244, 326, 72, 78, 30);
  ctx.fill();

  const jawShade = ctx.createLinearGradient(280, 338, 280, 384);
  jawShade.addColorStop(0, hexToRgba(skin.shadow, 0.34));
  jawShade.addColorStop(0.55, hexToRgba(skin.shadow, 0.10));
  jawShade.addColorStop(1, hexToRgba(skin.shadow, 0));
  ctx.fillStyle = jawShade;
  drawRoundedRectPath(ctx, 244, 336, 72, 50, 22);
  ctx.fill();

  ctx.restore();
}

export function drawHairFrontAndAccessories(ctx, { meta, appearance, palette, style, dna = null }) {
  const hairA = palette.hairA || '#4b3123';
  const hairB = palette.hairB || '#22140c';
  const shine = palette.shine || 'rgba(255,255,255,0.22)';

  const hairGrad = ctx.createLinearGradient(170, 68, 390, 260);
  hairGrad.addColorStop(0, hairA);
  hairGrad.addColorStop(1, hairB);

  ctx.save();
  ctx.fillStyle = hairGrad;

  if (style === 'bob' || style === 'layered') {
    ctx.beginPath();
    ctx.moveTo(160, 212);
    ctx.bezierCurveTo(162, 102, 218, 68, 286, 68);
    ctx.bezierCurveTo(352, 68, 404, 104, 402, 206);
    ctx.bezierCurveTo(368, 152, 330, 128, 288, 134);
    ctx.bezierCurveTo(238, 140, 198, 162, 160, 212);
    ctx.fill();
  } else if (style === 'pixie') {
    ctx.beginPath();
    ctx.moveTo(164, 202);
    ctx.bezierCurveTo(166, 98, 224, 66, 284, 68);
    ctx.bezierCurveTo(346, 70, 396, 106, 396, 196);
    ctx.bezierCurveTo(368, 138, 330, 120, 294, 128);
    ctx.lineTo(256, 156);
    ctx.bezierCurveTo(222, 136, 192, 154, 164, 202);
    ctx.fill();
  } else if (style === 'ponytail' || style === 'bun') {
    ctx.beginPath();
    ctx.moveTo(162, 204);
    ctx.bezierCurveTo(166, 104, 218, 70, 280, 70);
    ctx.bezierCurveTo(342, 70, 396, 104, 398, 204);
    ctx.bezierCurveTo(358, 142, 314, 122, 280, 122);
    ctx.bezierCurveTo(246, 122, 202, 142, 162, 204);
    ctx.fill();
  } else if (style === 'quiff') {
    ctx.beginPath();
    ctx.moveTo(162, 208);
    ctx.bezierCurveTo(154, 100, 214, 48, 290, 50);
    ctx.bezierCurveTo(366, 52, 408, 102, 396, 204);
    ctx.bezierCurveTo(374, 146, 332, 118, 276, 124);
    ctx.bezierCurveTo(222, 129, 188, 154, 162, 208);
    ctx.fill();
  } else if (style === 'spiky') {
    ctx.beginPath();
    ctx.moveTo(164, 204);
    ctx.lineTo(176, 116);
    ctx.lineTo(212, 82);
    ctx.lineTo(244, 52);
    ctx.lineTo(278, 74);
    ctx.lineTo(312, 48);
    ctx.lineTo(342, 82);
    ctx.lineTo(382, 108);
    ctx.lineTo(396, 202);
    ctx.bezierCurveTo(364, 144, 326, 122, 280, 126);
    ctx.bezierCurveTo(234, 122, 194, 146, 164, 204);
    ctx.fill();
  } else if (style === 'slick') {
    ctx.beginPath();
    ctx.moveTo(164, 200);
    ctx.bezierCurveTo(166, 98, 218, 72, 280, 72);
    ctx.bezierCurveTo(342, 72, 394, 98, 396, 200);
    ctx.bezierCurveTo(364, 134, 324, 118, 280, 118);
    ctx.bezierCurveTo(236, 118, 196, 134, 164, 200);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(164, 206);
    ctx.bezierCurveTo(164, 100, 220, 68, 280, 68);
    ctx.bezierCurveTo(344, 68, 398, 102, 396, 206);
    ctx.bezierCurveTo(362, 146, 324, 128, 298, 128);
    ctx.lineTo(288, 158);
    ctx.lineTo(266, 128);
    ctx.bezierCurveTo(222, 134, 188, 160, 164, 206);
    ctx.fill();
  }

  const strandShift = ((dna?.hairSeed || 0) % 21) - 10;
  ctx.strokeStyle = shine;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(208 + strandShift * 0.4, 104);
  ctx.quadraticCurveTo(278 + strandShift, 76, 344 - strandShift * 0.4, 102);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(186 + strandShift * 0.3, 122);
  ctx.quadraticCurveTo(278 + strandShift * 0.6, 62, 374 - strandShift * 0.3, 122);
  ctx.stroke();
  ctx.restore();

  const glasses = appearance?.glasses || meta?.glasses || 'none';
  if (glasses !== 'none') {
    ctx.save();
    const frameCol = glasses === 'executive' ? '#78350f' : glasses === 'round' ? '#475569' : '#1e293b';
    ctx.strokeStyle = frameCol;
    ctx.lineWidth = 4.2;
    const drawLens = (cx) => {
      if (glasses === 'round') {
        ctx.beginPath();
        ctx.arc(cx, 232, 34, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fill();
        ctx.stroke();
      } else {
        drawRoundedRectPath(ctx, cx - 36, 206, 72, 48, 13);
        ctx.fillStyle = 'rgba(186, 230, 253, 0.09)';
        ctx.fill();
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(cx - 18, 214);
      ctx.lineTo(cx - 4, 232);
      ctx.stroke();
      ctx.strokeStyle = frameCol;
      ctx.lineWidth = 4.2;
    };
    drawLens(231);
    drawLens(329);
    ctx.beginPath();
    ctx.moveTo(266, 229);
    ctx.lineTo(294, 229);
    ctx.moveTo(166, 228);
    ctx.lineTo(195, 228);
    ctx.moveTo(365, 228);
    ctx.lineTo(394, 228);
    ctx.stroke();
    ctx.restore();
  }

  if (meta?.headset === 'studio') {
    ctx.save();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(156, 232);
    ctx.bezierCurveTo(152, 92, 210, 56, 280, 56);
    ctx.bezierCurveTo(350, 56, 408, 92, 404, 232);
    ctx.stroke();

    for (const cx of [144, 384]) {
      drawRoundedRectPath(ctx, cx, 200, 32, 74, 15);
      ctx.fillStyle = palette.accent || '#38bdf8';
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 4;
      ctx.stroke();
    }
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(396, 268);
    ctx.quadraticCurveTo(378, 312, 316, 316);
    ctx.stroke();
    ctx.restore();
  }
}
