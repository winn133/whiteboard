# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2025_06_07_141313) do
  create_table "sticky_notes", force: :cascade do |t|
    t.string "whiteboard_id"
    t.text "text"
    t.float "x"
    t.float "y"
    t.string "color"
    t.integer "width"
    t.integer "height"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  create_table "strokes", force: :cascade do |t|
    t.float "x"
    t.float "y"
    t.float "prev_x"
    t.float "prev_y"
    t.string "color"
    t.integer "line_width"
    t.string "whiteboard_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end
end
