import React, { useRef, useEffect, useState, useCallback } from 'react';
import WhiteboardWebSocket from '../services/websocket';
import StickyNote from './StickyNote';

interface DrawingData {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  color: string;
  lineWidth: number;
}

interface StickyNoteData {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  width: number;
  height: number;
}

interface WhiteboardProps {
  width?: number;
  height?: number;
}

interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface WorldCoordinates {
  x: number;
  y: number;
}

const Whiteboard: React.FC<WhiteboardProps> = ({ width = 1200, height = 800 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const websocketRef = useRef<WhiteboardWebSocket | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const [stickyNotes, setStickyNotes] = useState<StickyNoteData[]>([]);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [mode, setMode] = useState<'draw' | 'sticky' | 'pan'>('draw');
  const lastPointRef = useRef<{x: number, y: number} | null>(null);
  const lastPanPointRef = useRef<{x: number, y: number} | null>(null);
  
  // Virtual whiteboard dimensions (much larger than canvas)
  const worldWidth = 5000;
  const worldHeight = 5000;
  
  // Viewport represents the visible area within the world
  const [viewport, setViewport] = useState<Viewport>({
    x: (worldWidth - width) / 2, // Start centered
    y: (worldHeight - height) / 2,
    width,
    height
  });

  // Convert screen coordinates to world coordinates
  const screenToWorld = useCallback((screenX: number, screenY: number): WorldCoordinates => {
    return {
      x: screenX + viewport.x,
      y: screenY + viewport.y
    };
  }, [viewport]);

  // Convert world coordinates to screen coordinates
  const worldToScreen = useCallback((worldX: number, worldY: number): WorldCoordinates => {
    return {
      x: worldX - viewport.x,
      y: worldY - viewport.y
    };
  }, [viewport]);

  const draw = useCallback((data: DrawingData) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Convert world coordinates to screen coordinates for drawing
    const startScreen = worldToScreen(data.prevX, data.prevY);
    const endScreen = worldToScreen(data.x, data.y);

    // Only draw if the stroke is visible in the current viewport
    if (startScreen.x < -50 && endScreen.x < -50) return;
    if (startScreen.x > width + 50 && endScreen.x > width + 50) return;
    if (startScreen.y < -50 && endScreen.y < -50) return;
    if (startScreen.y > height + 50 && endScreen.y > height + 50) return;

    ctx.beginPath();
    ctx.moveTo(startScreen.x, startScreen.y);
    ctx.lineTo(endScreen.x, endScreen.y);
    ctx.strokeStyle = data.color;
    ctx.lineWidth = data.lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
  }, [viewport, worldToScreen, width, height]);

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    if (mode === 'pan') {
      setIsPanning(true);
      lastPanPointRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (mode === 'sticky') {
      // Handle sticky note creation using world coordinates
      const worldCoords = screenToWorld(screenX, screenY);

      const newNote: Omit<StickyNoteData, 'id'> = {
        text: '',
        x: worldCoords.x - 100, // Center the note on click
        y: worldCoords.y - 75,
        color: '#ffeb3b',
        width: 200,
        height: 150
      };

      if (websocketRef.current) {
        websocketRef.current.sendStickyNote(newNote);
      }
      return;
    }
    
    if (mode !== 'draw') return;
    
    setIsDrawing(true);
    const worldCoords = screenToWorld(screenX, screenY);
    lastPointRef.current = worldCoords;

    // Start a new path
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(screenX, screenY);
    }
  }, [mode, screenToWorld]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    if (isPanning && lastPanPointRef.current) {
      const deltaX = e.clientX - lastPanPointRef.current.x;
      const deltaY = e.clientY - lastPanPointRef.current.y;

      setViewport(prev => ({
        ...prev,
        x: Math.max(0, Math.min(worldWidth - prev.width, prev.x - deltaX)),
        y: Math.max(0, Math.min(worldHeight - prev.height, prev.y - deltaY))
      }));

      lastPanPointRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    if (!isDrawing || !lastPointRef.current || mode !== 'draw') return;

    const worldCoords = screenToWorld(screenX, screenY);

    const strokeData = {
      x: worldCoords.x,
      y: worldCoords.y,
      prevX: lastPointRef.current.x,
      prevY: lastPointRef.current.y,
      color: currentColor,
      lineWidth
    };

    // Draw locally
    draw(strokeData);

    // Send to other users
    if (websocketRef.current) {
      websocketRef.current.sendStroke(strokeData);
    }

    lastPointRef.current = worldCoords;
  }, [isPanning, isDrawing, currentColor, lineWidth, draw, screenToWorld, worldWidth, worldHeight]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    setIsPanning(false);
    lastPanPointRef.current = null;
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    if (websocketRef.current) {
      websocketRef.current.sendClear();
    }
  }, []);

  // Redraw all strokes when viewport changes
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Note: We'll need to store strokes to redraw them
    // For now, this clears the canvas when panning
  }, []);

  useEffect(() => {
    redrawCanvas();
  }, [viewport, redrawCanvas]);

  // Add keyboard shortcuts for panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't interfere with text input
      }
      
      const panSpeed = 50;
      let deltaX = 0;
      let deltaY = 0;
      
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          deltaX = -panSpeed;
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          deltaX = panSpeed;
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          deltaY = -panSpeed;
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          deltaY = panSpeed;
          break;
        case ' ':
          e.preventDefault();
          setMode(prev => prev === 'pan' ? 'draw' : 'pan');
          return;
      }
      
      if (deltaX !== 0 || deltaY !== 0) {
        e.preventDefault();
        setViewport(prev => ({
          ...prev,
          x: Math.max(0, Math.min(worldWidth - prev.width, prev.x + deltaX)),
          y: Math.max(0, Math.min(worldHeight - prev.height, prev.y + deltaY))
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [worldWidth, worldHeight]);


  const handleStickyNoteUpdate = useCallback((note: StickyNoteData) => {
    setStickyNotes(prev => prev.map(n => n.id === note.id ? note : n));
    if (websocketRef.current) {
      websocketRef.current.updateStickyNote(note);
    }
  }, []);


  const handleStickyNoteDelete = useCallback((id: number) => {
    setStickyNotes(prev => prev.filter(n => n.id !== id));
    if (websocketRef.current) {
      websocketRef.current.deleteStickyNote(id);
    }
  }, []);

  const addStickyNote = useCallback((note: StickyNoteData) => {
    setStickyNotes(prev => {
      // Ensure we don't add duplicates
      if (prev.some(n => n.id === note.id)) {
        return prev;
      }
      return [...prev, note];
    });
  }, []);

  const updateStickyNote = useCallback((note: StickyNoteData) => {
    setStickyNotes(prev => {
      const exists = prev.some(n => n.id === note.id);
      if (!exists) {
        // If note doesn't exist, add it
        return [...prev, note];
      }
      // Update existing note
      return prev.map(n => n.id === note.id ? note : n);
    });
  }, []);

  const removeStickyNote = useCallback((id: number) => {
    setStickyNotes(prev => prev.filter(n => n.id !== id));
  }, []);

  useEffect(() => {
    websocketRef.current = new WhiteboardWebSocket();
    websocketRef.current.connect();

    websocketRef.current.onDraw((stroke) => {
      draw(stroke);
    });

    websocketRef.current.onClear(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      setStickyNotes([]);
    });

    websocketRef.current.onStickyNoteAdded(addStickyNote);
    websocketRef.current.onStickyNoteUpdated(updateStickyNote);
    websocketRef.current.onStickyNoteRemoved(removeStickyNote);

    return () => {
      if (websocketRef.current) {
        websocketRef.current.disconnect();
      }
    };
  }, [draw]);

  return (
    <div className="whiteboard-container">
      <div className="toolbar">
        <div className="mode-selector">
          <label>Mode: </label>
          <select value={mode} onChange={(e) => setMode(e.target.value as 'draw' | 'sticky' | 'pan')}>
            <option value="draw">Draw</option>
            <option value="sticky">Sticky Notes</option>
            <option value="pan">Pan</option>
          </select>
        </div>
        <div className="color-picker">
          <label>Color: </label>
          <input
            type="color"
            value={currentColor}
            onChange={(e) => setCurrentColor(e.target.value)}
          />
        </div>
        <div className="line-width">
          <label>Size: </label>
          <input
            type="range"
            min="1"
            max="20"
            value={lineWidth}
            onChange={(e) => setLineWidth(parseInt(e.target.value))}
          />
          <span>{lineWidth}px</span>
        </div>
        <button onClick={clearCanvas}>Clear</button>
        <div className="viewport-info">
          <small>Viewport: ({Math.round(viewport.x)}, {Math.round(viewport.y)}) | World: {worldWidth}×{worldHeight}</small>
        </div>
        <div className="controls-help">
          <small>Controls: WASD/Arrow keys to pan | Space to toggle pan mode | Mouse drag in pan mode</small>
        </div>
      </div>
      <div 
        ref={containerRef}
        className="canvas-container" 
        style={{ 
          position: 'relative', 
          display: 'inline-block',
          border: '1px solid #ccc',
          overflow: 'hidden'
        }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          onMouseDown={startDrawing}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          style={{
            cursor: mode === 'draw' ? 'crosshair' : mode === 'pan' ? (isPanning ? 'grabbing' : 'grab') : 'pointer',
            display: 'block'
          }}
        />
        {stickyNotes.map(note => (
          <StickyNote
            key={`sticky-note-${note.id}`}
            note={note}
            viewport={viewport}
            onUpdate={handleStickyNoteUpdate}
            onDelete={handleStickyNoteDelete}
            isEditing={editingNoteId === note.id}
            onStartEdit={setEditingNoteId}
            onStopEdit={() => setEditingNoteId(null)}
          />
        ))}
      </div>
    </div>
  );
};

export default Whiteboard;