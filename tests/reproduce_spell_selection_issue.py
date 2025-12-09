import pytest
import re
from playwright.sync_api import Page, expect

def test_spell_selection_highlight(page: Page):
    # Load the app
    page.goto("http://localhost:5173/DQ/")

    # Wait for "たたかう" (Intro screen)
    # The intro button is the only command-button initially
    intro_btn = page.locator("button.command-button", has_text="たたかう")
    intro_btn.click()

    # Wait for Main Command Window to appear (it should have 4 buttons)
    page.wait_for_selector(".command-window button", state="visible")

    # --- Lorecia's Turn ---
    # Select "たたかう" (Fight)
    # Use specific locator for the active command window
    page.locator(".command-window:not(.inactive) button", has_text="たたかう").click()

    # Select "ぶきで こうげき" (Attack)
    # This is in the submenu-window
    page.locator(".submenu-window:not(.inactive) button", has_text="ぶきで こうげき").click()

    # Select Target "シドー" (Sidoh)
    # This is in the target-window
    page.locator(".target-window:not(.inactive) button", has_text="シドー").click()

    # --- Samaltria's Turn ---
    # Character switches, Command Window becomes active again
    # We might need a small wait or check for state change, but Playwright auto-waits for actionability.

    # Select "たたかう" (Fight)
    page.locator(".command-window:not(.inactive) button", has_text="たたかう").click()

    # Select "じゅもん" (Spell)
    # This is in the submenu-window
    spell_btn = page.locator(".submenu-window:not(.inactive) button", has_text="じゅもん")
    spell_btn.click()

    # Now we are in 'selectSpell' state.
    # The spell window should appear.
    page.wait_for_selector(".spell-window", state="visible")

    # "メラゾーマ" is a spell Samaltria has.
    expect(page.locator("span.spell-name", has_text="メラゾーマ")).to_be_visible()

    # The Submenu window should now be inactive
    # The "じゅもん" button inside it should be 'selected' (have the cursor)

    # We look for the button in the inactive submenu window
    inactive_spell_btn = page.locator(".submenu-window.inactive button", has_text="じゅもん")

    # Assert it has the 'selected' class
    # The failure here confirms the bug.
    expect(inactive_spell_btn).to_have_class(re.compile(r"selected"))
