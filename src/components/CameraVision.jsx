'use client';

import React, { useEffect, useRef } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

const VISION_WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm';

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

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: 'user',
            width: 640,
            height: 480
          }
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

        const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `/face_landmarker.task`,
            delegate: 'CPU'
          },
          runningMode: 'VIDEO',
          numFaces: 1
        });

        if (!mounted) {
          faceLandmarker.close();
          return;
        }

        faceLandmarkerRef.current = faceLandmarker;

        const loop = async () => {
          if (!mounted || !videoRef.current || !faceLandmarkerRef.current) return;

          const video = videoRef.current;
          if (video.readyState >= 2 && !video.paused && !video.ended && video.videoWidth > 0) {
            try {
              const results = faceLandmarkerRef.current.detectForVideo(video, performance.now());
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
          canvas.width = 640;
          canvas.height = 480;
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
    <div className="relative">
      <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" playsInline muted />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none scale-x-[-1]" />
    </div>
  );
}
