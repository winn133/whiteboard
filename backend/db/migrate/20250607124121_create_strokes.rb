class CreateStrokes < ActiveRecord::Migration[8.0]
  def change
    create_table :strokes do |t|
      t.float :x
      t.float :y
      t.float :prev_x
      t.float :prev_y
      t.string :color
      t.integer :line_width
      t.string :whiteboard_id

      t.timestamps
    end
  end
end
