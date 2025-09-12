"use client";

import React, { useState, useEffect } from "react";

export default function Loading() {
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(0);

  const loadingMessages = [
    "Cargando tu catálogo...",
    "Preparando productos...",
    "Sincronizando inventario...",
    "Organizando categorías...",
    "Finalizando configuración...",
  ];

  useEffect(() => {
    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 100);

    // Message rotation
    const messageInterval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % loadingMessages.length);
    }, 2000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-10 left-10 w-16 h-16 border-2 border-primary rounded-lg rotate-12"></div>
        <div className="absolute top-32 right-20 w-12 h-12 border-2 border-accent rounded-full"></div>
        <div className="absolute bottom-20 left-20 w-20 h-20 border-2 border-secondary rounded-lg -rotate-12"></div>
        <div className="absolute bottom-32 right-10 w-14 h-14 border-2 border-primary rounded-full rotate-45"></div>
        <div className="absolute top-1/2 left-1/4 w-8 h-8 border-2 border-accent rounded-lg"></div>
        <div className="absolute top-1/3 right-1/3 w-10 h-10 border-2 border-secondary rounded-full"></div>
      </div>

      <div className="text-center space-y-8 max-w-md w-full">
        {/* Main loading icon */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="catalog-spin w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Loading text */}
        <div className="space-y-4 fade-in-up">
          <h1 className="text-3xl font-bold text-primary">
            {loadingMessages[currentMessage]}
          </h1>
          <p className="text-muted-foreground text-lg pulse-text">
            Por favor, espera mientras preparamos todo para ti
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-100 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Progress percentage */}
        <div className="text-sm text-muted-foreground">
          {progress}% completado
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-3 gap-4 mt-12 opacity-60">
          <div className="text-center space-y-2">
            <div className="w-8 h-8 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <svg
                className="w-4 h-4 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <p className="text-xs text-muted-foreground">Gestión</p>
          </div>
          <div className="text-center space-y-2">
            <div className="w-8 h-8 mx-auto bg-accent/10 rounded-full flex items-center justify-center">
              <svg
                className="w-4 h-4 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <p className="text-xs text-muted-foreground">Analytics</p>
          </div>
          <div className="text-center space-y-2">
            <div className="w-8 h-8 mx-auto bg-secondary/10 rounded-full flex items-center justify-center">
              <svg
                className="w-4 h-4 text-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                />
              </svg>
            </div>
            <p className="text-xs text-muted-foreground">Control</p>
          </div>
        </div>
      </div>
    </div>
  );
}
