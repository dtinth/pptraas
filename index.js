const functions = require('@google-cloud/functions-framework')
const puppeteer = require('puppeteer')
let browser

functions.http('screenshotter', async (req, res) => {
  try {
    if (!browser) {
      browser = await puppeteer.launch({
        args: ['--single-process', '--font-render-hinting=none'],
      })
    }
    const page = await browser.newPage()
    try {
      const fn = new Function('ctx', 'code', 'with(ctx){return eval(code)}')
      const code = req.body?.code || req.query?.code
      const type = req.body?.type || req.query?.type || 'png'
      await fn({ page, req }, code)
      const file = await page.screenshot({ type })
      res.setHeader(
        'Content-Type',
        type === 'jpeg' ? 'image/jpeg' : 'image/png',
      )
      res.send(file)
    } finally {
      await page.close()
    }
  } catch (error) {
    res.status(500).send(String(error))
    console.error(error)
  }
})
