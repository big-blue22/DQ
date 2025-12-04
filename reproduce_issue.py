import time
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto("http://localhost:5173/DQ/")

        # Wait for the intro screen to load
        page.wait_for_selector(".game-container")
        time.sleep(2) # Ensure fonts and everything loaded

        # Screenshot Intro
        page.screenshot(path="intro_state_original.png")
        print("Captured intro_state_original.png")

        # Click 'Start/Fight' to go to Command state
        page.click(".start-button")
        time.sleep(1)

        # Screenshot Command State
        page.screenshot(path="command_state_original.png")
        print("Captured command_state_original.png")

        browser.close()

if __name__ == "__main__":
    run()
