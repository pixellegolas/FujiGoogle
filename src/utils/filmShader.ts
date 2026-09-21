import { FilmRecipe } from '../types';

const VERTEX_SHADER_SRC = `
attribute vec2 a_position;
attribute vec2 a_texCoord;
varying vec2 v_texCoord;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_texCoord = a_texCoord;
}
`;

const FRAGMENT_SHADER_SRC = `
precision mediump float;
varying vec2 v_texCoord;
uniform sampler2D u_image;
uniform vec2 u_resolution;
uniform float u_time;

// Recipe Parameters
uniform float u_contrast;
uniform float u_exposure;
uniform float u_highlights;
uniform float u_shadows;
uniform float u_saturation;
uniform mat3 u_colorMatrix;
uniform vec2 u_wbShift;
uniform float u_grainAmount;
uniform float u_bloomAmount;
uniform float u_halationAmount;
uniform float u_isMonochrome;

// Pseudo-random noise for film grain
float rand(vec2 co) {
  return fract(sin(dot(co.xy ,vec2(12.9898, 78.233))) * 43758.5453);
}

// S-Curve tone mapping
float sCurve(float x, float c) {
  return 1.0 / (1.0 + exp(-c * (x - 0.5)));
}

void main() {
  vec2 uv = v_texCoord;
  vec4 baseColor = texture2D(u_image, uv);
  vec3 color = baseColor.rgb;

  // 1. Exposure adjustment
  color += u_exposure;

  // 2. White Balance Shift
  color.r += u_wbShift.x;
  color.b += u_wbShift.y;

  // 3. Color Matrix Transform (Film Emulsion Response)
  color = clamp(u_colorMatrix * color, 0.0, 1.0);

  // 4. Saturation
  float lum = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(vec3(lum), color, u_saturation);

  // 5. Halation Simulation (Warm orange-red glow around specular highlights)
  if (u_halationAmount > 0.01) {
    vec2 step = 1.5 / u_resolution;
    vec3 bloomSample = vec3(0.0);
    float hLum = 0.0;
    
    // Sample surrounding texels for specular highlight bleeding
    bloomSample += texture2D(u_image, uv + vec2(-step.x * 2.0, 0.0)).rgb * 0.2;
    bloomSample += texture2D(u_image, uv + vec2(step.x * 2.0, 0.0)).rgb * 0.2;
    bloomSample += texture2D(u_image, uv + vec2(0.0, -step.y * 2.0)).rgb * 0.2;
    bloomSample += texture2D(u_image, uv + vec2(0.0, step.y * 2.0)).rgb * 0.2;
    bloomSample += color * 0.2;

    float bLum = dot(bloomSample, vec3(0.299, 0.587, 0.114));
    if (bLum > 0.65) {
      float halFactor = (bLum - 0.65) / 0.35 * u_halationAmount;
      // Fujifilm / Kodak characteristic red-orange halation fringe
      vec3 halColor = vec3(1.0, 0.28, 0.08) * halFactor;
      color = screen(color, halColor);
    }
  }

  // 6. Bloom (Soft optical diffusion / Black Pro-Mist filter)
  if (u_bloomAmount > 0.01) {
    vec2 bStep = 3.0 / u_resolution;
    vec3 softSample = (
      texture2D(u_image, uv + vec2(-bStep.x, -bStep.y)).rgb +
      texture2D(u_image, uv + vec2(bStep.x, -bStep.y)).rgb +
      texture2D(u_image, uv + vec2(-bStep.x, bStep.y)).rgb +
      texture2D(u_image, uv + vec2(bStep.x, bStep.y)).rgb
    ) * 0.25;

    float softLum = dot(softSample, vec3(0.299, 0.587, 0.114));
    if (softLum > 0.5) {
      float bloomFactor = (softLum - 0.5) * u_bloomAmount * 0.8;
      color = mix(color, softSample, bloomFactor);
    }
  }

  // 7. Tone Curves (Highlights & Shadows S-Curve)
  color.r = mix(color.r, pow(color.r, u_contrast), 0.7);
  color.g = mix(color.g, pow(color.g, u_contrast), 0.7);
  color.b = mix(color.b, pow(color.b, u_contrast), 0.7);

  // Shadow lifting or crushing & Highlight roll-off
  if (u_shadows > 0.0) {
    color = mix(color, color + (1.0 - color) * u_shadows * 0.15, 1.0 - lum);
  } else if (u_shadows < 0.0) {
    color = mix(color, color * (1.0 + u_shadows * 0.3), 1.0 - lum);
  }

  if (u_highlights > 0.0) {
    color = mix(color, color * (1.0 + u_highlights * 0.25), lum);
  } else if (u_highlights < 0.0) {
    color = mix(color, color - color * (-u_highlights) * 0.15, lum);
  }

  // 8. Film Grain Synthesis
  if (u_grainAmount > 0.01) {
    // Grain is most visible in midtones (silver halide crystals)
    float midToneMask = 1.0 - abs(lum - 0.5) * 1.8;
    midToneMask = clamp(midToneMask, 0.1, 1.0);
    
    vec2 noiseCoord = uv * u_resolution + vec2(u_time * 12.0);
    float noise = (rand(noiseCoord) - 0.5) * 2.0;
    
    float grain = noise * u_grainAmount * midToneMask * 0.35;
    color += vec3(grain);
  }

  // 9. Monochrome check
  if (u_isMonochrome > 0.5) {
    float monoLum = dot(color, vec3(0.299, 0.587, 0.114));
    color = vec3(monoLum);
  }

  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}

// Utility Screen blend function helper
vec3 screen(vec3 a, vec3 b) {
  return 1.0 - (1.0 - a) * (1.0 - b);
}
`;

export class FilmWebGLRenderer {
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private texture: WebGLTexture | null = null;
  private positionBuffer: WebGLBuffer | null = null;
  private texCoordBuffer: WebGLBuffer | null = null;
  private uniforms: Record<string, WebGLUniformLocation | null> = {};

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true, alpha: false });
    if (!gl) {
      console.warn('WebGL not supported for FujiCam film shader');
      return;
    }
    this.gl = gl;
    this.initShaders();
  }

  private initShaders() {
    const gl = this.gl;
    if (!gl) return;

    const vShader = this.createShader(gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const fShader = this.createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
    if (!vShader || !fShader) return;

    const program = gl.createProgram();
    if (!program) return;

    gl.attachShader(program, vShader);
    gl.attachShader(program, fShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Shader program link error:', gl.getProgramInfoLog(program));
      return;
    }

    this.program = program;
    gl.useProgram(program);

    // Setup Quad geometry
    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
         1.0,  1.0,
      ]),
      gl.STATIC_DRAW
    );

    const aPos = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    this.texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
    // Texture coordinates (Y flipped for camera view)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        0.0, 1.0,
        1.0, 1.0,
        0.0, 0.0,
        0.0, 0.0,
        1.0, 1.0,
        1.0, 0.0,
      ]),
      gl.STATIC_DRAW
    );

    const aTex = gl.getAttribLocation(program, 'a_texCoord');
    gl.enableVertexAttribArray(aTex);
    gl.vertexAttribPointer(aTex, 2, gl.FLOAT, false, 0, 0);

    // Setup texture
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Cache uniforms
    const uniformNames = [
      'u_image', 'u_resolution', 'u_time', 'u_contrast', 'u_exposure',
      'u_highlights', 'u_shadows', 'u_saturation', 'u_colorMatrix',
      'u_wbShift', 'u_grainAmount', 'u_bloomAmount', 'u_halationAmount', 'u_isMonochrome'
    ];
    for (const name of uniformNames) {
      this.uniforms[name] = gl.getUniformLocation(program, name);
    }
  }

  private createShader(type: number, source: string): WebGLShader | null {
    const gl = this.gl;
    if (!gl) return null;
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  public render(
    source: TexImageSource,
    recipe: FilmRecipe,
    grainMultiplier = 1.0,
    bloomMultiplier = 1.0,
    halationMultiplier = 1.0,
    time = 0
  ) {
    const gl = this.gl;
    if (!gl || !this.program) return;

    gl.useProgram(this.program);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, source);
    } catch {
      // In case source is not ready
      return;
    }

    if (this.uniforms['u_image']) gl.uniform1i(this.uniforms['u_image'], 0);
    if (this.uniforms['u_resolution']) {
      gl.uniform2f(this.uniforms['u_resolution'], gl.canvas.width, gl.canvas.height);
    }
    if (this.uniforms['u_time']) gl.uniform1f(this.uniforms['u_time'], time);

    if (this.uniforms['u_contrast']) gl.uniform1f(this.uniforms['u_contrast'], recipe.contrast);
    if (this.uniforms['u_exposure']) gl.uniform1f(this.uniforms['u_exposure'], recipe.exposure);
    if (this.uniforms['u_highlights']) gl.uniform1f(this.uniforms['u_highlights'], recipe.highlights);
    if (this.uniforms['u_shadows']) gl.uniform1f(this.uniforms['u_shadows'], recipe.shadows);
    if (this.uniforms['u_saturation']) gl.uniform1f(this.uniforms['u_saturation'], recipe.saturation);

    if (this.uniforms['u_colorMatrix']) {
      gl.uniformMatrix3fv(this.uniforms['u_colorMatrix'], false, new Float32Array(recipe.colorMatrix));
    }
    if (this.uniforms['u_wbShift']) {
      gl.uniform2f(this.uniforms['u_wbShift'], recipe.wbShift.r, recipe.wbShift.b);
    }
    if (this.uniforms['u_grainAmount']) {
      gl.uniform1f(this.uniforms['u_grainAmount'], recipe.grainAmount * grainMultiplier);
    }
    if (this.uniforms['u_bloomAmount']) {
      gl.uniform1f(this.uniforms['u_bloomAmount'], recipe.bloomAmount * bloomMultiplier);
    }
    if (this.uniforms['u_halationAmount']) {
      gl.uniform1f(this.uniforms['u_halationAmount'], recipe.halationAmount * halationMultiplier);
    }
    if (this.uniforms['u_isMonochrome']) {
      gl.uniform1f(this.uniforms['u_isMonochrome'], recipe.isMonochrome ? 1.0 : 0.0);
    }

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  public destroy() {
    const gl = this.gl;
    if (!gl) return;
    if (this.program) gl.deleteProgram(this.program);
    if (this.texture) gl.deleteTexture(this.texture);
    if (this.positionBuffer) gl.deleteBuffer(this.positionBuffer);
    if (this.texCoordBuffer) gl.deleteBuffer(this.texCoordBuffer);
    this.gl = null;
  }
}

/**
 * Captures the best available photo source from the camera:
 * Uses ImageCapture API if available to capture full sensor resolution (12MP - 48MP),
 * falling back gracefully to the high-resolution video stream.
 */
export async function capturePhotoSource(
  video: HTMLVideoElement,
  stream: MediaStream | null
): Promise<{ source: HTMLVideoElement | ImageBitmap | HTMLCanvasElement; width: number; height: number }> {
  if (stream && 'ImageCapture' in window) {
    try {
      const track = stream.getVideoTracks()[0];
      if (track && track.readyState === 'live') {
        const imageCapture = new (window as any).ImageCapture(track);
        // Take full native sensor photo
        const blob: Blob = await imageCapture.takePhoto();
        const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
        if (bitmap.width > 0 && bitmap.height > 0) {
          return { source: bitmap, width: bitmap.width, height: bitmap.height };
        }
      }
    } catch (e) {
      console.log('ImageCapture failed, falling back to video frame:', e);
    }
  }

  // Fallback to HTMLVideoElement
  const vw = video.videoWidth || 1920;
  const vh = video.videoHeight || 1080;
  return { source: video, width: vw, height: vh };
}

/**
 * High-Resolution Photo Processor
 * Applies full quality Fujifilm emulation + Bloom + Halation + Organic Grain + Optional Fuji Stamp
 */
export async function processHighResPhoto(
  sourceImage: HTMLCanvasElement | HTMLVideoElement | ImageBitmap,
  recipe: FilmRecipe,
  options: {
    grainMultiplier?: number;
    bloomMultiplier?: number;
    halationMultiplier?: number;
    showDateStamp?: boolean;
    aspectRatio?: '3:2' | '4:3' | '1:1' | '16:9';
    orientation?: 'auto' | 'portrait' | 'landscape';
    iso?: number;
    shutter?: string;
    fStop?: string;
  } = {}
): Promise<{ dataUrl: string; width: number; height: number; sizeBytes: number }> {
  const {
    grainMultiplier = 1.0,
    bloomMultiplier = 1.0,
    halationMultiplier = 1.0,
    showDateStamp = true,
    aspectRatio = '3:2',
    orientation = 'auto',
    iso = 400,
    shutter = '1/250s',
    fStop = 'f/2.0',
  } = options;

  let srcW = (sourceImage as HTMLVideoElement).videoWidth || sourceImage.width;
  let srcH = (sourceImage as HTMLVideoElement).videoHeight || sourceImage.height;

  if (!srcW || !srcH) {
    srcW = 1080;
    srcH = 1920;
  }

  // Determine whether the target photo is portrait or landscape
  const isDevicePortrait = typeof window !== 'undefined'
    ? (window.innerHeight > window.innerWidth)
    : false;

  const isPortrait =
    orientation === 'portrait'
      ? true
      : orientation === 'landscape'
      ? false
      : (srcH > srcW || isDevicePortrait);

  // Calculate target aspect ratio (width / height)
  let targetRatio: number;
  if (isPortrait) {
    switch (aspectRatio) {
      case '4:3':
        targetRatio = 3 / 4; // 0.75
        break;
      case '1:1':
        targetRatio = 1 / 1; // 1.0
        break;
      case '16:9':
        targetRatio = 9 / 16; // 0.5625
        break;
      case '3:2':
      default:
        targetRatio = 2 / 3; // 0.66667
        break;
    }
  } else {
    switch (aspectRatio) {
      case '4:3':
        targetRatio = 4 / 3;
        break;
      case '1:1':
        targetRatio = 1 / 1;
        break;
      case '16:9':
        targetRatio = 16 / 9;
        break;
      case '3:2':
      default:
        targetRatio = 3 / 2;
        break;
    }
  }

  // Calculate crop dimensions
  let cropW = srcW;
  let cropH = Math.round(srcW / targetRatio);

  if (cropH > srcH) {
    cropH = srcH;
    cropW = Math.round(srcH * targetRatio);
  }

  // Boundary check
  if (cropW > srcW) {
    cropW = srcW;
    cropH = Math.round(srcW / targetRatio);
  }

  const cropX = Math.floor((srcW - cropW) / 2);
  const cropY = Math.floor((srcH - cropH) / 2);

  // High-res output canvas
  const canvas = document.createElement('canvas');
  canvas.width = cropW;
  canvas.height = cropH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  // Draw base cropped image
  ctx.drawImage(sourceImage, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

  // 1. Get pixel data for color matrix, tone curves and base film transformation
  const imgData = ctx.getImageData(0, 0, cropW, cropH);
  const data = imgData.data;
  const len = data.length;

  const m = recipe.colorMatrix;
  const wbR = recipe.wbShift.r * 255;
  const wbB = recipe.wbShift.b * 255;
  const contrast = recipe.contrast;
  const saturation = recipe.saturation;
  const highlights = recipe.highlights;
  const shadows = recipe.shadows;
  const isMono = recipe.isMonochrome;

  // Pixel manipulation pass
  for (let i = 0; i < len; i += 4) {
    let r = data[i] + wbR;
    let g = data[i + 1];
    let b = data[i + 2] + wbB;

    // Color Matrix
    const nr = m[0] * r + m[1] * g + m[2] * b;
    const ng = m[3] * r + m[4] * g + m[5] * b;
    const nb = m[6] * r + m[7] * g + m[8] * b;

    r = Math.max(0, Math.min(255, nr));
    g = Math.max(0, Math.min(255, ng));
    b = Math.max(0, Math.min(255, nb));

    // Saturation
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    r = lum + saturation * (r - lum);
    g = lum + saturation * (g - lum);
    b = lum + saturation * (b - lum);

    // Contrast Curve
    r = 255 * Math.pow(Math.max(0, r / 255), contrast);
    g = 255 * Math.pow(Math.max(0, g / 255), contrast);
    b = 255 * Math.pow(Math.max(0, b / 255), contrast);

    // Highlights & Shadows adjustment
    const normLum = lum / 255;
    if (shadows > 0) {
      const boost = (1 - normLum) * shadows * 30;
      r += boost; g += boost; b += boost;
    } else if (shadows < 0) {
      const crush = 1 + shadows * 0.35 * (1 - normLum);
      r *= crush; g *= crush; b *= crush;
    }

    if (highlights > 0) {
      const lift = 1 + highlights * 0.25 * normLum;
      r *= lift; g *= lift; b *= lift;
    } else if (highlights < 0) {
      const roll = (1 - normLum) * (-highlights) * 20;
      r -= roll; g -= roll; b -= roll;
    }

    if (isMono) {
      const mono = 0.299 * r + 0.587 * g + 0.114 * b;
      r = mono; g = mono; b = mono;
    }

    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }
  ctx.putImageData(imgData, 0, 0);

  // 2. Halation pass (Warm red glow around specular highlights)
  const halationAmount = recipe.halationAmount * halationMultiplier;
  if (halationAmount > 0.05) {
    const halCanvas = document.createElement('canvas');
    const scaleDown = 4;
    halCanvas.width = Math.floor(cropW / scaleDown);
    halCanvas.height = Math.floor(cropH / scaleDown);
    const halCtx = halCanvas.getContext('2d');
    if (halCtx) {
      halCtx.drawImage(canvas, 0, 0, halCanvas.width, halCanvas.height);
      const halData = halCtx.getImageData(0, 0, halCanvas.width, halCanvas.height);
      const hPix = halData.data;
      for (let j = 0; j < hPix.length; j += 4) {
        const l = 0.299 * hPix[j] + 0.587 * hPix[j + 1] + 0.114 * hPix[j + 2];
        if (l > 175) {
          // Intense warm red-orange halation color
          const factor = (l - 175) / 80;
          hPix[j] = 255 * factor;
          hPix[j + 1] = 60 * factor;
          hPix[j + 2] = 20 * factor;
          hPix[j + 3] = 255 * factor;
        } else {
          hPix[j + 3] = 0;
        }
      }
      halCtx.putImageData(halData, 0, 0);

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.filter = `blur(${Math.max(4, Math.round(cropW * 0.008))}px)`;
      ctx.globalAlpha = Math.min(0.85, halationAmount * 1.5);
      ctx.drawImage(halCanvas, 0, 0, cropW, cropH);
      ctx.restore();
    }
  }

  // 3. Bloom / Black Pro-Mist Diffusion
  const bloomAmount = recipe.bloomAmount * bloomMultiplier;
  if (bloomAmount > 0.05) {
    const bloomCanvas = document.createElement('canvas');
    const scaleDown = 6;
    bloomCanvas.width = Math.floor(cropW / scaleDown);
    bloomCanvas.height = Math.floor(cropH / scaleDown);
    const bCtx = bloomCanvas.getContext('2d');
    if (bCtx) {
      bCtx.drawImage(canvas, 0, 0, bloomCanvas.width, bloomCanvas.height);
      const bData = bCtx.getImageData(0, 0, bloomCanvas.width, bloomCanvas.height);
      const bPix = bData.data;
      for (let j = 0; j < bPix.length; j += 4) {
        const l = 0.299 * bPix[j] + 0.587 * bPix[j + 1] + 0.114 * bPix[j + 2];
        if (l < 150) {
          bPix[j + 3] = 0;
        } else {
          bPix[j + 3] = (l - 150) * 1.2;
        }
      }
      bCtx.putImageData(bData, 0, 0);

      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.filter = `blur(${Math.max(8, Math.round(cropW * 0.015))}px)`;
      ctx.globalAlpha = Math.min(0.7, bloomAmount * 1.3);
      ctx.drawImage(bloomCanvas, 0, 0, cropW, cropH);
      ctx.restore();
    }
  }

  // 4. Organic Silver Halide Film Grain
  const grainAmount = recipe.grainAmount * grainMultiplier;
  if (grainAmount > 0.05) {
    const grainCanvas = document.createElement('canvas');
    const gScale = 2;
    grainCanvas.width = Math.floor(cropW / gScale);
    grainCanvas.height = Math.floor(cropH / gScale);
    const gCtx = grainCanvas.getContext('2d');
    if (gCtx) {
      const gImgData = gCtx.createImageData(grainCanvas.width, grainCanvas.height);
      const gData = gImgData.data;
      for (let k = 0; k < gData.length; k += 4) {
        const val = Math.random() * 255;
        gData[k] = val;
        gData[k + 1] = val;
        gData[k + 2] = val;
        gData[k + 3] = 255;
      }
      gCtx.putImageData(gImgData, 0, 0);

      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = Math.min(0.45, grainAmount * 0.9);
      ctx.drawImage(grainCanvas, 0, 0, cropW, cropH);
      ctx.restore();
    }
  }

  // 5. Minimalist Fujifilm Aesthetic Stamp (optional date & recipe stamp in bottom right)
  if (showDateStamp) {
    ctx.save();
    const d = new Date();
    const dateStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    const stampText = `FUJICAM • ${recipe.name.toUpperCase()} • ISO ${iso} • ${dateStr}`;

    const fontSize = Math.max(12, Math.round(Math.min(cropW, cropH) * 0.024));
    ctx.font = `600 ${fontSize}px 'JetBrains Mono', monospace`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;

    const padX = Math.round(cropW * 0.04);
    const padY = Math.round(cropH * 0.04);
    ctx.fillText(stampText, padX, cropH - padY);
    ctx.restore();
  }

  // High quality JPEG output
  const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
  const sizeBytes = Math.round((dataUrl.length * 3) / 4);

  return {
    dataUrl,
    width: cropW,
    height: cropH,
    sizeBytes,
  };
}
