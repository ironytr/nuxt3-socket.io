
import { ModuleOptions } from './module'

declare module '@nuxt/schema' {
  interface NuxtConfig { ['socket']?: Partial<ModuleOptions> }
  interface NuxtOptions { ['socket']?: ModuleOptions }
}


export { ModuleOptions, default, defineIOHandler } from './module'
