'use client';

import React, { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

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

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `/face_landmarker.task`,
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numFaces: 1
        });

        faceLandmarkerRef.current = faceLandmarker;

        const loop = async () => {
          if (!mounted || !videoRef.current || !faceLandmarkerRef.current) return;

          if (videoRef.current.readyState >= 2) {
            const now = performance.now();
            const results = faceLandmarkerRef.current.detectForVideo(videoRef.current, now);
            if (results && results.faceLandmarks && results.faceLandmarks.length) {
              onLandmarksRef.current(results.faceLandmarks[0]);
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
        console.error('CameraVision init error', err);
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
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
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
