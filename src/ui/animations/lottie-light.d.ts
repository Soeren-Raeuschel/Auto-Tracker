/**
 * Minimale Typen fuer die Light-Variante von lottie-web (T13.1).
 * Nur das, was die Komponente benoetigt - kein volles API.
 */
declare module 'lottie-web/build/player/lottie_light' {
  export interface LottieAnimationItem {
    play(): void;
    pause(): void;
    destroy(): void;
  }

  export interface LottieLoadParams {
    container: HTMLElement;
    loop: boolean;
    autoplay: boolean;
    animationData: unknown;
    renderer?: string;
  }

  const lottie: {
    loadAnimation(params: LottieLoadParams): LottieAnimationItem;
  };

  export default lottie;
}
