class WhiteboardChannel < ApplicationCable::Channel
  def subscribed
    whiteboard_id = params[:whiteboard_id] || 'default'
    stream_from "whiteboard_#{whiteboard_id}"
    
    # Send existing strokes to the newly connected user
    existing_strokes = Stroke.where(whiteboard_id: whiteboard_id)
    existing_strokes.each do |stroke|
      transmit({
        type: 'draw',
        stroke: {
          x: stroke.x,
          y: stroke.y,
          prevX: stroke.prev_x,
          prevY: stroke.prev_y,
          color: stroke.color,
          lineWidth: stroke.line_width
        }
      })
    end
    
    # Send existing sticky notes to the newly connected user
    existing_sticky_notes = StickyNote.where(whiteboard_id: whiteboard_id)
    existing_sticky_notes.each do |note|
      transmit({
        type: 'sticky_note_added',
        sticky_note: {
          id: note.id,
          text: note.text,
          x: note.x,
          y: note.y,
          color: note.color,
          width: note.width,
          height: note.height
        }
      })
    end
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  end

  def draw(data)
    whiteboard_id = params[:whiteboard_id] || 'default'
    stroke_data = data['stroke']
    
    # Save stroke to database
    Stroke.create!(
      whiteboard_id: whiteboard_id,
      x: stroke_data['x'],
      y: stroke_data['y'],
      prev_x: stroke_data['prevX'],
      prev_y: stroke_data['prevY'],
      color: stroke_data['color'],
      line_width: stroke_data['lineWidth']
    )
    
    # Broadcast to other users
    ActionCable.server.broadcast("whiteboard_#{whiteboard_id}", {
      type: 'draw',
      stroke: stroke_data
    })
  end

  def clear
    whiteboard_id = params[:whiteboard_id] || 'default'
    
    # Clear strokes and sticky notes from database
    Stroke.where(whiteboard_id: whiteboard_id).destroy_all
    StickyNote.where(whiteboard_id: whiteboard_id).destroy_all
    
    # Broadcast clear to all users
    ActionCable.server.broadcast("whiteboard_#{whiteboard_id}", {
      type: 'clear'
    })
  end

  def add_sticky_note(data)
    Rails.logger.info "Received add_sticky_note: #{data.inspect}"
    whiteboard_id = params[:whiteboard_id] || 'default'
    note_data = data['sticky_note']
    
    Rails.logger.info "Creating sticky note with data: #{note_data.inspect}"
    
    # Save sticky note to database
    sticky_note = StickyNote.create!(
      whiteboard_id: whiteboard_id,
      text: note_data['text'],
      x: note_data['x'],
      y: note_data['y'],
      color: note_data['color'] || '#ffeb3b',
      width: note_data['width'] || 200,
      height: note_data['height'] || 150
    )
    
    Rails.logger.info "Created sticky note: #{sticky_note.inspect}"
    
    # Broadcast to other users
    ActionCable.server.broadcast("whiteboard_#{whiteboard_id}", {
      type: 'sticky_note_added',
      sticky_note: {
        id: sticky_note.id,
        text: sticky_note.text,
        x: sticky_note.x,
        y: sticky_note.y,
        color: sticky_note.color,
        width: sticky_note.width,
        height: sticky_note.height
      }
    })
  end

  def update_sticky_note(data)
    whiteboard_id = params[:whiteboard_id] || 'default'
    note_data = data['sticky_note']
    
    sticky_note = StickyNote.find(note_data['id'])
    sticky_note.update!(
      text: note_data['text'],
      x: note_data['x'],
      y: note_data['y'],
      color: note_data['color'],
      width: note_data['width'],
      height: note_data['height']
    )
    
    # Broadcast to other users
    ActionCable.server.broadcast("whiteboard_#{whiteboard_id}", {
      type: 'sticky_note_updated',
      sticky_note: {
        id: sticky_note.id,
        text: sticky_note.text,
        x: sticky_note.x,
        y: sticky_note.y,
        color: sticky_note.color,
        width: sticky_note.width,
        height: sticky_note.height
      }
    })
  end

  def remove_sticky_note(data)
    whiteboard_id = params[:whiteboard_id] || 'default'
    note_id = data['sticky_note_id']
    
    StickyNote.find(note_id).destroy
    
    # Broadcast to other users
    ActionCable.server.broadcast("whiteboard_#{whiteboard_id}", {
      type: 'sticky_note_removed',
      sticky_note_id: note_id
    })
  end
end
