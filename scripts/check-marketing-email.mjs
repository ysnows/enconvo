#!/usr/bin/env node
// Checks marketing emails (product updates, newsletters, offers) before they go out. Each one
// needs a working unsubscribe link and the company's postal address (CAN-SPAM; PECR and GDPR in
// the UK and EU), and must go only to contacts who opted in, which the Resend audience handles.
//
//   node scripts/check-marketing-email.mjs <email.html>...        # composed files
//   RESEND_API_KEY=re_... node scripts/check-marketing-email.mjs --resend
//                                                                  # every draft or scheduled Broadcast
//
// The postal address is read from src/data/legal.ts (COMPANY_POSTAL_ADDRESS). Exits 1 if any
// email fails, listing what is missing.

import { readFile } from 'node:fs/promises'

const UNSUBSCRIBE_TAG = '{{{RESEND_UNSUBSCRIBE_URL}}}'
const SIGNED_UNSUBSCRIBE = 'https://api.enconvo.com/api/email-preferences/unsubscribe?'
const COMPANY = 'THE GREAT LIONHEART PTE. LTD.'

async function postalAddress() {
  const source = await readFile(new URL('../src/data/legal.ts', import.meta.url), 'utf8')
  const match = /COMPANY_POSTAL_ADDRESS:\s*string\s*\|\s*null\s*=\s*(null|'([^']*)'|"([^"]*)")/.exec(source)
  return match?.[2] ?? match?.[3] ?? null
}

const normalize = (text) =>
  text
    .replace(/&nbsp;|&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')

/** What `html` (and its plain-text part, when there is one) is missing. */
export function problems({ html, text }, address) {
  const found = []
  const body = normalize(html || '')
  if (!body.includes(UNSUBSCRIBE_TAG) && !body.includes(SIGNED_UNSUBSCRIBE))
    found.push(`no unsubscribe link (${UNSUBSCRIBE_TAG})`)
  if (!body.includes(COMPANY)) found.push(`no company name (${COMPANY})`)
  if (!address)
    found.push('COMPANY_POSTAL_ADDRESS in src/data/legal.ts is not filled in')
  else if (!body.includes(normalize(address)))
    found.push(`no postal address (${address})`)
  if (body.includes('{{company_postal_address}}'))
    found.push('the {{company_postal_address}} placeholder was not replaced')
  if (text) {
    const plain = normalize(text)
    if (!plain.includes(UNSUBSCRIBE_TAG) && !plain.includes(SIGNED_UNSUBSCRIBE))
      found.push('plain-text part has no unsubscribe link')
  }
  return found
}

async function resend(path) {
  const response = await fetch(`https://api.resend.com${path}`, {
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
  })
  if (!response.ok) throw new Error(`Resend ${path} answered ${response.status}`)
  return response.json()
}

async function main() {
  const args = process.argv.slice(2)
  const address = await postalAddress()
  const emails = []
  if (args.includes('--resend')) {
    if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is required with --resend')
    const list = await resend('/broadcasts')
    for (const item of list.data ?? []) {
      if (!['draft', 'scheduled', 'queued'].includes(item.status)) continue
      const broadcast = await resend(`/broadcasts/${item.id}`)
      emails.push({ label: `Broadcast "${broadcast.name || broadcast.subject}" (${item.id})`, ...broadcast })
    }
  }
  for (const file of args.filter((arg) => !arg.startsWith('--'))) {
    emails.push({ label: file, html: await readFile(file, 'utf8') })
  }
  if (!emails.length) {
    console.log('Nothing to check. Pass HTML files, or --resend with RESEND_API_KEY.')
    return
  }
  let failed = 0
  for (const email of emails) {
    const found = problems(email, address)
    if (found.length) {
      failed += 1
      console.log(`FAIL ${email.label}\n  - ${found.join('\n  - ')}`)
    } else {
      console.log(`PASS ${email.label}`)
    }
  }
  if (failed) process.exit(1)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error.message)
    process.exit(1)
  })
}
