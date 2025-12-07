import pytest
import re
from playwright.sync_api import Page, expect

def test_keyboard_navigation(page: Page):
    # Navigate to the app
    page.goto("http://localhost:5173/DQ/")

    # Wait for the game to load
    expect(page.locator(".command-button")).to_have_text("たたかう")

    # Initial State: "たたかう" should be selected
    expect(page.locator(".command-button.selected")).to_be_visible()

    # Press Enter to Start Game
    page.keyboard.press("Enter")

    # Wait for command menu
    # "たたかう", "にげる", "ぼうぎょ", "どうぐ"
    expect(page.locator("button", has_text="たたかう")).to_be_visible()
    expect(page.locator("button", has_text="にげる")).to_be_visible()

    # By default, first item "たたかう" should be selected
    expect(page.locator("button", has_text="たたかう")).to_have_class(re.compile(r".*selected.*"))

    # Press Down -> "にげる"
    page.keyboard.press("ArrowDown")
    expect(page.locator("button", has_text="にげる")).to_have_class(re.compile(r".*selected.*"))
    expect(page.locator("button", has_text="たたかう")).not_to_have_class(re.compile(r".*selected.*"))

    # Press Down -> "ぼうぎょ"
    page.keyboard.press("KeyS") # Testing WASD support
    expect(page.locator("button", has_text="ぼうぎょ")).to_have_class(re.compile(r".*selected.*"))

    # Press Up -> "にげる"
    page.keyboard.press("ArrowUp")
    expect(page.locator("button", has_text="にげる")).to_have_class(re.compile(r".*selected.*"))

    # Loop Check: Press Up from first item -> Last item ("どうぐ")
    # Move to top
    page.keyboard.press("ArrowUp") # -> たたかう
    expect(page.locator("button", has_text="たたかう")).to_have_class(re.compile(r".*selected.*"))

    page.keyboard.press("ArrowUp") # -> どうぐ (Loop)
    expect(page.locator("button", has_text="どうぐ")).to_have_class(re.compile(r".*selected.*"))

    # Cancel/Back Check
    # Select "たたかう" -> "selectAttackType"
    page.keyboard.press("ArrowDown") # -> たたかう
    page.keyboard.press("Enter")

    # Should see sub-menu
    expect(page.locator("button", has_text="ぶきで こうげき")).to_be_visible()

    # Press Escape -> Back to command menu
    page.keyboard.press("Escape")
    expect(page.locator("button", has_text="にげる")).to_be_visible() # Command menu visible

    # Test Enter functionality
    # Select "たたかう" again
    # Note: Resetting state to 'command' usually resets index to 0 ("たたかう")
    expect(page.locator("button", has_text="たたかう")).to_have_class(re.compile(r".*selected.*"))
    page.keyboard.press("Enter")

    # Select "ぶきで こうげき" (first item) for Character 1
    page.keyboard.press("Space")

    # Character 2 Command Phase
    # Should stay in command mode, Message Box should remain hidden (or not processing yet)
    expect(page.locator(".command-window")).to_be_visible()

    # Select "たたかう" -> "ぶきで こうげき" for Character 2
    expect(page.locator("button", has_text="たたかう")).to_have_class(re.compile(r".*selected.*"))
    page.keyboard.press("Enter")
    expect(page.locator("button", has_text="ぶきで こうげき")).to_be_visible()
    page.keyboard.press("Space")

    # Character 3 Command Phase
    expect(page.locator(".command-window")).to_be_visible()

    # Select "たたかう" -> "ぶきで こうげき" for Character 3
    expect(page.locator("button", has_text="たたかう")).to_have_class(re.compile(r".*selected.*"))
    page.keyboard.press("Enter")
    expect(page.locator("button", has_text="ぶきで こうげき")).to_be_visible()
    page.keyboard.press("Space")

    # NOW all commands are entered. Battle Phase starts.
    # Logic: "command" mode ends, message box appears
    expect(page.locator(".message-box")).to_be_visible()
    expect(page.locator(".message-text")).to_contain_text("の こうげき!")
