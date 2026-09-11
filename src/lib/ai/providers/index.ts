import type { AIProvider, ProviderName } from './types'
import { OpenAIProvider } from './openai'
import { GeminiProvider } from './gemini'
import { AnthropicProvider } from './anthropic'

export type { AIProvider, ProviderName } from './types'

const REGISTRY: Record<ProviderName, () => AIProvider> = {
  openai: () => new OpenAIProvider(),
  gemini: () => new GeminiProvider(),
  anthropic: () => new AnthropicProvider(),
}

const ENV_KEY_FOR: Record<ProviderName, string> = {
  openai: 'OPENAI_API_KEY',
  gemini: 'GEMINI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
}

export function isProviderAvailable(name: ProviderName): boolean {
  return !!process.env[ENV_KEY_FOR[name]]
}

export function availableProviders(): ProviderName[] {
  return (Object.keys(REGISTRY) as ProviderName[]).filter(isProviderAvailable)
}

/** The rest of Tarmac calls this and never imports a provider class directly — swap or
 *  add a provider by registering it here only. Throws (does not silently fall back)
 *  when the requested provider has no configured key, per the spec's fail-fast rule. */
export function getProvider(name: ProviderName): AIProvider {
  if (!isProviderAvailable(name)) {
    throw new Error(`Provider "${name}" has no ${ENV_KEY_FOR[name]} configured in this environment.`)
  }
  return REGISTRY[name]()
}
