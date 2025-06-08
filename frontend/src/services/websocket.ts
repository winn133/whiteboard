import { createConsumer } from '@rails/actioncable';

interface StrokeData {
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

interface WebSocketMessage {
  type: 'draw' | 'clear' | 'sticky_note_added' | 'sticky_note_updated' | 'sticky_note_removed';
  stroke?: StrokeData;
  sticky_note?: StickyNoteData;
  sticky_note_id?: number;
}

class WhiteboardWebSocket {
  private consumer: any;
  private subscription: any;
  private onDrawCallback?: (stroke: StrokeData) => void;
  private onClearCallback?: () => void;
  private onStickyNoteAddedCallback?: (note: StickyNoteData) => void;
  private onStickyNoteUpdatedCallback?: (note: StickyNoteData) => void;
  private onStickyNoteRemovedCallback?: (id: number) => void;

  constructor() {
    this.consumer = createConsumer('ws://localhost:3001/cable');
  }

  connect(whiteboardId: string = 'default') {
    this.subscription = this.consumer.subscriptions.create(
      {
        channel: 'WhiteboardChannel',
        whiteboard_id: whiteboardId
      },
      {
        received: (data: WebSocketMessage) => {
          if (data.type === 'draw' && data.stroke && this.onDrawCallback) {
            this.onDrawCallback(data.stroke);
          } else if (data.type === 'clear' && this.onClearCallback) {
            this.onClearCallback();
          } else if (data.type === 'sticky_note_added' && data.sticky_note && this.onStickyNoteAddedCallback) {
            this.onStickyNoteAddedCallback(data.sticky_note);
          } else if (data.type === 'sticky_note_updated' && data.sticky_note && this.onStickyNoteUpdatedCallback) {
            this.onStickyNoteUpdatedCallback(data.sticky_note);
          } else if (data.type === 'sticky_note_removed' && data.sticky_note_id && this.onStickyNoteRemovedCallback) {
            this.onStickyNoteRemovedCallback(data.sticky_note_id);
          }
        }
      }
    );
  }

  sendStroke(stroke: StrokeData) {
    if (this.subscription) {
      this.subscription.perform('draw', { stroke });
    }
  }

  sendClear() {
    if (this.subscription) {
      this.subscription.perform('clear');
    }
  }

  onDraw(callback: (stroke: StrokeData) => void) {
    this.onDrawCallback = callback;
  }

  onClear(callback: () => void) {
    this.onClearCallback = callback;
  }

  sendStickyNote(note: Omit<StickyNoteData, 'id'>) {
    if (this.subscription) {
      this.subscription.perform('add_sticky_note', { sticky_note: note });
    }
  }

  updateStickyNote(note: StickyNoteData) {
    if (this.subscription) {
      this.subscription.perform('update_sticky_note', { sticky_note: note });
    }
  }

  deleteStickyNote(id: number) {
    if (this.subscription) {
      this.subscription.perform('remove_sticky_note', { sticky_note_id: id });
    }
  }

  onStickyNoteAdded(callback: (note: StickyNoteData) => void) {
    this.onStickyNoteAddedCallback = callback;
  }

  onStickyNoteUpdated(callback: (note: StickyNoteData) => void) {
    this.onStickyNoteUpdatedCallback = callback;
  }

  onStickyNoteRemoved(callback: (id: number) => void) {
    this.onStickyNoteRemovedCallback = callback;
  }

  disconnect() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}

export default WhiteboardWebSocket;