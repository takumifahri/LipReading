'use client';

import { useEffect, useRef, useState } from 'react';

export default function CharacterLottie({ src = '/character.json', label = 'Speaking character animation' }) {
  const canvasRef = useRef(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let frameId;

    async function loadImage(asset) {
      const image = new Image();
      image.decoding = 'async';
      image.src = `${asset.u || ''}${asset.p}`;
      await image.decode();
      return image;
    }

    async function renderLottie() {
      try {
        const response = await fetch(src);
        if (!response.ok) throw new Error('Unable to load Lottie asset');

        const animation = await response.json();
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');
        if (!canvas || !context) return;

        canvas.width = animation.w;
        canvas.height = animation.h;

        const imageAssets = new Map(
          await Promise.all(
            animation.assets
              .filter((asset) => asset.p)
              .map(async (asset) => [asset.id, await loadImage(asset)])
          )
        );

        const layers = animation.layers
          .filter((layer) => layer.ty === 2 && imageAssets.has(layer.refId))
          .slice()
          .reverse();

        const duration = animation.op - animation.ip;
        const frameRate = animation.fr || 30;
        const startTime = performance.now();

        const draw = (now) => {
          if (cancelled) return;

          const frame = animation.ip + (((now - startTime) / 1000) * frameRate) % duration;
          context.clearRect(0, 0, canvas.width, canvas.height);

          for (const layer of layers) {
            if (frame < layer.ip || frame >= layer.op) continue;

            const image = imageAssets.get(layer.refId);
            const position = layer.ks.p.k;
            const anchor = layer.ks.a.k;
            const scale = layer.ks.s.k;
            const opacity = (layer.ks.o.k ?? 100) / 100;
            const width = image.width * (scale[0] / 100);
            const height = image.height * (scale[1] / 100);

            context.globalAlpha = opacity;
            context.drawImage(
              image,
              position[0] - anchor[0] * (scale[0] / 100),
              position[1] - anchor[1] * (scale[1] / 100),
              width,
              height
            );
          }

          context.globalAlpha = 1;
          frameId = requestAnimationFrame(draw);
        };

        frameId = requestAnimationFrame(draw);
      } catch {
        if (!cancelled) setHasError(true);
      }
    }

    renderLottie();

    return () => {
      cancelled = true;
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [src]);

  if (hasError) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-md border border-white/10 bg-white/[0.06] text-sm font-bold text-white/45">
        Animation unavailable
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      aria-label={label}
      className="aspect-square w-full"
      role="img"
    />
  );
}
