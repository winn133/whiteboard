class CreateStickyNotes < ActiveRecord::Migration[8.0]
  def change
    create_table :sticky_notes do |t|
      t.string :whiteboard_id
      t.text :text
      t.float :x
      t.float :y
      t.string :color
      t.integer :width
      t.integer :height

      t.timestamps
    end
  end
end
