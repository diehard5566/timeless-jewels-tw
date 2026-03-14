<script lang="ts">
  import '../app.scss';
  import '../wasm_exec.js';
  import { assets } from '$app/paths';
  import { onMount } from 'svelte';
  import { loadSkillTree } from '../lib/skill_tree';
  import { syncWrap } from '../lib/worker';
  import { initializeCrystalline } from '../lib/types';

  let wasmLoading = true;
  let wasmError: string | undefined;

  const GoClass = (globalThis as unknown as { Go: new () => { importObject: WebAssembly.Imports; run(instance: WebAssembly.Instance): Promise<void> } }).Go;
  onMount(() => {
    const go = new GoClass();
    fetch(assets + '/calculator.wasm')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`WASM 載入失敗 (${res.status})，請先執行：GOOS=js GOARCH=wasm go build -o frontend/static/calculator.wasm ./wasm`);
        }
        return res.arrayBuffer();
      })
      .then((buf) => {
        return WebAssembly.instantiate(buf, go.importObject).then((result) => ({ result, buf }));
      })
      .then(({ result, buf }) => {
        go.run(result.instance);
        wasmLoading = false;
        initializeCrystalline();
        loadSkillTree();
        syncWrap.boot(buf);
      })
      .catch((err: unknown) => {
        wasmLoading = false;
        wasmError = err instanceof Error ? err.message : String(err);
      });
  });
</script>

{#if wasmLoading}
  <div class="flex flex-row justify-center h-screen">
    <div class="flex flex-col">
      <div class="py-10 flex flex-col justify-between">
        <div>
          <h1 class="text-white mb-10 text-center">永恆珠寶計算器</h1>
          <h2 class="text-center">Loading...</h2>
        </div>
      </div>
    </div>
  </div>
{:else if wasmError}
  <div class="flex flex-row justify-center h-screen items-center">
    <div class="flex flex-col max-w-md text-center px-4">
      <h1 class="text-white mb-4">無法載入計算器</h1>
      <p class="text-gray-300 mb-4">{wasmError}</p>
      <p class="text-gray-400 text-sm">在專案根目錄執行：<code class="bg-gray-700 px-1 rounded">GOOS=js GOARCH=wasm go build -o frontend/static/calculator.wasm ./wasm</code></p>
    </div>
  </div>
{:else}
  <slot />
{/if}
