from playwright.sync_api import sync_playwright
import time

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={"width": 1280, "height": 800})
    
    console_logs = []
    page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
    
    page.goto("http://localhost:8081/index.html", timeout=30000)
    page.wait_for_load_state("networkidle")
    
    print("=== Waiting 15s for GeoGebra CDN to load ===")
    page.wait_for_timeout(15000)
    
    page.screenshot(path="/workspace/ai-ggb-v2/test_screenshot.png", full_page=True)
    
    ggb_container = page.query_selector("#geogebra-container")
    if ggb_container:
        html = ggb_container.inner_html()
        print(f"geogebra-container innerHTML length: {len(html)}")
        print(f"Has canvas: {'canvas' in html.lower()}")
    
    loading = page.query_selector(".ggb-loading")
    print(f"Loading indicator present: {loading is not None}")
    
    ggb_ready = page.evaluate("() => typeof window.ggbAppletReady !== 'undefined' && window.ggbAppletReady")
    print(f"ggbAppletReady: {ggb_ready}")
    
    ggb_app = page.evaluate("() => typeof window.ggbApplet !== 'undefined'")
    print(f"ggbApplet exists: {ggb_app}")
    
    print("\n=== Console logs (GGB related) ===")
    for log in console_logs:
        if "GGB" in log or "geogebra" in log.lower():
            print(log)
    
    print("\n=== Console errors ===")
    for log in console_logs:
        if "[error]" in log:
            print(log)
    
    browser.close()
