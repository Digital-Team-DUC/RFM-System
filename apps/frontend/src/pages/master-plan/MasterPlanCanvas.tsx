import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatCurrency, Currency } from '@rfm/shared';
import { MasterPlanShapeData, MasterPlanAssetData, EditorTool } from './types';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Bed,
  Bath,
  Maximize,
  Compass,
  Trees,
  Waves,
  Building,
} from 'lucide-react';

interface MasterPlanCanvasProps {
  asset: MasterPlanAssetData;
  shapes: MasterPlanShapeData[];
  selectedShape: MasterPlanShapeData | null;
  onSelectShape: (shape: MasterPlanShapeData | null) => void;
  editorMode: boolean;
  activeTool: EditorTool;
  onCreateShape?: (newShape: {
    coordinates: string;
    shapeType: string;
    label: string;
    colorCode?: string;
    status?: string;
  }) => void;
  searchQuery: string;
}

export const MasterPlanCanvas: React.FC<MasterPlanCanvasProps> = ({
  asset,
  shapes,
  selectedShape,
  onSelectShape,
  editorMode,
  activeTool,
  onCreateShape,
  searchQuery,
}) => {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Pan and Zoom State
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Tooltip State
  const [hoveredShape, setHoveredShape] = useState<MasterPlanShapeData | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Drawing state for Editor Mode
  const [rectStart, setRectStart] = useState<{ x: number; y: number } | null>(null);
  const [rectCurrent, setRectCurrent] = useState<{ x: number; y: number } | null>(null);
  const [polygonPoints, setPolygonPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [mouseSvgPos, setMouseSvgPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const canvasWidth = asset.width || 1000;
  const canvasHeight = asset.height || 600;

  const isDragDrawTool =
    editorMode &&
    (activeTool === 'drawRect' ||
      activeTool === 'drawRoad' ||
      activeTool === 'drawPark' ||
      activeTool === 'drawWater' ||
      activeTool === 'drawAmenity');

  // Convert client screen mouse coordinates into SVG space
  const getSvgCoordinates = useCallback(
    (clientX: number, clientY: number): { x: number; y: number } => {
      if (!svgRef.current) return { x: 0, y: 0 };
      const svg = svgRef.current;
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const screenCTM = svg.getScreenCTM();
      if (!screenCTM) return { x: 0, y: 0 };
      const svgP = pt.matrixTransform(screenCTM.inverse());
      return { x: Math.round(svgP.x), y: Math.round(svgP.y) };
    },
    [],
  );

  // Handle Zoom Wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.88;
    setZoom((prevZoom) => {
      const nextZoom = Math.min(Math.max(prevZoom * zoomFactor, 0.4), 3.5);
      return Math.round(nextZoom * 100) / 100;
    });
  };

  // Mouse Down handler (Pan or Start Drawing)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only primary button

    if (isDragDrawTool) {
      const coords = getSvgCoordinates(e.clientX, e.clientY);
      setRectStart(coords);
      setRectCurrent(coords);
      return;
    }

    if (editorMode && activeTool === 'drawPolygon') {
      const coords = getSvgCoordinates(e.clientX, e.clientY);
      setPolygonPoints((prev) => [...prev, coords]);
      return;
    }

    // Default: Start Panning
    setIsPanning(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  // Mouse Move handler
  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = getSvgCoordinates(e.clientX, e.clientY);
    setMouseSvgPos(coords);

    if (isPanning) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
      return;
    }

    if (isDragDrawTool && rectStart) {
      setRectCurrent(coords);
    }

    // Update Tooltip Position
    if (hoveredShape && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPos({
        x: e.clientX - rect.left + 15,
        y: e.clientY - rect.top + 15,
      });
    }
  };

  // Mouse Up handler (Commit drawn shape)
  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }

    if (isDragDrawTool && rectStart && rectCurrent) {
      const x = Math.min(rectStart.x, rectCurrent.x);
      const y = Math.min(rectStart.y, rectCurrent.y);
      const w = Math.abs(rectCurrent.x - rectStart.x);
      const h = Math.abs(rectCurrent.y - rectStart.y);

      if (w > 10 && h > 10 && onCreateShape) {
        const pathData = `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`;

        if (activeTool === 'drawRoad') {
          const isVert = h > w;
          const roadCrossWidth = isVert ? w : h;
          const roadCount = shapes.filter(
            (s) => s.shapeType === 'boulevard' || s.shapeType === 'street' || s.shapeType === 'road',
          ).length;
          onCreateShape({
            coordinates: pathData,
            shapeType: roadCrossWidth >= 36 ? 'boulevard' : 'street',
            label: `Road ${roadCount + 1}`,
            colorCode: '#1e293b',
            status: 'INFRASTRUCTURE',
          });
        } else if (activeTool === 'drawPark') {
          onCreateShape({
            coordinates: pathData,
            shapeType: 'park',
            label: 'Green Park',
            colorCode: '#065f46',
            status: 'AMENITY',
          });
        } else if (activeTool === 'drawWater') {
          onCreateShape({
            coordinates: pathData,
            shapeType: 'water',
            label: 'Riverside Lake',
            colorCode: '#0284c7',
            status: 'AMENITY',
          });
        } else if (activeTool === 'drawAmenity') {
          onCreateShape({
            coordinates: pathData,
            shapeType: 'amenity',
            label: 'Clubhouse Space',
            colorCode: '#475569',
            status: 'AMENITY',
          });
        } else {
          // Default: drawRect (Plot)
          onCreateShape({
            coordinates: pathData,
            shapeType: 'path',
            label: `Plot-${shapes.length + 1}`,
            colorCode: '#10b981',
            status: 'AVAILABLE',
          });
        }
      }
      setRectStart(null);
      setRectCurrent(null);
    }
  };

  // Complete polygon drawing on double click
  const handleDoubleClick = () => {
    if (editorMode && activeTool === 'drawPolygon' && polygonPoints.length >= 3 && onCreateShape) {
      const first = polygonPoints[0];
      let pathData = `M ${first.x} ${first.y} `;
      for (let i = 1; i < polygonPoints.length; i++) {
        pathData += `L ${polygonPoints[i].x} ${polygonPoints[i].y} `;
      }
      pathData += 'Z';

      onCreateShape({
        coordinates: pathData,
        shapeType: 'polygon',
        label: `Plot-${shapes.length + 1}`,
        colorCode: '#10b981',
        status: 'AVAILABLE',
      });
      setPolygonPoints([]);
    }
  };

  // Reset Zoom & Pan
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Fit to screen
  const handleFit = () => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const scaleX = (clientWidth - 60) / canvasWidth;
    const scaleY = (clientHeight - 60) / canvasHeight;
    const fitScale = Math.min(scaleX, scaleY, 1.2);
    setZoom(Math.round(fitScale * 100) / 100);
    setPan({ x: 0, y: 0 });
  };

  // Check if shape matches search query
  const isSearchMatch = (shape: MasterPlanShapeData): boolean => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    const labelMatch = shape.label?.toLowerCase().includes(q);
    const codeMatch = shape.property?.code?.toLowerCase().includes(q);
    const unitMatch = shape.property?.unitNumber?.toLowerCase().includes(q);
    return Boolean(labelMatch || codeMatch || unitMatch);
  };

  // List of all road shapes for smart intersection and crossroad calculation
  const allRoadShapes = useMemo(() => {
    return shapes.filter(
      (s) =>
        s.shapeType === 'road' ||
        s.shapeType === 'boulevard' ||
        s.shapeType === 'street' ||
        s.shapeType === 'alley',
    );
  }, [shapes]);

  // Sort shapes so roads and amenities render under plots for crisp boundaries
  const sortedShapes = useMemo(() => {
    return [...shapes].sort((a, b) => {
      const getOrder = (s: MasterPlanShapeData) => {
        if (s.shapeType === 'water') return 1;
        if (s.shapeType === 'park') return 2;
        if (
          s.shapeType === 'road' ||
          s.shapeType === 'boulevard' ||
          s.shapeType === 'street' ||
          s.shapeType === 'alley'
        )
          return 3;
        if (s.shapeType === 'amenity' || s.shapeType === 'pool' || s.shapeType === 'clubhouse')
          return 4;
        return 5; // plots on top
      };
      return getOrder(a) - getOrder(b);
    });
  }, [shapes]);

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        setIsPanning(false);
        setHoveredShape(null);
      }}
      onDoubleClick={handleDoubleClick}
      className={`relative w-full h-[640px] rounded-3xl glass-panel border border-slate-800 bg-slate-950 overflow-hidden select-none transition-colors ${
        isPanning ? 'cursor-grabbing' : editorMode ? 'cursor-crosshair' : 'cursor-grab'
      }`}
    >
      {/* Viewport Transform Wrapper */}
      <div
        className="w-full h-full flex items-center justify-center transition-transform duration-75 origin-center"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
          className="w-full max-w-4xl h-auto drop-shadow-2xl overflow-visible pointer-events-auto"
        >
          <defs>
            <linearGradient id="gridGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0b1120" />
              <stop offset="100%" stopColor="#020617" />
            </linearGradient>
            <filter id="plotGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <pattern id="siteGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5" strokeOpacity="0.4" />
            </pattern>
          </defs>

          {/* Master Site Canvas Base */}
          <rect
            x="0"
            y="0"
            width={canvasWidth}
            height={canvasHeight}
            rx="24"
            fill="url(#gridGradient)"
            stroke="#1e293b"
            strokeWidth="2"
          />
          <rect x="0" y="0" width={canvasWidth} height={canvasHeight} rx="24" fill="url(#siteGrid)" />

          {/* Custom SVG Blueprint Content if uploaded on this asset */}
          {asset.svgContent && (
            <g
              dangerouslySetInnerHTML={{ __html: asset.svgContent }}
              className="opacity-70 pointer-events-none"
            />
          )}

          {/* Render All Site Elements (Plots, Roads, Parks, Water, Amenities) */}
          {sortedShapes.map((shape) => {
            const isSelected = selectedShape?.id === shape.id;
            const matchesSearch = isSearchMatch(shape);
            const metrics = getShapeMetrics(shape.coordinates);

            const isRoad =
              shape.shapeType === 'road' ||
              shape.shapeType === 'boulevard' ||
              shape.shapeType === 'street' ||
              shape.shapeType === 'alley';

            const roadPlan = isRoad ? getRoadMarkingPlan(shape, allRoadShapes) : null;

            const isPark = shape.shapeType === 'park';
            const isWater = shape.shapeType === 'water';
            const isAmenity =
              shape.shapeType === 'amenity' ||
              shape.shapeType === 'pool' ||
              shape.shapeType === 'clubhouse';

            // Resolve color
            let statusColor = shape.colorCode;
            if (!statusColor) {
              if (isRoad) statusColor = '#1e293b';
              else if (isPark) statusColor = '#065f46';
              else if (isWater) statusColor = '#0284c7';
              else if (isAmenity) statusColor = '#475569';
              else if (shape.status === 'AVAILABLE') statusColor = '#10b981';
              else if (shape.status === 'RESERVED') statusColor = '#f59e0b';
              else if (shape.status === 'INSTALLMENT') statusColor = '#3b82f6';
              else statusColor = '#ef4444';
            }

            return (
              <g
                key={shape.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectShape(shape);
                }}
                onMouseEnter={(e) => {
                  setHoveredShape(shape);
                  const rect = containerRef.current?.getBoundingClientRect();
                  if (rect) {
                    setTooltipPos({
                      x: e.clientX - rect.left + 15,
                      y: e.clientY - rect.top + 15,
                    });
                  }
                }}
                onMouseLeave={() => setHoveredShape(null)}
                className="cursor-pointer group transition-all"
              >
                {/* Search Match Halo Pulse */}
                {matchesSearch && (
                  <path
                    d={shape.coordinates}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="6"
                    opacity="0.8"
                    className="animate-pulse"
                  />
                )}

                {/* Base Surface Path */}
                <path
                  d={shape.coordinates}
                  fill={statusColor}
                  fillOpacity={
                    isSelected
                      ? 0.98
                      : matchesSearch
                      ? 0.9
                      : isRoad
                      ? 0.96
                      : isPark || isWater
                      ? 0.78
                      : 0.65
                  }
                  stroke={
                    isSelected
                      ? '#ffffff'
                      : matchesSearch
                      ? '#38bdf8'
                      : isRoad
                      ? '#1e293b' // Seamless asphalt blending across intersections
                      : statusColor
                  }
                  strokeWidth={isSelected ? 3.5 : matchesSearch ? 2.5 : isRoad ? 1 : 1.5}
                  filter={isSelected ? 'url(#plotGlow)' : undefined}
                  className="transition-all duration-150 group-hover:fill-opacity-95"
                />

                {/* Road Lane Markings: Clean yellow dashed segments stopping before intersections */}
                {isRoad && roadPlan && (
                  <g pointerEvents="none">
                    {roadPlan.segments.map((seg, idx) => {
                      if (metrics.isVertical) {
                        // Portrait Road: Line runs vertically from top to bottom
                        if (roadPlan.isBoulevard && metrics.width >= 36) {
                          return (
                            <g key={idx}>
                              <line
                                x1={metrics.centerX - 2.5}
                                y1={seg.p1}
                                x2={metrics.centerX - 2.5}
                                y2={seg.p2}
                                stroke="#fbbf24"
                                strokeWidth="1.8"
                                strokeDasharray="14 10"
                                opacity="0.9"
                              />
                              <line
                                x1={metrics.centerX + 2.5}
                                y1={seg.p1}
                                x2={metrics.centerX + 2.5}
                                y2={seg.p2}
                                stroke="#fbbf24"
                                strokeWidth="1.8"
                                strokeDasharray="14 10"
                                opacity="0.9"
                              />
                            </g>
                          );
                        }
                        return (
                          <line
                            key={idx}
                            x1={metrics.centerX}
                            y1={seg.p1}
                            x2={metrics.centerX}
                            y2={seg.p2}
                            stroke="#fbbf24"
                            strokeWidth={metrics.width > 24 ? 2.2 : 1.8}
                            strokeDasharray="14 10"
                            opacity="0.9"
                          />
                        );
                      } else {
                        // Landscape Road: Line runs horizontally from left to right
                        if (roadPlan.isBoulevard && metrics.height >= 36) {
                          return (
                            <g key={idx}>
                              <line
                                x1={seg.p1}
                                y1={metrics.centerY - 2.5}
                                x2={seg.p2}
                                y2={metrics.centerY - 2.5}
                                stroke="#fbbf24"
                                strokeWidth="1.8"
                                strokeDasharray="14 10"
                                opacity="0.9"
                              />
                              <line
                                x1={seg.p1}
                                y1={metrics.centerY + 2.5}
                                x2={seg.p2}
                                y2={metrics.centerY + 2.5}
                                stroke="#fbbf24"
                                strokeWidth="1.8"
                                strokeDasharray="14 10"
                                opacity="0.9"
                              />
                            </g>
                          );
                        }
                        return (
                          <line
                            key={idx}
                            x1={seg.p1}
                            y1={metrics.centerY}
                            x2={seg.p2}
                            y2={metrics.centerY}
                            stroke="#fbbf24"
                            strokeWidth={metrics.height > 24 ? 2.2 : 1.8}
                            strokeDasharray="14 10"
                            opacity="0.9"
                          />
                        );
                      }
                    })}
                  </g>
                )}

                {/* Element Label: Orientation aware & placed away from intersections */}
                {isRoad && roadPlan ? (
                  metrics.isVertical ? (
                    // Portrait Road Label: Rotated 90 degrees along vertical axis in optimal segment
                    <g
                      pointerEvents="none"
                      transform={`translate(${roadPlan.labelPos.x}, ${roadPlan.labelPos.y}) rotate(-90)`}
                    >
                      <rect
                        x={-roadPlan.badgeWidth / 2}
                        y={-roadPlan.badgeHeight / 2}
                        width={roadPlan.badgeWidth}
                        height={roadPlan.badgeHeight}
                        rx="4"
                        fill="#0b0f19"
                        fillOpacity="0.92"
                        stroke="#f59e0b"
                        strokeWidth="0.8"
                      />
                      <text
                        x="0"
                        y={roadPlan.fontSize * 0.35}
                        fill="#ffffff"
                        fontSize={roadPlan.fontSize}
                        fontWeight="bold"
                        textAnchor="middle"
                        letterSpacing="1.5"
                        className="font-mono select-none drop-shadow"
                      >
                        {shape.label}
                      </text>
                    </g>
                  ) : (
                    // Landscape Road Label: Horizontal in optimal segment
                    <g
                      pointerEvents="none"
                      transform={`translate(${roadPlan.labelPos.x}, ${roadPlan.labelPos.y})`}
                    >
                      <rect
                        x={-roadPlan.badgeWidth / 2}
                        y={-roadPlan.badgeHeight / 2}
                        width={roadPlan.badgeWidth}
                        height={roadPlan.badgeHeight}
                        rx="4"
                        fill="#0b0f19"
                        fillOpacity="0.92"
                        stroke="#f59e0b"
                        strokeWidth="0.8"
                      />
                      <text
                        x="0"
                        y={roadPlan.fontSize * 0.35}
                        fill="#ffffff"
                        fontSize={roadPlan.fontSize}
                        fontWeight="bold"
                        textAnchor="middle"
                        letterSpacing="1.5"
                        className="font-mono select-none drop-shadow"
                      >
                        {shape.label}
                      </text>
                    </g>
                  )
                ) : (
                  // Regular plot, park, lake, amenity label
                  <text
                    x={metrics.centerX}
                    y={metrics.centerY + 4}
                    fill={isPark ? '#a7f3d0' : isWater ? '#bae6fd' : '#ffffff'}
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                    letterSpacing={isPark || isWater ? '1' : '0.5'}
                    pointerEvents="none"
                    className="drop-shadow-md select-none font-mono"
                  >
                    {shape.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Active Live Drag Preview with Portrait/Landscape direction detection */}
          {isDragDrawTool && rectStart && rectCurrent && (
            <g pointerEvents="none">
              {(() => {
                const x = Math.min(rectStart.x, rectCurrent.x);
                const y = Math.min(rectStart.y, rectCurrent.y);
                const w = Math.abs(rectCurrent.x - rectStart.x);
                const h = Math.abs(rectCurrent.y - rectStart.y);
                const isPortrait = h > w;

                return (
                  <>
                    <rect
                      x={x}
                      y={y}
                      width={w}
                      height={h}
                      fill={
                        activeTool === 'drawRoad'
                          ? '#1e293b'
                          : activeTool === 'drawPark'
                          ? '#065f46'
                          : activeTool === 'drawWater'
                          ? '#0284c7'
                          : activeTool === 'drawAmenity'
                          ? '#475569'
                          : '#10b981'
                      }
                      fillOpacity="0.55"
                      stroke={
                        activeTool === 'drawRoad'
                          ? '#fbbf24'
                          : activeTool === 'drawPark'
                          ? '#34d399'
                          : activeTool === 'drawWater'
                          ? '#38bdf8'
                          : activeTool === 'drawAmenity'
                          ? '#94a3b8'
                          : '#10b981'
                      }
                      strokeWidth="2.5"
                      strokeDasharray="6 4"
                    />

                    {/* Road Live Dividing Line: Vertical for Portrait, Horizontal for Landscape */}
                    {activeTool === 'drawRoad' && (
                      <line
                        x1={isPortrait ? x + w / 2 : x}
                        y1={isPortrait ? y : y + h / 2}
                        x2={isPortrait ? x + w / 2 : x + w}
                        y2={isPortrait ? y + h : y + h / 2}
                        stroke="#fbbf24"
                        strokeWidth="2.5"
                        strokeDasharray="10 6"
                      />
                    )}

                    <text
                      x={x + w / 2}
                      y={y + h / 2 + 4}
                      fill="#ffffff"
                      fontSize="11"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="font-mono drop-shadow"
                    >
                      {activeTool === 'drawRoad' &&
                        (isPortrait
                          ? `PORTRAIT ROAD (${Math.round(h / 10)}m × ${Math.round(w / 10)}m)`
                          : `ROAD (${Math.round(w / 10)}m × ${Math.round(h / 10)}m)`)}
                      {activeTool === 'drawPark' && 'PARK PREVIEW'}
                      {activeTool === 'drawWater' && 'LAKE PREVIEW'}
                      {activeTool === 'drawAmenity' && 'AMENITY PREVIEW'}
                      {activeTool === 'drawRect' && 'PLOT PREVIEW'}
                    </text>
                  </>
                );
              })()}
            </g>
          )}

          {/* Active Drawing Preview (Polygon) */}
          {editorMode && activeTool === 'drawPolygon' && polygonPoints.length > 0 && (
            <g pointerEvents="none">
              <polyline
                points={polygonPoints.map((p) => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
              />
              <line
                x1={polygonPoints[polygonPoints.length - 1].x}
                y1={polygonPoints[polygonPoints.length - 1].y}
                x2={mouseSvgPos.x}
                y2={mouseSvgPos.y}
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              {polygonPoints.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r="4" fill="#38bdf8" />
              ))}
            </g>
          )}
        </svg>
      </div>

      {/* Floating Hover Tooltip Card */}
      {hoveredShape && !isPanning && (
        <div
          className="absolute z-30 pointer-events-none bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-2xl p-3.5 shadow-2xl shadow-black/80 max-w-xs animate-in fade-in duration-150"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
          }}
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5 mb-1.5">
            <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {hoveredShape.property?.unitNumber || hoveredShape.label}
            </span>
            <span
              className={`text-[9px] uppercase px-2 py-0.5 rounded-full font-bold ${
                hoveredShape.status === 'AVAILABLE'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : hoveredShape.status === 'RESERVED'
                  ? 'bg-amber-500/20 text-amber-400'
                  : hoveredShape.status === 'INSTALLMENT'
                  ? 'bg-blue-500/20 text-blue-400'
                  : hoveredShape.status === 'SOLD'
                  ? 'bg-rose-500/20 text-rose-400'
                  : hoveredShape.status === 'INFRASTRUCTURE'
                  ? 'bg-slate-700 text-slate-300'
                  : 'bg-emerald-800 text-emerald-200'
              }`}
            >
              {hoveredShape.status}
            </span>
          </div>

          <p className="text-xs font-semibold text-white truncate">
            {hoveredShape.property?.title || hoveredShape.label}
          </p>

          {hoveredShape.property ? (
            <>
              <div className="flex items-center gap-3 text-[11px] text-slate-300 my-1.5">
                <span className="flex items-center gap-1">
                  <Maximize className="w-3 h-3 text-slate-400" />
                  {hoveredShape.property.landArea} m²
                </span>
                {hoveredShape.property.bedrooms > 0 && (
                  <span className="flex items-center gap-1">
                    <Bed className="w-3 h-3 text-slate-400" />
                    {hoveredShape.property.bedrooms} Bed
                  </span>
                )}
                {hoveredShape.property.bathrooms > 0 && (
                  <span className="flex items-center gap-1">
                    <Bath className="w-3 h-3 text-slate-400" />
                    {hoveredShape.property.bathrooms} Bath
                  </span>
                )}
              </div>

              <div className="pt-1.5 border-t border-slate-800 flex items-baseline justify-between">
                <span className="text-[10px] text-slate-400">Price:</span>
                <span className="text-xs font-black text-emerald-400 font-mono">
                  {formatCurrency(hoveredShape.property.sellingPrice, Currency.USD)}
                </span>
              </div>
            </>
          ) : (
            <p className="text-[10px] text-slate-400 mt-1 italic">
              Click to view specifications or insert unit info
            </p>
          )}
        </div>
      )}

      {/* Floating Canvas Controls */}
      <div className="absolute top-4 left-4 flex items-center space-x-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-xl z-10">
        <button
          onClick={() => setZoom((z) => Math.min(Math.round((z + 0.2) * 10) / 10, 3.5))}
          className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
          title={t('masterPlan.zoomIn')}
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(Math.round((z - 0.2) * 10) / 10, 0.4))}
          className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
          title={t('masterPlan.zoomOut')}
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleReset}
          className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
          title={t('masterPlan.resetZoom')}
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={handleFit}
          className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
          title="Fit to Screen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
        <div className="h-4 w-px bg-slate-700 mx-1" />
        <span className="text-[11px] font-mono text-slate-400 px-1 font-semibold">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Editor Active Tooltip Guide */}
      {editorMode && (
        <div className="absolute top-4 right-4 bg-emerald-950/80 backdrop-blur-md text-emerald-300 border border-emerald-500/30 px-3.5 py-1.5 rounded-2xl text-xs font-medium z-10 flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>
            {activeTool === 'drawRoad' && 'Click & drag on the map to lay down a road / boulevard'}
            {activeTool === 'drawPark' && 'Click & drag on the map to carve out a green park'}
            {activeTool === 'drawWater' && 'Click & drag on the map to shape a lake or canal'}
            {activeTool === 'drawAmenity' && 'Click & drag on the map to place a clubhouse/facility'}
            {activeTool === 'drawRect' && 'Click & drag on the map to define a property plot'}
            {activeTool === 'drawPolygon' && 'Click vertices. Double-click to complete shape'}
            {activeTool === 'select' && 'Click any plot, road, or amenity to inspect or insert info'}
          </span>
        </div>
      )}

      {/* Navigation Hint */}
      <div className="absolute bottom-4 left-4 hidden sm:flex items-center space-x-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-800 text-[11px] text-slate-400 z-10">
        <Compass className="w-3.5 h-3.5 text-slate-500" />
        <span>{t('masterPlan.panHint')}</span>
      </div>

      {/* MiniMap */}
      <div className="absolute bottom-4 right-4 w-32 h-20 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl overflow-hidden shadow-2xl pointer-events-none hidden md:block">
        <svg viewBox={`0 0 ${canvasWidth} ${canvasHeight}`} className="w-full h-full opacity-60">
          <rect x="0" y="0" width={canvasWidth} height={canvasHeight} fill="#020617" />
          {shapes.map((s) => (
            <path key={s.id} d={s.coordinates} fill={s.colorCode || '#10b981'} opacity="0.6" />
          ))}
          <rect
            x={Math.max(0, -pan.x / zoom)}
            y={Math.max(0, -pan.y / zoom)}
            width={canvasWidth / zoom}
            height={canvasHeight / zoom}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="12"
            opacity="0.8"
          />
        </svg>
      </div>
    </div>
  );
};

// Road lane marking segment and plan interfaces
interface RoadMarkingSegment {
  p1: number;
  p2: number;
}

interface RoadMarkingPlan {
  metrics: ShapeMetrics;
  isBoulevard: boolean;
  segments: RoadMarkingSegment[];
  labelPos: { x: number; y: number };
  badgeWidth: number;
  badgeHeight: number;
  fontSize: number;
}

function getRoadMarkingPlan(
  road: MasterPlanShapeData,
  allRoads: MasterPlanShapeData[],
): RoadMarkingPlan {
  const metrics = getShapeMetrics(road.coordinates);
  const roadCrossWidth = metrics.isVertical ? metrics.width : metrics.height;
  const isBoulevard = road.shapeType === 'boulevard' || roadCrossWidth >= 36;
  const isVertical = metrics.isVertical;

  // Road span along length
  const spanStart = isVertical ? metrics.minY + 4 : metrics.minX + 4;
  const spanEnd = isVertical ? metrics.maxY - 4 : metrics.maxX - 4;

  // Find all intersecting roads to cleanly break divider markings at junctions
  const forbiddenIntervals: Array<{ start: number; end: number }> = [];

  for (const other of allRoads) {
    if (other.id === road.id) continue;
    const otherMetrics = getShapeMetrics(other.coordinates);

    // Bounding box intersection check
    const intersects =
      otherMetrics.minX < metrics.maxX &&
      otherMetrics.maxX > metrics.minX &&
      otherMetrics.minY < metrics.maxY &&
      otherMetrics.maxY > metrics.minY;

    if (!intersects) continue;

    // Intersection interval along road length
    if (isVertical) {
      const cutStart = Math.max(spanStart, otherMetrics.minY - 2);
      const cutEnd = Math.min(spanEnd, otherMetrics.maxY + 2);
      if (cutStart < cutEnd) {
        forbiddenIntervals.push({ start: cutStart, end: cutEnd });
      }
    } else {
      const cutStart = Math.max(spanStart, otherMetrics.minX - 2);
      const cutEnd = Math.min(spanEnd, otherMetrics.maxX + 2);
      if (cutStart < cutEnd) {
        forbiddenIntervals.push({ start: cutStart, end: cutEnd });
      }
    }
  }

  // Sort and merge overlapping forbidden intervals
  forbiddenIntervals.sort((a, b) => a.start - b.start);
  const mergedForbidden: Array<{ start: number; end: number }> = [];
  for (const interval of forbiddenIntervals) {
    if (mergedForbidden.length === 0) {
      mergedForbidden.push({ ...interval });
    } else {
      const last = mergedForbidden[mergedForbidden.length - 1];
      if (interval.start <= last.end) {
        last.end = Math.max(last.end, interval.end);
      } else {
        mergedForbidden.push({ ...interval });
      }
    }
  }

  // Subtract intersections from road length to get uninterrupted lane segments
  const rawSegments: RoadMarkingSegment[] = [];
  let currentPos = spanStart;

  for (const f of mergedForbidden) {
    if (f.start > currentPos + 8) {
      rawSegments.push({ p1: currentPos, p2: f.start });
    }
    currentPos = Math.max(currentPos, f.end);
  }

  if (currentPos + 8 < spanEnd) {
    rawSegments.push({ p1: currentPos, p2: spanEnd });
  }

  const segments = rawSegments.length > 0 ? rawSegments : [{ p1: spanStart, p2: spanEnd }];

  // Select longest uninterrupted segment to place label badge
  let longestSegment = segments[0];
  let maxLen = longestSegment.p2 - longestSegment.p1;
  for (const seg of segments) {
    const len = seg.p2 - seg.p1;
    if (len > maxLen) {
      maxLen = len;
      longestSegment = seg;
    }
  }

  const labelMid = Math.round((longestSegment.p1 + longestSegment.p2) / 2);
  const labelPos = isVertical
    ? { x: metrics.centerX, y: labelMid }
    : { x: labelMid, y: metrics.centerY };

  const badgeHeight = Math.min(20, Math.max(14, roadCrossWidth - 8));
  const badgeWidth = Math.max(48, (road.label?.length || 6) * 7.5 + 16);
  const fontSize = roadCrossWidth < 25 ? 8 : roadCrossWidth < 36 ? 9.5 : 11;

  return {
    metrics,
    isBoulevard,
    segments,
    labelPos,
    badgeWidth,
    badgeHeight,
    fontSize,
  };
}

// Shape metrics helper (calculates bounding box, width, height, center, and orientation)
interface ShapeMetrics {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  isVertical: boolean;
}

function getShapeMetrics(coord: string): ShapeMetrics {
  if (!coord) {
    return {
      minX: 0,
      minY: 0,
      maxX: 100,
      maxY: 100,
      width: 100,
      height: 100,
      centerX: 50,
      centerY: 50,
      isVertical: false,
    };
  }
  const nums = coord.match(/-?\d+(\.\d+)?/g)?.map(Number) || [];
  if (nums.length >= 4) {
    const xs = nums.filter((_, i) => i % 2 === 0);
    const ys = nums.filter((_, i) => i % 2 === 1);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const width = Math.max(1, maxX - minX);
    const height = Math.max(1, maxY - minY);
    return {
      minX,
      minY,
      maxX,
      maxY,
      width,
      height,
      centerX: Math.round(minX + width / 2),
      centerY: Math.round(minY + height / 2),
      isVertical: height > width,
    };
  }
  return {
    minX: 0,
    minY: 0,
    maxX: 100,
    maxY: 100,
    width: 100,
    height: 100,
    centerX: 50,
    centerY: 50,
    isVertical: false,
  };
}
