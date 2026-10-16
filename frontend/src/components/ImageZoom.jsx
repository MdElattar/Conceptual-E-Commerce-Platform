import { useState, useRef, useCallback, useEffect } from 'react';

const ImageZoom = ({ src, alt, className = '' }) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [touchZoom, setTouchZoom] = useState(false);
  const [touchPos, setTouchPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (!isMobile) setIsZoomed(true);
  }, [isMobile]);

  const handleMouseLeave = useCallback(() => {
    setIsZoomed(false);
    setTouchZoom(false);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current || !imageRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPosition({ x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) });
  }, []);

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      setTouchZoom(true);
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (touchZoom && e.touches.length === 2) {
      const touch = e.touches[0];
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((touch.clientX - rect.left) / rect.width) * 100;
        const y = ((touch.clientY - rect.top) / rect.height) * 100;
        setTouchPos({ x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) });
      }
    }
  }, [touchZoom]);

  const handleTouchEnd = useCallback(() => {
    setTouchZoom(false);
  }, []);

  const handleDoubleTap = useCallback(() => {
    setTouchZoom(prev => !prev);
    if (!touchZoom && imageRef.current) {
      setTouchPos({ x: 50, y: 50 });
    }
  }, [touchZoom]);

  const displayZoom = isZoomed || touchZoom;
  const zoomPos = touchZoom ? touchPos : position;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDoubleClick={handleDoubleTap}
    >
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        loading="lazy"
        className={`w-full h-full object-contain transition-opacity duration-300 ${className} ${displayZoom ? 'opacity-0' : 'opacity-100'}`}
        draggable={false}
      />

      {/* Zoom Lens Indicator */}
      {displayZoom && !touchZoom && (
        <div
          className="absolute pointer-events-none z-10 border-2 border-orange-500 bg-white/10 rounded-full"
          style={{
            width: '120px',
            height: '120px',
            left: `${zoomPos.x}%`,
            top: `${zoomPos.y}%`,
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.3)',
          }}
        />
      )}

      {/* Zoomed Image */}
      {displayZoom && (
        <div className="absolute inset-0 z-20">
          <img
            src={src}
            alt={alt}
            loading="lazy"
            className="absolute max-w-none"
            style={{
              width: `${touchZoom ? 250 : 200}%`,
              height: `${touchZoom ? 250 : 200}%`,
              left: `${-zoomPos.x * (touchZoom ? 1.5 : 1)}%`,
              top: `${-zoomPos.y * (touchZoom ? 1.5 : 1)}%`,
              transform: 'translate(0, 0)',
              imageRendering: 'auto',
              willChange: 'left, top',
            }}
            draggable={false}
          />
        </div>
      )}

      {/* Hint on desktop */}
      {!isMobile && !isZoomed && (
        <div className="absolute bottom-2 right-2 bg-white/80 backdrop-blur-sm text-[10px] text-gray-500 font-medium px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Hover to zoom
        </div>
      )}
    </div>
  );
};

export default ImageZoom;
