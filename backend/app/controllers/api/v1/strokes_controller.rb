class Api::V1::StrokesController < ApplicationController
  before_action :set_whiteboard_id

  def index
    strokes = Stroke.where(whiteboard_id: @whiteboard_id)
    render json: strokes
  end

  def create
    stroke = Stroke.new(stroke_params.merge(whiteboard_id: @whiteboard_id))
    
    if stroke.save
      render json: stroke, status: :created
    else
      render json: { errors: stroke.errors }, status: :unprocessable_entity
    end
  end

  def destroy
    Stroke.where(whiteboard_id: @whiteboard_id).destroy_all
    head :no_content
  end

  private

  def set_whiteboard_id
    @whiteboard_id = params[:whiteboard_id] || 'default'
  end

  def stroke_params
    params.require(:stroke).permit(:x, :y, :prev_x, :prev_y, :color, :line_width)
  end
end
