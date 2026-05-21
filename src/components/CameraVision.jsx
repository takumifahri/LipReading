'use client';

import React, { useEffect, useRef } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

const VISION_WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';

function getCameraProfile() {
  const isMobile = window.matchMedia('(max-width: 767px), (pointer: coarse)').matches;
  const lowPowerDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;

  if (isMobile && lowPowerDevice) {
    return {
      width: 424,
      height: 318,
      frameRate: 20,
      detectionFps: 15,
    };
  }

  if (isMobile || lowPowerDevice) {
    return {
      width: 480,
      height: 360,
      frameRate: 24,
      detectionFps: 18,
    };
  }

  return {
    width: 480,
    height: 360,
    frameRate: 24,
    detectionFps: 18,
  };
}

async function createFaceLandmarker(vision, delegate) {
  return FaceLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: `/face_landmarker.task`,
      delegate,
    },
    runningMode: 'VIDEO',
    numFaces: 1,
  });
}

export default function CameraVision({ enabled = false, onLandmarks = () => {} }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const faceLandmarkerRef = useRef(null);
  const onLandmarksRef = useRef(onLandmarks);

  useEffect(() => {
    onLandmarksRef.current = onLandmarks;
  }, [onLandmarks]);

  useEffect(() => {
    if (!enabled) return;

    let mounted = true;
    const videoElement = videoRef.current;
    const profile = getCameraProfile();

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: 'user',
            width: { ideal: profile.width },
            height: { ideal: profile.height },
            frameRate: { ideal: profile.frameRate, max: profile.frameRate },
          },
        });

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoElement) {
          videoElement.srcObject = stream;
          await videoElement.play();
        }

        if (!mounted) return;

        const vision = await FilesetResolver.forVisionTasks(VISION_WASM_URL);

        if (!mounted) return;

        let faceLandmarker;
        try {
          faceLandmarker = await createFaceLandmarker(vision, 'GPU');
        } catch (gpuError) {
          console.warn('CameraVision GPU delegate unavailable, falling back to CPU', gpuError);
          faceLandmarker = await createFaceLandmarker(vision, 'CPU');
        }

        if (!mounted) {
          faceLandmarker.close();
          return;
        }

        faceLandmarkerRef.current = faceLandmarker;
        let lastDetectionAt = 0;
        const detectionInterval = 1000 / profile.detectionFps;

        const loop = async () => {
          if (!mounted || !videoRef.current || !faceLandmarkerRef.current) return;

          const video = videoRef.current;
          const now = performance.now();
          const shouldDetect = now - lastDetectionAt >= detectionInterval;

          if (!document.hidden && shouldDetect && video.readyState >= 2 && !video.paused && !video.ended && video.videoWidth > 0) {
            lastDetectionAt = now;
            try {
              const results = faceLandmarkerRef.current.detectForVideo(video, now);
              if (results?.faceLandmarks?.length) {
                onLandmarksRef.current(results.faceLandmarks[0]);
              }
            } catch (err) {
              if (mounted) console.warn('CameraVision detection skipped', err);
            }
          }

          animationFrameRef.current = window.requestAnimationFrame(loop);
        };

        animationFrameRef.current = window.requestAnimationFrame(loop);
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          canvas.width = profile.width;
          canvas.height = profile.height;
        }
      } catch (err) {
        if (mounted && err?.name !== 'AbortError') {
          console.error('CameraVision init error', err);
        }
      }
    })();

    return () => {
      mounted = false;
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoElement) {
        videoElement.pause();
        videoElement.srcObject = null;
      }
      faceLandmarkerRef.current?.close();
      faceLandmarkerRef.current = null;
    };
  }, [enabled]);

  return (
    <div className="relative h-full">
      <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" playsInline muted />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none scale-x-[-1]" />
    </div>
  );
}
