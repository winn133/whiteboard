import React, { useState, useRef, useEffect, useCallback } from 'react';

interface StickyNoteData {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  width: number;
  height: number;
}

interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface StickyNoteProps {
  note: StickyNoteData;
  viewport: Viewport;
  onUpdate: (note: StickyNoteData) => void;
  onDelete: (id: number) => void;
  isEditing?: boolean;
  onStartEdit?: (id: number) => void;
  onStopEdit?: () => void;
}

const StickyNote: React.FC<StickyNoteProps> = ({
  note,
  viewport,
  onUpdate,
  onDelete,
  isEditing = false,
  onStartEdit,
  onStopEdit
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [localPosition, setLocalPosition] = useState({ x: 0, y: 0 });
  const [text, setText] = useState(note.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const currentWorldPositionRef = useRef({ x: note.x, y: note.y });
  
  // Convert world coordinates to screen coordinates (no memoization to avoid dependency issues)
  const worldToScreen = (worldX: number, worldY: number) => {
    return {
      x: worldX - viewport.x,
      y: worldY - viewport.y
    };
  };
  
  
  // Calculate screen position from world position
  const screenPosition = worldToScreen(note.x, note.y);

  useEffect(() => {
    setText(note.text);
    currentWorldPositionRef.current = { x: note.x, y: note.y };
  }, [note.text, note.x, note.y]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return;
    
    setIsDragging(true);
    const currentScreenPos = worldToScreen(currentWorldPositionRef.current.x, currentWorldPositionRef.current.y);
    setDragOffset({
      x: e.clientX - currentScreenPos.x,
      y: e.clientY - currentScreenPos.y
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      const newScreenX = e.clientX - dragOffset.x;
      const newScreenY = e.clientY - dragOffset.y;
      
      const newWorldPos = {
        x: newScreenX + viewport.x,
        y: newScreenY + viewport.y
      };
      
      // Keep within world bounds (assuming 5000x5000 world)
      const boundedWorldPos = {
        x: Math.max(0, Math.min(5000 - note.width, newWorldPos.x)),
        y: Math.max(0, Math.min(5000 - note.height, newWorldPos.y))
      };
      
      currentWorldPositionRef.current = boundedWorldPos;
      setLocalPosition({ x: newScreenX, y: newScreenY });
    });
  }, [dragOffset.x, dragOffset.y, viewport.x, viewport.y, note.width, note.height]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    
    // Only update the parent (and send WebSocket) when drag ends
    onUpdate({
      ...note,
      x: currentWorldPositionRef.current.x,
      y: currentWorldPositionRef.current.y
    });
  }, [note, onUpdate]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleDoubleClick = () => {
    if (onStartEdit) {
      onStartEdit(note.id);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleTextBlur = () => {
    onUpdate({
      ...note,
      text: text
    });
    if (onStopEdit) {
      onStopEdit();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleTextBlur();
    } else if (e.key === 'Escape') {
      setText(note.text); // Reset text
      if (onStopEdit) {
        onStopEdit();
      }
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(note.id);
  };

  return (
    <div key={`sticky-note-container-${note.id}`}>
      <div
        className="sticky-note"
        style={{
          position: 'absolute',
          left: isDragging ? localPosition.x : screenPosition.x,
          top: isDragging ? localPosition.y : screenPosition.y,
          width: note.width,
          height: note.height,
          backgroundColor: note.color,
          border: '1px solid #ddd',
          borderRadius: '4px',
          boxShadow: '2px 2px 4px rgba(0,0,0,0.1)',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          transition: isDragging ? 'none' : 'left 0.1s ease-out, top 0.1s ease-out'
        }}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
      >
      <div
        className="sticky-note-header"
        style={{
          height: '20px',
          backgroundColor: 'rgba(0,0,0,0.1)',
          borderRadius: '4px 4px 0 0',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          padding: '2px 4px',
          cursor: 'default',
          pointerEvents: 'auto'
        }}
      >
      </div>
      <div
        className="sticky-note-content"
        style={{
          padding: '8px',
          height: 'calc(100% - 20px)',
          overflow: 'hidden'
        }}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onBlur={handleTextBlur}
            onKeyDown={handleKeyDown}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: 'transparent',
              resize: 'none',
              outline: 'none',
              fontFamily: 'inherit',
              fontSize: 'inherit'
            }}
            placeholder="Type your note here..."
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              overflow: 'hidden'
            }}
          >
            {note.text || 'Double-click to edit'}
          </div>
        )}
      </div>
      </div>
      
      {/* Separate delete button positioned outside the draggable area */}
      <button
        onClick={handleDelete}
        style={{
          position: 'absolute',
          left: (isDragging ? localPosition.x : screenPosition.x) + note.width - 10,
          top: (isDragging ? localPosition.y : screenPosition.y) - 10,
          background: '#ff4444',
          border: '1px solid #cc0000',
          borderRadius: '50%',
          cursor: 'pointer',
          fontSize: '12px',
          color: 'white',
          padding: '0',
          width: '20px',
          height: '20px',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
        title="Delete note"
      >
        ×
      </button>
    </div>
  );
};

export default StickyNote;