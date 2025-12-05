import pytest
from playwright.sync_api import Page, expect

@pytest.fixture(scope="function")
def game_page(page: Page):
    page.goto("http://localhost:5173/DQ/")
    # Wait for the game container to load
    page.wait_for_selector(".game-container")
    return page

def test_intro_state_layout(game_page: Page):
    """
    Intro State:
    - Command Window (Start Button) should be visible and at Bottom Left.
    - Message Window should NOT be visible (Mutually Exclusive).
    - Party Window should be visible at Bottom Right.
    """
    # Intro button "たたかう"
    fight_btn = game_page.get_by_role("button", name="たたかう")
    expect(fight_btn).to_be_visible()

    # Check Position: Bottom Left (approx)
    btn_box = fight_btn.bounding_box()
    game_box = game_page.locator(".game-board").bounding_box()

    # Center of button should be in the left half
    assert (btn_box['x'] + btn_box['width']/2) < (game_box['x'] + game_box['width']/2)

    # Message Window check
    # In this design, Message Window is hidden when Command is active
    msg_box = game_page.locator(".message-box")
    expect(msg_box).not_to_be_visible()

    # Party Window check
    party_win = game_page.locator(".party-window")
    expect(party_win).to_be_visible()
    # Check Position: Bottom Right
    party_box = party_win.bounding_box()
    # Center of party window should be in the right half
    assert (party_box['x'] + party_box['width']/2) > (game_box['x'] + game_box['width']/2)

def test_command_state_layout(game_page: Page):
    """
    Command State (after clicking Start):
    - Command Window should be visible at Bottom Left.
    - Message Window should NOT be visible.
    - We verify we are in command state by checking for other buttons like 'Run'.
    """
    # Click Start (Intro)
    game_page.get_by_role("button", name="たたかう").click()

    # Wait for "Run" button to appear (confirms we are in Command state)
    run_btn = game_page.get_by_role("button", name="にげる")
    expect(run_btn).to_be_visible()

    # Verify Command Window container
    cmd_window = game_page.locator(".command-window")
    expect(cmd_window).to_be_visible()

    # Check Position: Bottom Left
    cmd_box = cmd_window.bounding_box()
    game_box = game_page.locator(".game-board").bounding_box()

    assert (cmd_box['x'] + cmd_box['width']/2) < (game_box['x'] + game_box['width']/2)

    # Message Window Hidden
    msg_box = game_page.locator(".message-box")
    expect(msg_box).not_to_be_visible()

def test_battle_state_layout(game_page: Page):
    """
    Battle State (during attack animation):
    - Message Window should be visible and CENTERED.
    - Command Window should NOT be visible.
    """
    # Navigate to Attack
    # 1. Start Game
    game_page.get_by_role("button", name="たたかう").click()

    # 2. Wait for Command Menu and Click Fight
    # Use explicit locator to ensure we click the command menu button
    game_page.get_by_role("button", name="にげる").wait_for() # Wait for menu load
    game_page.locator(".command-grid > button").filter(has_text="たたかう").click()

    # 3. Select Weapon (Submenu)
    game_page.locator(".submenu-list > button").filter(has_text="ぶきで こうげき").click()

    # Now animating. Message box should appear.
    msg_box = game_page.locator(".message-box")
    expect(msg_box).to_be_visible()

    # Check Centering
    msg_box_box = msg_box.bounding_box()
    game_box = game_page.locator(".game-board").bounding_box()

    msg_center = msg_box_box['x'] + msg_box_box['width'] / 2
    game_center = game_box['x'] + game_box['width'] / 2

    # Allow small pixel difference (e.g. subpixel rendering)
    assert abs(msg_center - game_center) < 2.0, f"Message box not centered. Msg: {msg_center}, Game: {game_center}"

    # Command Window Hidden
    cmd_window = game_page.locator(".command-window")
    expect(cmd_window).not_to_be_visible()
