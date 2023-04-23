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
  const body = /** @type {Record<string, string | undefined>} */ (
    request.body || {}
  )

  if (process.env.API_KEY) {
    if (body.apiKey !== process.env.API_KEY) {
      reply.code(401)
      return {
        error: {
          message: 'Unauthorized',
          code: -32001,
          data: { code: 'UNAUTHORIZED' },
        },
      }
    }
  }

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
      const fn = new Function('__ctx', 'code', 'with(__ctx){return eval(code)}')
      const code = body.code
      const type = body.type || 'png'
      const result = await fn({ page, request, reply }, code)
      if (Buffer.isBuffer(result)) {
        reply.type(type === 'png' ? 'image/png' : 'image/jpeg')
        return result
      } else {
        return { result: { data: result } }
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
      error: {
        message: error?.message || String(error),
        code: -32603,
        data: {
          code: 'INTERNAL_SERVER_ERROR',
          stack: String(error?.stack || error),
        },
      },
    }
  }
})

fastify.listen({ port: Number(process.env.PORT) || 20279, host: '0.0.0.0' })
