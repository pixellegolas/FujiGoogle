export interface FilmRecipe {
  id: string;
  name: string;
  shortCode: string;
  year?: string;
  author?: string;
  category?: 'featured' | 'kodak' | 'fuji' | 'cinema-mono';
  description: string;
  baseFilm: string;
  // Tone & Color Grading
  contrast: number; // e.g. 1.0 = normal, 1.2 = high
  exposure: number; // -0.5 to +0.5
  highlights: number; // -1 to +1
  shadows: number; // -1 to +1
  saturation: number; // 0.0 to 2.0
  colorMatrix: [
    number, number, number, // R weights
    number, number, number, // G weights
    number, number, number  // B weights
  ];
  wbShift: { r: number; b: number }; // White balance red/blue shift
  // Optical & Analog Texture
  grainAmount: number; // 0.0 - 0.6
  grainRoughness: number; // 0.2 - 0.8
  bloomAmount: number; // 0.0 - 0.5 (Black Pro-Mist diffusion)
  halationAmount: number; // 0.0 - 0.6 (Warm red glow on specular highlights)
  isMonochrome?: boolean;
  monoFilter?: 'none' | 'red' | 'green' | 'yellow';
}

export interface CapturedPhoto {
  id: string;
  dataUrl: string;
  folderId: string;
  folderName: string;
  timestamp: number;
  recipeId: string;
  recipeName: string;
  width: number;
  height: number;
  sizeBytes: number;
  aperture: string;
  shutter: string;
  iso: number;
}

export interface PhotoFolder {
  id: string;
  name: string;
  createdAt: number;
}

export interface CameraSettings {
  livePreviewRecipe: boolean;
  activeRecipeId: string;
  activeFolderId: string;
  grainMultiplier: number;
  bloomMultiplier: number;
  halationMultiplier: number;
  showDateStamp: boolean;
  gridOverlay: 'rule-of-thirds' | 'crosshair' | 'none';
  aspectRatio: '3:2' | '4:3' | '1:1' | '16:9';
  orientationLock?: 'auto' | 'portrait' | 'landscape';
  shutterSound: boolean;
  cameraFacing: 'environment' | 'user';
}

export interface HistogramData {
  r: number[];
  g: number[];
  b: number[];
  lum: number[];
  max: number;
}
