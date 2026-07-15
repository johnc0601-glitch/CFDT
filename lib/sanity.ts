import {createClient} from '@sanity/client'

const projectId =
  process.env.SANITY_PROJECT_ID ||
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||
  'vluqmdns'

const dataset =
  process.env.SANITY_DATASET ||
  process.env.NEXT_PUBLIC_SANITY_DATASET ||
  'production'

const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION ||
  '2026-07-08'

export const sanityConfig = {
  projectId,
  dataset,
  apiVersion,
}

export const sanity = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false,
  perspective: 'published',
})
