import re
from playwright.sync_api import Page, expect

def test_sidoh_image_update(page: Page):
    """
    Verifies that the Sidoh image is correctly updated to the new asset
    and is visible on the page.
    """
    # Navigate to the game page
    page.goto("http://localhost:5173/DQ/")

    # Locate the enemy image
    enemy_image = page.locator(".enemy-image")

    # Verify the image is visible
    expect(enemy_image).to_be_visible()

    # Verify the src attribute contains the new filename
    # Note: Vite might hash the filename, so we check if it contains the base name or if the import worked.
    # Usually in dev mode, it preserves the name.
    src = enemy_image.get_attribute("src")
    assert "sidoh_final" in src, f"Expected 'sidoh_final' in image source, but got: {src}"

    print("Verification successful: New Sidoh image is loaded.")
