class Api::V1::StickyNotesController < ApplicationController
  before_action :set_whiteboard_id
  before_action :set_sticky_note, only: [:update, :destroy]

  def index
    sticky_notes = StickyNote.where(whiteboard_id: @whiteboard_id)
    render json: sticky_notes
  end

  def create
    sticky_note = StickyNote.new(sticky_note_params.merge(whiteboard_id: @whiteboard_id))
    
    if sticky_note.save
      render json: sticky_note, status: :created
    else
      render json: { errors: sticky_note.errors }, status: :unprocessable_entity
    end
  end

  def update
    if @sticky_note.update(sticky_note_params)
      render json: @sticky_note
    else
      render json: { errors: @sticky_note.errors }, status: :unprocessable_entity
    end
  end

  def destroy
    @sticky_note.destroy
    head :no_content
  end

  private

  def set_whiteboard_id
    @whiteboard_id = params[:whiteboard_id] || 'default'
  end

  def set_sticky_note
    @sticky_note = StickyNote.find(params[:id])
  end

  def sticky_note_params
    params.require(:sticky_note).permit(:text, :x, :y, :color, :width, :height)
  end
end
