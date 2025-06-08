require "test_helper"

class Api::V1::StickyNotesControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get api_v1_sticky_notes_url
    assert_response :success
  end

  test "should create sticky note" do
    post api_v1_sticky_notes_url, params: { 
      sticky_note: { 
        text: "Test note", 
        x: 100, 
        y: 100, 
        color: "#ffeb3b", 
        width: 200, 
        height: 150 
      } 
    }
    assert_response :created
  end

  test "should update sticky note" do
    sticky_note = StickyNote.create!(
      whiteboard_id: "default",
      text: "Test note", 
      x: 100, 
      y: 100, 
      color: "#ffeb3b", 
      width: 200, 
      height: 150
    )
    
    patch api_v1_sticky_note_url(sticky_note), params: { 
      sticky_note: { text: "Updated note" }
    }
    assert_response :success
  end

  test "should destroy sticky note" do
    sticky_note = StickyNote.create!(
      whiteboard_id: "default",
      text: "Test note", 
      x: 100, 
      y: 100, 
      color: "#ffeb3b", 
      width: 200, 
      height: 150
    )
    
    delete api_v1_sticky_note_url(sticky_note)
    assert_response :no_content
  end
end
