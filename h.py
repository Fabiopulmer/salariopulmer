import asyncio, json, os
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(headless=True); c=await b.new_context(viewport={"width":1280,"height":1800}); pg=await c.new_page()
    errs=[]; pg.on("pageerror", lambda e: errs.append(str(e)))
    await pg.goto("http://localhost:8080")
    await pg.evaluate(f"localStorage.setItem({json.dumps(os.environ['LOVABLE_BROWSER_SUPABASE_STORAGE_KEY'])},{json.dumps(os.environ['LOVABLE_BROWSER_SUPABASE_SESSION_JSON'])})")
    await pg.goto("http://localhost:8080/"); await pg.wait_for_timeout(3000)
    await pg.locator("#mesRef").fill("12/2026"); await pg.wait_for_timeout(1500)
    t=await pg.locator("body").inner_text(); i=t.find("Férias (Dezembro)"); print(t[i:i+500])
    await pg.goto("http://localhost:8080/historico"); await pg.wait_for_timeout(3000)
    t=await pg.locator("body").inner_text(); i=t.find("Resumo Mensal"); print(t[i:i+400])
    print("legend:", await pg.get_by_text("Férias (líq.)").count(), "errs:", errs)
    await b.close()
asyncio.run(main())
