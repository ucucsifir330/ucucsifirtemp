export const MEDIA = {
  audio: {
    soundtrackM4a: "/media/audio/pure-system-silence.m4a",
    soundtrackMp3: "/media/audio/pure-system-silence.mp3",
  },
  backgrounds: {
    cosmicField: "/media/backgrounds/cosmic-field.png",
    vortexTexture: "/media/backgrounds/vortex-texture.png",
  },
  brand: {
    logo: "/media/brand/uc-uc-sifir-logo.png",
  },
  decorations: {
    marbledOrb: "/media/decorations/marbled-orb.png",
  },
  hero: {
    abstractSculpture: "/media/hero/abstract-sculpture.png",
    floatingCube: "/media/hero/floating-cube.png",
    modelPoster: "/media/hero/hero-model-poster.png",
    modelVideo: "/media/hero/hero-model.webm",
    ringedPlanet: "/media/hero/ringed-planet.png",
  },
} as const;

export const HERO_FLOATING_VISUALS = [
  MEDIA.hero.abstractSculpture,
  MEDIA.hero.ringedPlanet,
] as const;
