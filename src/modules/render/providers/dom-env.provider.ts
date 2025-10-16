import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'

// happy-dom will overwrite the global fetch, so we save the original fetch here
// for some services that need to use the original fetch
// like the small-file-upload.service.ts
export const nativeFetch = globalThis.fetch

@Injectable()
export class DomEnv implements OnModuleInit, OnModuleDestroy {
  private registered = false
  async onModuleInit() {
    if (this.registered) return
    const { GlobalRegistrator } = await import('@happy-dom/global-registrator')
    GlobalRegistrator.register({ url: 'https://localhost' })
    this.registered = true
  }
  onModuleDestroy() {
    // GlobalRegistrator.unregister()
    // this.registered = false
  }
}
