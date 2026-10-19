"use client";

import React, { memo, useCallback, useMemo, useState } from "react";
import Image from "next/image";
import { logoAdmin } from "@/utils/image";

const DEFAULT_FALLBACK = logoAdmin;

const AppImage = memo(function AppImage({
  src,
  alt,
  fallbackSrc = DEFAULT_FALLBACK,
  onError,
  unoptimized = false,
  ...props
}) {
  const sources = useMemo(
    () =>
      [
        ...(Array.isArray(src) ? src : [src]),
        ...(Array.isArray(fallbackSrc) ? fallbackSrc : [fallbackSrc]),
      ].filter(Boolean),
    [src, fallbackSrc],
  );
  const sourceKey = sources.join("\u0000");
  const [imageState, setImageState] = useState({ key: sourceKey, index: 0 });

  if (imageState.key !== sourceKey) {
    setImageState({ key: sourceKey, index: 0 });
  }

  const handleError = useCallback(
    (event) => {
      if (imageState.index < sources.length - 1) {
        setImageState((current) => ({
          ...current,
          index: current.index + 1,
        }));
      }
      onError?.(event);
    },
    [imageState.index, onError, sources.length],
  );

  const imageSrc = sources[imageState.index];
  const resolvedUnoptimized =
    unoptimized ||
    (typeof imageSrc === "string" && imageSrc.startsWith("http"));

  if (!imageSrc) return null;

  return (
    <Image
      {...props}
      src={imageSrc}
      alt={alt}
      unoptimized={resolvedUnoptimized}
      onError={handleError}
    />
  );
});

AppImage.displayName = "AppImage";

export default AppImage;
