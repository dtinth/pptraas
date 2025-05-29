import assert from 'node:assert'
import { mkdirSync, writeFileSync } from 'node:fs'
import test from 'node:test'

const apiKey = 'dummy'

test('hello world', async (t) => {
  await screenshotHtml('hello-world', '<h1>Hello World</h1>')
})

test('Thai language', async (t) => {
  await screenshotHtml(
    'thai-language',
    `<h1>สวัสดีชาวโลก</h1>
  <pre>เป็นมนุษย์สุดประเสริฐเลิศคุณค่า กว่าบรรดาฝูงสัตว์เดรัจฉาน
จงฝ่าฟันพัฒนาวิชาการ อย่าล้างผลาญฤๅเข่นฆ่าบีฑาใคร</pre>`,
  )
})

test('Emojis', async (t) => {
  await screenshotHtml(
    'emojis',
    // https://www.youtube.com/watch?v=TM93ntGYLGg
    `<h1>😲🙌👾🤖🤸👺🌠🤲👻🖐️🛸😀</h1>`,
  )
})

test('pdf', async (t) => {
  const html = `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <style>
        html, body {
          margin: 0;
          padding: 0;
        }
        .page {
          page-break-after: always;
          width: 100vw;
          height: 100vh;
          position: relative;
          overflow: hidden;
        }
        .page-content {
          position: absolute;
          inset: 1cm;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 48px;
          border: 2mm solid black;
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="page-content">Page 1</div>
      </div>
      <div class="page">
        <div class="page-content">Page 2</div>
      </div>
      <div class="page">
        <div class="page-content">Page 3</div>
      </div>
    </body>
  </html>
  `
  const response = await run(
    `(${async (html) => {
      await page.setContent(html)
      return page.pdf({ format: 'A4' })
    }})(${JSON.stringify(html)})`,
  )
  assert(response.ok, `HTTP ${response.status} ${response.statusText}`)
  const buffer = await response.arrayBuffer()
  const pdf = Buffer.from(buffer)
  mkdirSync('.data/screenshots', { recursive: true })
  writeFileSync('.data/screenshots/pdf-example.pdf', pdf)
})

test('Browser context isolation', async (t) => {
  const code1 = `(async () => {
    await page.setCookie({ name: 'testCookie', value: 'value1', url: 'about:blank' });
    // Add a small delay to increase likelihood of concurrent execution if run sequentially by server
    await new Promise(resolve => setTimeout(resolve, 100));
    return 'done';
  })()`;

  const code2 = `(async () => {
    const cookies = await page.cookies('about:blank');
    return cookies.find(c => c.name === 'testCookie');
  })()`;

  const [response1, response2] = await Promise.all([
    run(code1),
    run(code2)
  ]);

  const result1 = await response1.json();
  const result2 = await response2.json();

  assert.strictEqual(result1.result.data, 'done', 'First script should complete');
  assert.strictEqual(result2.result.data, undefined, 'Second script should not find cookie from first script');
})

async function run(code) {
  const response = await fetch('http://localhost:20279/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, apiKey }),
  })
  assert(response.ok, `HTTP ${response.status} ${response.statusText}`)
  return response
}

async function screenshot(name, code) {
  const response = await run(code)
  const buffer = await response.arrayBuffer()
  mkdirSync('.data/screenshots', { recursive: true })
  writeFileSync(`.data/screenshots/${name}.png`, Buffer.from(buffer))
}

async function screenshotHtml(name, html) {
  return screenshot(
    name,
    `(${async (html) => {
      await page.goto(
        `data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
      )
      return page.screenshot()
    }})(${JSON.stringify(html)})`,
  )
}
