import { fileURLToPath } from 'url'
import { defineNuxtModule, addServerHandler, addPlugin, createResolver,addImports, addTemplate } from '@nuxt/kit'
import { resolve } from 'pathe'
import fg from 'fast-glob'
import { Server as SocketServer, ServerOptions } from 'socket.io'
import {pathToFileURL} from 'url'

export interface ModuleOptions {
  addPlugin: boolean
  serverOptions: Partial<ServerOptions>
}

export function defineIOHandler (cb: (io: SocketServer) => void) {
  return cb
}

//add resolver to fix

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'inuxt3-socket.io',
    configKey: 'socket'
  },
  defaults: {
    addPlugin: true,
    serverOptions: {}
  },
  async setup (options, nuxt) {
    const extGlob = '**/*.{ts,js,mjs}'
    const files: string[] = []
    const resolver = createResolver(import.meta.url)

    const runtimeDir = 'runtime/' //fileURLToPath(new URL('./runtime', import.meta.url))
    // nuxt.options.build.transpile.push(runtimeDir)

    nuxt.hook('builder:watch', async (e, path) => {
      if (e === 'change') { return }
      if (path.includes('server/socket')) {
        await scanRemoteFunctions()
        await nuxt.callHook('builder:generateApp')
      }
    })

    await scanRemoteFunctions()

    addTemplate({
      filename: 'io-dev-functions.ts',
      write: true,
      getContents () {
        return `
          ${files.map((file, index) => `import function${index} from '${file.replace('.ts', '')}'`).join('\n')}
          export {
            ${files.map((_, index) => `function${index}`).join(',\n')}
          }
        `
      }
    })

    if (nuxt.options.dev) {
      let devFunctionsPath : any = null

      if (process.platform === "win32") {
        devFunctionsPath = pathToFileURL(resolver.resolve(nuxt.options.buildDir, 'io-dev-functions'))
      }else{
        devFunctionsPath = resolver.resolve(nuxt.options.buildDir, 'io-dev-functions')
      }
      nuxt.hook('listen', async (httpServer) => {
        const io = new SocketServer(httpServer, options.serverOptions)
        const functions = await import(devFunctionsPath)
        Object.keys(functions).forEach((fn) => {
          functions[fn](io)
        })
      })
    }

    if (options.addPlugin) {
      addPlugin(resolver.resolve(runtimeDir, 'plugin.client'))

      addImports([
        {
          name: 'useSocket',
          from: resolver.resolve(runtimeDir, 'composables')
        },
        {
          name: 'useIO',
          from: resolver.resolve(runtimeDir, 'composables')
        }
      ])
    }

    addServerHandler({
      middleware: true,
      handler: resolver.resolve(nuxt.options.buildDir, 'io-handler.ts')
    })

    addTemplate({
      filename: 'io-handler.ts',
      write: true,
      getContents () {
        return `
          import { createIOHandler } from '${resolver.resolve(runtimeDir, 'server')}';
          ${files.map((file, index) => `import function${index} from '${file.replace('.ts', '')}'`).join('\n')}
          export default createIOHandler({
            ${files.map((_, index) => `function${index}`).join(',\n')}
          }, ${JSON.stringify(options.serverOptions)})
        `
      }
    })

    async function scanRemoteFunctions () {
      files.length = 0
      const updatedFiles = await fg(extGlob, {
        cwd: resolver.resolve(nuxt.options.srcDir, 'server/socket'),
        absolute: true,
        onlyFiles: true
      })
      files.push(...new Set(updatedFiles))
      return files
    }
  }
})
