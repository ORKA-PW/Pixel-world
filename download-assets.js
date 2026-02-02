import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const ASSETS_DIR = './public/assets';

async function main() {
    console.log('🚀 Launching browser...');
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
    });
    
    const page = await browser.newPage();
    
    // Evade bot detection
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });
    
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('📄 Navigating to LimeZu Modern Interiors...');
    await page.goto('https://limezu.itch.io/moderninteriors', { 
        waitUntil: 'networkidle0',
        timeout: 60000 
    });
    
    // Wait for the page to fully load (itch.io has a loading screen)
    console.log('⏳ Waiting for page to load...');
    await new Promise(r => setTimeout(r, 5000));
    
    // Take a screenshot
    await page.screenshot({ path: `${ASSETS_DIR}/page-screenshot.png`, fullPage: true });
    console.log('📸 Screenshot saved');
    
    const title = await page.title();
    console.log('📄 Page title:', title);
    
    // Get page HTML structure
    const bodyText = await page.evaluate(() => document.body.innerText.substring(0, 2000));
    console.log('📝 Page content preview:', bodyText.substring(0, 500));
    
    // Look for download-related elements
    const downloadInfo = await page.evaluate(() => {
        const results = {
            buttons: [],
            links: [],
            forms: []
        };
        
        // Find all buttons
        document.querySelectorAll('button, .button, a.btn').forEach(el => {
            results.buttons.push({ text: el.textContent.trim(), class: el.className });
        });
        
        // Find download links
        document.querySelectorAll('a[href*="download"], a.download').forEach(el => {
            results.links.push({ href: el.href, text: el.textContent.trim() });
        });
        
        // Find the upload info
        const uploadInfo = document.querySelector('.upload');
        if (uploadInfo) {
            results.uploadInfo = uploadInfo.textContent.trim();
        }
        
        return results;
    });
    
    console.log('🔍 Download info:', JSON.stringify(downloadInfo, null, 2));
    
    // Try clicking the download button
    try {
        const downloadBtn = await page.$('.download_btn');
        if (downloadBtn) {
            console.log('🖱️ Clicking download button...');
            await downloadBtn.click();
            await new Promise(r => setTimeout(r, 3000));
            await page.screenshot({ path: `${ASSETS_DIR}/after-download-click.png`, fullPage: true });
            
            // Check for "No thanks" option
            const noThanks = await page.$('a.reward_ignore, button:has-text("No thanks")');
            if (noThanks) {
                console.log('🖱️ Clicking "No thanks"...');
                await noThanks.click();
                await new Promise(r => setTimeout(r, 3000));
            }
            
            // Get download links after clicking
            const fileLinks = await page.evaluate(() => {
                const links = [];
                document.querySelectorAll('.upload_list_widget a, a.download_file_btn').forEach(el => {
                    links.push({ href: el.href, text: el.textContent.trim() });
                });
                return links;
            });
            console.log('📦 File links:', fileLinks);
        }
    } catch (e) {
        console.log('⚠️ Click error:', e.message);
    }
    
    await browser.close();
    console.log('✅ Done');
}

main().catch(console.error);
