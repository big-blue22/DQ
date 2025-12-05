from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto("http://localhost:5173/DQ/")

        # Screenshot 1: Intro Message
        page.screenshot(path="verification/dq2_intro_message.png")

        # Click to go to command
        page.locator(".game-container").click()
        page.wait_for_timeout(1000) # Wait for anim

        # Screenshot 2: Intro Command
        page.screenshot(path="verification/dq2_intro_command.png")

        # Click 'たたかう' (Fight) - should go to main command menu
        # The button is .command-button.selected in intro_command
        page.locator("button.command-button").click()
        page.wait_for_timeout(1000)

        # Screenshot 3: Battle Command
        page.screenshot(path="verification/dq2_battle_command.png")

        browser.close()

if __name__ == "__main__":
    run()
