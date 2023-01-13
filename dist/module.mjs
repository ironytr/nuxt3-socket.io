import { fileURLToPath } from 'url';
import { defineNuxtModule, addTemplate, addPlugin, addImports, addServerHandler } from '@nuxt/kit';
import { resolve } from 'pathe';
import fg from 'fast-glob';
import { Server } from 'socket.io';

function defineIOHandler(cb) {
  return cb;
}
const module = defineNuxtModule({
  meta: {
    name: "nuxt3-socket.io",
    configKey: "socket"
  },
  defaults: {
    addPlugin: true,
    serverOptions: {}
  },
  async setup(options, nuxt) {
    const extGlob = "**/*.{ts,js,mjs}";
    const files = [];
    const runtimeDir = fileURLToPath(new URL("./runtime", import.meta.url));
    nuxt.options.build.transpile.push(runtimeDir);
    nuxt.hook("builder:watch", async (e, path) => {
      if (e === "change") {
        return;
      }
      if (path.includes("server/socket")) {
        await scanRemoteFunctions();
        await nuxt.callHook("builder:generateApp");
      }
    });
    await scanRemoteFunctions();
    addTemplate({
      filename: "io-dev-functions.ts",
      write: true,
      getContents() {
        return `
          ${files.map((file, index) => `import function${index} from '${file.replace(".ts", "")}'`).join("\n")}
          export {
            ${files.map((_, index) => `function${index}`).join(",\n")}
          }
        `;
      }
    });
    if (nuxt.options.dev) {
      const devFunctionsPath = resolve(nuxt.options.buildDir, "io-dev-functions");
      nuxt.hook("listen", async (httpServer) => {
        const io = new Server(httpServer, options.serverOptions);
        const functions = await import(devFunctionsPath);
        Object.keys(functions).forEach((fn) => {
          functions[fn](io);
        });
      });
    }
    if (options.addPlugin) {
      addPlugin(resolve(runtimeDir, "plugin.client"));
      addImports([
        {
          name: "useSocket",
          from: resolve(runtimeDir, "composables")
        },
        {
          name: "useIO",
          from: resolve(runtimeDir, "composables")
        }
      ]);
    }
    addServerHandler({
      middleware: true,
      handler: resolve(nuxt.options.buildDir, "io-handler.ts")
    });
    addTemplate({
      filename: "io-handler.ts",
      write: true,
      getContents() {
        return `
          import { createIOHandler } from '${resolve(runtimeDir, "server")}';
          ${files.map((file, index) => `import function${index} from '${file.replace(".ts", "")}'`).join("\n")}
          export default createIOHandler({
            ${files.map((_, index) => `function${index}`).join(",\n")}
          }, ${JSON.stringify(options.serverOptions)})
        `;
      }
    });
    async function scanRemoteFunctions() {
      files.length = 0;
      const updatedFiles = await fg(extGlob, {
        cwd: resolve(nuxt.options.srcDir, "server/socket"),
        absolute: true,
        onlyFiles: true
      });
      files.push(...new Set(updatedFiles));
      return files;
    }
  }
});

export { module as default, defineIOHandler };
