import fs from 'fs'
import path from 'path'
import { DEFAULT_FAQS, type FAQItem } from './faq-data'

export type { FAQItem }
export { DEFAULT_FAQS }

const FAQ_STORAGE_PATH = path.join(process.cwd(), 'data', 'portal-faqs.json')

export async function getPortalFaqs(): Promise<FAQItem[]> {
  try {
    if (fs.existsSync(FAQ_STORAGE_PATH)) {
      const raw = fs.readFileSync(FAQ_STORAGE_PATH, 'utf-8')
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (err) {
    console.error('Error reading portal faqs:', err)
  }
  return DEFAULT_FAQS
}

export async function savePortalFaqs(faqs: FAQItem[]): Promise<void> {
  const dir = path.dirname(FAQ_STORAGE_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(FAQ_STORAGE_PATH, JSON.stringify(faqs, null, 2), 'utf-8')
}
