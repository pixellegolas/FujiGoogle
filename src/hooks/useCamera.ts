import { useEffect, useRef, useState, useCallback } from 'react';
import { createSimulatedCameraCanvas } from '../utils/testStream';

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const simCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const simStopRef = useRef<(() => void) | null>(null);

  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isSimulated, setIsSimulated] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const stopActiveStream = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (simStopRef.current) {
      simStopRef.current();
      simStopRef.current = null;
    }
  }, [stream]);

  const startSimulation = useCallback(() => {
    stopActiveStream();
    const isPortrait = typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : false;
    const simW = isPortrait ? 1080 : 1920;
    const simH = isPortrait ? 1920 : 1080;
    const sim = createSimulatedCameraCanvas(simW, simH);
    sim.start();
    simCanvasRef.current = sim.canvas;
    simStopRef.current = sim.stop;

    const canvasStream = sim.canvas.captureStream(30);
    if (videoRef.current) {
      videoRef.current.srcObject = canvasStream;
      videoRef.current.play().catch(() => {});
    }
    setStream(canvasStream);
    setIsSimulated(true);
    setIsReady(true);
  }, [stopActiveStream]);

  const startCamera = useCallback(async () => {
    stopActiveStream();
    setIsReady(false);
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('getUserMedia not available, using simulated stream');
      startSimulation();
      return;
    }

    try {
      const isPortrait = typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : false;
      // High-resolution ideal constraints without rigid min values that fail on mobile portrait sensors
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: isPortrait ? 2160 : 3840 },
          height: { ideal: isPortrait ? 3840 : 2160 },
        },
      };

      let mediaStream: MediaStream;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (constraintsError) {
        console.warn('High-res constraints failed, falling back to standard resolution:', constraintsError);
        mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: facingMode },
          },
        });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      setStream(mediaStream);
      setIsSimulated(false);
      setIsReady(true);

      // Check for torch capability
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = (videoTrack.getCapabilities ? videoTrack.getCapabilities() : {}) as any;
        setHasTorch(Boolean(capabilities?.torch));
      }
    } catch (err: any) {
      console.warn('Camera access denied or failed:', err);
      setCameraError(err.name === 'NotAllowedError' ? 'Kamerabehörighet nekades. Visar simulering.' : 'Kunde inte starta kamera. Visar simulering.');
      startSimulation();
    }
  }, [facingMode, startSimulation, stopActiveStream]);

  useEffect(() => {
    startCamera();
    return () => {
      stopActiveStream();
    };
  }, [facingMode]);

  const switchCamera = useCallback(() => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  }, []);

  const toggleTorch = useCallback(async () => {
    if (!stream || !hasTorch) return;
    const track = stream.getVideoTracks()[0];
    if (!track) return;

    try {
      const newTorch = !isTorchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: newTorch }],
      });
      setIsTorchOn(newTorch);
    } catch (e) {
      console.warn('Torch toggle failed:', e);
    }
  }, [stream, hasTorch, isTorchOn]);

  return {
    videoRef,
    stream,
    facingMode,
    isSimulated,
    hasTorch,
    isTorchOn,
    cameraError,
    isReady,
    switchCamera,
    toggleTorch,
    retryCamera: startCamera,
  };
}
