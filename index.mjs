// @ts-check

import Fastify from 'fastify'
import { writeFileSync } from 'fs'
import puppeteer from 'puppeteer'

writeFileSync(
  `${process.env.HOME}/.fonts.conf`,
  `<?xml version='1.0'?>
<!DOCTYPE fontconfig SYSTEM 'fonts.dtd'>
<fontconfig>
  <alias>
    <family>sans-serif</family>
    <prefer>
      <family>Liberation Sans</family>
    </prefer>
  </alias>
  <alias>
    <family>monospace</family>
    <prefer>
      <family>Liberation Mono</family>
    </prefer>
  </alias>
</fontconfig>`,
)

const fastify = Fastify({ logger: true })

let browser

fastify.post('/run', async (request, reply) => {
  let pageCreated = false
  try {
    if (!browser) {
      browser = await puppeteer.launch({
        args: ['--no-sandbox', '--font-render-hinting=none'],
      })
    }
    const page = await browser.newPage()
    pageCreated = true
    try {
      const fn = new Function('ctx', 'code', 'with(ctx){return eval(code)}')
      const body = /** @type {Record<string, string | undefined>} */ (
        request.body || {}
      )
      const code = body.code
      const type = body.type || 'png'
      const result = await fn({ page, req: request }, code)
      if (Buffer.isBuffer(result)) {
        reply.type(type === 'png' ? 'image/png' : 'image/jpeg')
        return result
      } else {
        return result
      }
    } finally {
      await page.close()
    }
  } catch (error) {
    if (!pageCreated) {
      // Consider the container failed if the page cannot be created
      setTimeout(() => {
        process.exit(1)
      })
    }

    fastify.log.error(error)
    reply.code(500)
    return {
      error: String(error?.stack || error),
    }
  }
})

fastify.listen({ port: Number(process.env.PORT) || 20279, host: '0.0.0.0' })
