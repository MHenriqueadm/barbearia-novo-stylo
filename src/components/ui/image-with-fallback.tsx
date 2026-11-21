import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { ImageIcon, Loader2 } from "lucide-react";

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
  containerClassName?: string;
}

export function ImageWithFallback({ 
  src, 
  alt, 
  fallback, 
  className, 
  containerClassName,
  onLoad,
  onError,
  ...props 
}: ImageWithFallbackProps) {
  const [errorCount, setErrorCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);

  // Reset states when src changes
  useEffect(() => {
    setErrorCount(0);
    setLoading(true);
    
    if (!src) {
      setLoading(false);
      return;
    }

    // Check if image is already cached/complete
    if (imgRef.current?.complete) {
      setLoading(false);
    }
  }, [src]);

  const hasError = errorCount > 0;

  if (!src || hasError) {
    return (
      <div className={cn("w-full h-full flex items-center justify-center bg-slate-900 text-slate-500 shrink-0", containerClassName)}>
        {fallback || <ImageIcon className="w-8 h-8 opacity-20" />}
      </div>
    );
  }

  return (
    <div className={cn("relative w-full h-full", containerClassName)}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-10">
          <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
        </div>
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={cn(className, loading ? "opacity-0 absolute" : "opacity-100")}
        style={loading ? { position: 'absolute', top: 0, left: 0, width: '1px', height: '1px' } : {}}
        onLoad={(e) => {
          setLoading(false);
          onLoad?.(e);
        }}
        onError={(e) => {
          setErrorCount(prev => prev + 1);
          setLoading(false);
          onError?.(e);
        }}
        {...props}
      />
    </div>
  );
}
