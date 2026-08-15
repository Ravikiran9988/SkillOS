const { chromium } = require('playwright-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.resolve(__dirname, '../../docs/screenshots');

async function captureAllScreenshots() {
  console.log('📸 Starting SkillOS High-Resolution Screenshot Capture...');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`  Created directory: ${OUTPUT_DIR}`);
  }

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2, // 2x Retina resolution
  });

  const page = await context.newPage();

  async function waitForApp() {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1200); // 1.2s buffer for API queries & CSS transitions
  }

  // 1. Dashboard Screenshot
  console.log('\n1. Capturing Dashboard (docs/screenshots/dashboard.png)...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await waitForApp();

  // Select Aditya Singh (student-5, Master's AI Researcher)
  const studentSelector = page.locator('select');
  if (await studentSelector.count() > 0) {
    await studentSelector.first().selectOption('student-5');
    await waitForApp();
  }

  const dashboardPath = path.join(OUTPUT_DIR, 'dashboard.png');
  await page.screenshot({ path: dashboardPath, fullPage: false });
  console.log(`   ✅ Saved: ${dashboardPath} (${(fs.statSync(dashboardPath).size / 1024).toFixed(1)} KB)`);

  // 2. Student Profile Screenshot
  console.log('\n2. Capturing Student Profile (docs/screenshots/profile.png)...');
  await page.goto('http://localhost:5173/profile', { waitUntil: 'networkidle' });
  await waitForApp();
  const profilePath = path.join(OUTPUT_DIR, 'profile.png');
  await page.screenshot({ path: profilePath, fullPage: false });
  console.log(`   ✅ Saved: ${profilePath} (${(fs.statSync(profilePath).size / 1024).toFixed(1)} KB)`);

  // 3. Career Skill Gap Analysis Screenshot
  console.log('\n3. Capturing Career Match / Skill Gap (docs/screenshots/career-match.png)...');
  await page.goto('http://localhost:5173/career/cr-airesearcher', { waitUntil: 'networkidle' });
  await waitForApp();
  const careerMatchPath = path.join(OUTPUT_DIR, 'career-match.png');
  await page.screenshot({ path: careerMatchPath, fullPage: false });
  console.log(`   ✅ Saved: ${careerMatchPath} (${(fs.statSync(careerMatchPath).size / 1024).toFixed(1)} KB)`);

  // 4. Prerequisite Learning Path Screenshot
  console.log('\n4. Capturing Prerequisite Learning Path (docs/screenshots/learning-path.png)...');
  const learningPathCard = page.locator('div:has-text("Prerequisite Learning Path")').last();
  if (await learningPathCard.count() > 0) {
    await learningPathCard.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
  }
  const learningPathPath = path.join(OUTPUT_DIR, 'learning-path.png');
  await page.screenshot({ path: learningPathPath, fullPage: false });
  console.log(`   ✅ Saved: ${learningPathPath} (${(fs.statSync(learningPathPath).size / 1024).toFixed(1)} KB)`);

  // 5. Recommended Jobs Screenshot
  console.log('\n5. Capturing Recommended Jobs (docs/screenshots/jobs.png)...');
  await page.goto('http://localhost:5173/jobs', { waitUntil: 'networkidle' });
  await waitForApp();
  const jobsPath = path.join(OUTPUT_DIR, 'jobs.png');
  await page.screenshot({ path: jobsPath, fullPage: false });
  console.log(`   ✅ Saved: ${jobsPath} (${(fs.statSync(jobsPath).size / 1024).toFixed(1)} KB)`);

  // 6. Projects & Skill Inference Screenshot
  console.log('\n6. Capturing Projects & Skill Inference (docs/screenshots/projects.png)...');
  await page.goto('http://localhost:5173/projects', { waitUntil: 'networkidle' });
  await waitForApp();
  const projectsPath = path.join(OUTPUT_DIR, 'projects.png');
  await page.screenshot({ path: projectsPath, fullPage: false });
  console.log(`   ✅ Saved: ${projectsPath} (${(fs.statSync(projectsPath).size / 1024).toFixed(1)} KB)`);

  // 7. Graph Visualizer Screenshot
  console.log('\n7. Capturing Graph Explorer (docs/screenshots/graph.png)...');
  await page.goto('http://localhost:5173/graph', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000); // 3s buffer for React Flow node positioning and graph edge routing
  await waitForApp();
  const graphPath = path.join(OUTPUT_DIR, 'graph.png');
  await page.screenshot({ path: graphPath, fullPage: false });
  console.log(`   ✅ Saved: ${graphPath} (${(fs.statSync(graphPath).size / 1024).toFixed(1)} KB)`);

  await browser.close();

  console.log('\n🎉 Successfully captured all 7 professional screenshots in docs/screenshots/!');
  process.exit(0);
}

captureAllScreenshots().catch(err => {
  console.error('❌ Screenshot capture error:', err);
  process.exit(1);
});
