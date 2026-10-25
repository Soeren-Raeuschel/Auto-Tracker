import { useEffect, useRef, useState } from 'react';
import type { LottieAnimationItem } from 'lottie-web/build/player/lottie_light';
import { Icon } from '../components/Icon';
import { getAnimationDefinition, shouldAnimate, type AnimationId } from './animationCatalog';
import { useReducedMotion } from './useReducedMotion';
import './LottieAnimation.css';

/** Lazy geladene Animations-JSONs aus src/assets/animations (keine externen URLs). */
const ANIMATION_FILES = import.meta.glob('../../assets/animations/*.json') as Record<
  string,
  () => Promise<{ default: unknown }>
>;

let lottiePromise: ReturnType<typeof loadLottieInternal> | null = null;

function loadLottieInternal() {
  return import('lottie-web/build/player/lottie_light');
}

/** Laedt lottie_light erst beim ersten Bedarf (dynamischer Import, T13.1). */
function loadLottie() {
  lottiePromise ??= loadLottieInternal();
  return lottiePromise;
}

async function loadAnimationData(file: string): Promise<unknown | null> {
  const path = Object.keys(ANIMATION_FILES).find((key) => key.endsWith(`/${file}`));
  if (!path) return null;
  try {
    const loader = ANIMATION_FILES[path];
    if (!loader) return null;
    const module = await loader();
    return module.default;
  } catch {
    return null; // Kaputte Datei: Ersatz-Icon statt Absturz.
  }
}

export interface LottieAnimationProps {
  animation: AnimationId;
  className?: string;
}

/**
 * Lottie-Animation mit Ersatz-Icon (T13.1/T13.2). Bei Reduced Motion, ohne
 * registrierte Datei oder bei Ladefehler erscheint nur das Fallback-Icon.
 * Dekorativ: aria-hidden. Pausiert ausserhalb des Sichtbereichs und bei
 * verstecktem Tab (Grenzen laut DESIGN.md).
 */
export function LottieAnimation({ animation, className }: LottieAnimationProps) {
  const reduced = useReducedMotion();
  const definition = getAnimationDefinition(animation);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [animationItem, setAnimationItem] = useState<LottieAnimationItem | null>(null);

  useEffect(() => {
    if (!definition || !shouldAnimate(reduced, definition)) return;
    let cancelled = false;
    let item: LottieAnimationItem | null = null;

    void (async () => {
      const data = await loadAnimationData(definition.file);
      if (!data || cancelled || !containerRef.current) return;
      try {
        const lottie = (await loadLottie()).default;
        if (cancelled || !containerRef.current) return;
        item = lottie.loadAnimation({
          container: containerRef.current,
          loop: definition.loop,
          autoplay: true,
          animationData: data,
          renderer: 'svg',
        });
        setAnimationItem(item);
      } catch {
        /* Ladefehler: container bleibt leer, Ersatz-Icon erscheint unten. */
      }
    })();

    return () => {
      cancelled = true;
      item?.destroy();
      setAnimationItem(null);
    };
  }, [definition, reduced]);

  // Pausieren ausserhalb des Sichtbereichs und bei verstecktem Tab.
  useEffect(() => {
    const container = containerRef.current;
    if (!animationItem || !container) return;

    const visible = () => document.visibilityState === 'visible' && container.offsetParent !== null;
    const sync = () => (visible() ? animationItem.play() : animationItem.pause());

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) sync();
      else animationItem.pause();
    });
    observer.observe(container);
    document.addEventListener('visibilitychange', sync);
    sync();

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, [animationItem]);

  const animate = definition !== null && shouldAnimate(reduced, definition);

  return (
    <span
      className={className ? `lottie-animation ${className}` : 'lottie-animation'}
      aria-hidden="true"
    >
      <span
        ref={containerRef}
        className="lottie-animation__stage"
        data-active={animate || undefined}
      />
      {/* Ersatz-Icon: solange keine Datei existiert, das einzige Sichtbare. */}
      {!animate || !animationItem ? (
        <span className="lottie-animation__fallback">
          <Icon name={definition?.fallbackIcon ?? 'check'} />
        </span>
      ) : null}
    </span>
  );
}
