import pytest
from playwright.sync_api import Page, expect

@pytest.fixture(scope="function")
def game_page(page: Page):
    page.goto("http://localhost:5173/DQ/")
    # Wait for the game container to load
    page.wait_for_selector(".game-container")
    return page

def test_intro_layout_no_overlap(game_page: Page):
    """
    Verifies that in the intro state, the 'Fight' button and the Message Box
    do not overlap and are positioned correctly (Command Left, Message Right).
    """
    # Wait for initial state
    message_box = game_page.locator(".message-text").first
    # The current code uses .command-container for the intro button
    # But we want to check whatever contains the "Fight" button
    fight_button = game_page.get_by_role("button", name="たたかう")

    expect(message_box).to_be_visible()
    expect(fight_button).to_be_visible()

    msg_box = message_box.locator("..") # Get parent .message-box

    # Get bounding boxes
    msg_bbox = msg_box.bounding_box()
    btn_bbox = fight_button.bounding_box()

    # Check for overlap
    # Rectangles overlap if:
    # l1.x < l2.x + l2.w && l1.x + l1.w > l2.x &&
    # l1.y < l2.y + l2.h && l1.y + l1.h > l2.y

    overlap_x = (msg_bbox['x'] < btn_bbox['x'] + btn_bbox['width']) and \
                (msg_bbox['x'] + msg_bbox['width'] > btn_bbox['x'])
    overlap_y = (msg_bbox['y'] < btn_bbox['y'] + btn_bbox['height']) and \
                (msg_bbox['y'] + msg_bbox['height'] > btn_bbox['y'])

    is_overlapping = overlap_x and overlap_y

    print(f"Overlap check: X={overlap_x}, Y={overlap_y}, IsOverlapping={is_overlapping}")

    if is_overlapping:
        pytest.fail("The Fight button overlaps with the Message Box!")

def test_command_layout_position(game_page: Page):
    """
    Verifies that after clicking Fight, the Command Window is on the left
    and Message Window is on the right (or at least valid layout).
    """
    fight_button = game_page.get_by_role("button", name="たたかう")
    fight_button.click()

    # Now in command state
    # Wait for command window
    command_window = game_page.locator(".command-window")
    expect(command_window).to_be_visible()

    # In the NEW layout, we expect a message box to be visible to the right?
    # Or at least the command window should be to the left.

    cmd_bbox = command_window.bounding_box()

    # Check if it is on the left side of the screen/game-board
    game_board = game_page.locator(".game-board").bounding_box()

    # Center of command window
    cmd_center_x = cmd_bbox['x'] + cmd_bbox['width'] / 2
    board_center_x = game_board['x'] + game_board['width'] / 2

    # It should be on the left half
    assert cmd_center_x < board_center_x, "Command window should be on the left side"
