from playwright.sync_api import Page, expect

def test_message_window_hidden_in_command_mode(page: Page):
    """
    Verifies that the message window is hidden when the command window is visible.
    """
    page.goto("http://localhost:5173/DQ/")

    # Wait for the game to load
    page.wait_for_selector(".game-container")

    # 1. Check INTRO state
    # Command window (Start button) should be visible
    command_window = page.locator(".command-window")
    expect(command_window).to_be_visible()

    # Message box should be HIDDEN in this state per user requirement
    message_box = page.locator(".message-box")
    expect(message_box).not_to_be_visible()

    # 2. Transition to COMMAND state (click 'たたかう' / Start)
    # The intro button has class 'command-button selected' and text 'たたかう'
    page.get_by_role("button", name="たたかう").click()

    # Wait for transition (command buttons appear: Fight, Run, Defend, Item)
    # Note: 'たたかう' button exists in both, but layout changes.
    # We can wait for 'にげる' (Run) to ensure we are in the main command menu.
    run_button = page.get_by_role("button", name="にげる")
    expect(run_button).to_be_visible()

    # Command window should still be visible
    expect(command_window).to_be_visible()

    # Message box should STILL be HIDDEN
    expect(message_box).not_to_be_visible()

def test_message_window_visible_during_animation(page: Page):
    """
    Verifies that the message window reappears during animation/action execution.
    """
    page.goto("http://localhost:5173/DQ/")

    # Click start
    page.get_by_role("button", name="たたかう").click()

    # Select 'にげる' (Run) for Character 1
    page.get_by_role("button", name="にげる").click()

    # Select 'にげる' (Run) for Character 2
    # Ensure we are ready for input
    expect(page.get_by_role("button", name="にげる")).to_be_visible()
    page.get_by_role("button", name="にげる").click()

    # Select 'にげる' (Run) for Character 3
    expect(page.get_by_role("button", name="にげる")).to_be_visible()
    page.get_by_role("button", name="にげる").click()

    # Now an action is executing (animating=true).
    # The command window should disappear (or be disabled/replaced) and message box should appear.

    # In the current code:
    # isCommandMode = ... && !animating;
    # If animating is true, isCommandMode is false.
    # If isCommandMode is false, we expect:
    # 1. Command section might disappear (or bottom panel mode changes).
    # 2. Message box should APPEAR.

    message_box = page.locator(".message-box")
    expect(message_box).to_be_visible()

    # Check text content to ensure it's displaying something
    # "xxxは にげだした!"
    expect(message_box).to_contain_text("にげだした")
