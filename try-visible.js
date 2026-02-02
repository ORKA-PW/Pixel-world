import puppeteer from 'puppeteer';

async function main() {
    console.log('🚀 Launching VISIBLE browser...');
    
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--start-maximized']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    console.log('📄 Navigating to itch.io...');
    await page.goto('https://limezu.itch.io/moderninteriors', { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
    });
    
    console.log('⏳ Waiting 15s for potential captcha solving...');
    await new Promise(r => setTimeout(r, 15000));
    
    const title = await page.title();
    console.log('📄 Page title:', title);
    
    await page.screenshot({ path: './public/assets/visible-browser.png', fullPage: true });
    console.log('📸 Screenshot saved');
    
    // Keep browser open for a bit
    console.log('🔍 Keeping browser open for 10 more seconds...');
    await new Promise(r => setTimeout(r, 10000));
    
    await browser.close();
    console.log('✅ Done');
}

main().catch(console.error);
