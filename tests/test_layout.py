import pytest
from playwright.sync_api import Page, expect

def test_layout_elements(page: Page):
    # Navigate to the app
    page.goto("http://localhost:5173/DQ/")

    # Check for Party Window
    party_window = page.locator(".party-window")
    expect(party_window).to_be_visible()

    # Check margins for Party Window (top and left should be 8px)
    # We can check computed style
    box = party_window.bounding_box()
    # Note: bounding box gives absolute coordinates.
    # To check CSS values, we can evaluate JS
    top = page.eval_on_selector(".party-window", "el => getComputedStyle(el).top")
    left = page.eval_on_selector(".party-window", "el => getComputedStyle(el).left")
    assert top == "8px"
    assert left == "8px"

    # Check Message Box (Intro State)
    message_box = page.locator(".message-box")
    expect(message_box).to_be_visible()

    # Check margins for Message Box (bottom 8px)
    bottom = page.eval_on_selector(".message-box", "el => getComputedStyle(el).bottom")
    assert bottom == "8px"

    # Click to switch to command mode
    page.locator(".game-container").click()

    # Wait for transition (React state update)
    page.wait_for_timeout(500)

    # Check Command Window is visible
    command_section = page.locator(".command-section")
    expect(command_section).to_be_visible()

    # Check Message Box is hidden
    expect(message_box).not_to_be_visible()

    # Check margins for Command Section
    bottom_cmd = page.eval_on_selector(".command-section", "el => getComputedStyle(el).bottom")
    left_cmd = page.eval_on_selector(".command-section", "el => getComputedStyle(el).left")
    assert bottom_cmd == "8px"
    assert left_cmd == "8px"
