import { expose } from 'comlink';
import '../wasm_exec.js';
import { loadSkillTree, passiveToTree } from './skill_tree';
import type { SearchWithSeed, ReverseSearchConfig, SearchResults } from './skill_tree';
import { calculator, data, initializeCrystalline } from './types';

const obj = {
  boot(wasm: ArrayBuffer) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const go = new Go();
    WebAssembly.instantiate(wasm, go.importObject).then((result) => {
      go.run(result.instance);

      initializeCrystalline();

      loadSkillTree();
    });
  },
  async search(args: ReverseSearchConfig, callback: (seed: number) => Promise<void>): Promise<SearchResults> {
    const conquerors =
      args.conqueror === ''
        ? Object.keys(data?.TimelessJewelConquerors?.[args.jewel] || {})
        : [args.conqueror];
    const seedRange = data?.TimelessJewelSeedRanges?.[args.jewel];
    const minSeed = seedRange?.Min || 1;
    const maxSeed = seedRange?.Max || 1;
    const seedCountPerConqueror = Math.max(1, maxSeed - minSeed + 1);
    const searchResult: Record<string, { seed: number; conqueror: string; skills: Record<number, Record<number, number>> }> = {};

    for (let index = 0; index < conquerors.length; index += 1) {
      const conqueror = conquerors[index];
      const result = await calculator.ReverseSearch(
        args.nodes,
        args.stats.map((s) => s.id),
        args.jewel,
        conqueror,
        async (seed) => {
          const normalizedSeed = Math.max(0, seed - minSeed + 1);
          const progress = index * seedCountPerConqueror + normalizedSeed;
          await callback(progress);
        }
      );

      Object.keys(result).forEach((seedStr) => {
        const seed = parseInt(seedStr);
        const key = args.conqueror === '' ? `${conqueror}:${seed}` : `${seed}`;
        searchResult[key] = {
          seed,
          conqueror,
          skills: result[seed]
        };
      });
    }

    const searchGrouped: { [key: number]: SearchWithSeed[] } = {};
    Object.keys(searchResult).forEach((seedStr) => {
      const entry = searchResult[seedStr];
      const seed = entry.seed;

      let weight = 0;

      const statCounts: Record<number, number> = {};
      const skills = Object.keys(entry.skills).map((skillIDStr) => {
        const skillID = parseInt(skillIDStr);
        Object.keys(entry.skills[skillID]).forEach((st) => {
          const n = parseInt(st);
          statCounts[n] = (statCounts[n] || 0) + 1;
          weight += args.stats.find((s) => s.id == n)?.weight || 0;
        });

        return {
          passive: passiveToTree[skillID],
          stats: entry.skills[skillID]
        };
      });

      const len = Object.keys(entry.skills).length;
      searchGrouped[len] = [
        ...(searchGrouped[len] || []),
        {
          skills: skills,
          seed,
          conqueror: entry.conqueror,
          weight,
          statCounts
        }
      ];
    });

    Object.keys(searchGrouped).forEach((len) => {
      const nLen = parseInt(len);
      searchGrouped[nLen] = searchGrouped[nLen].filter((g) => {
        if (g.weight < args.minTotalWeight) {
          return false;
        }

        for (const stat of args.stats) {
          if ((g.statCounts[stat.id] === undefined && stat.min > 0) || g.statCounts[stat.id] < stat.min) {
            return false;
          }
        }

        return true;
      });

      if (Object.keys(searchGrouped[nLen]).length == 0) {
        delete searchGrouped[nLen];
      } else {
        searchGrouped[nLen] = searchGrouped[nLen].sort((a, b) => b.weight - a.weight);
      }
    });

    return {
      grouped: searchGrouped,
      raw: Object.keys(searchGrouped)
        .map((x) => searchGrouped[parseInt(x)])
        .flat()
        .sort((a, b) => b.weight - a.weight)
    };
  }
} as const;

expose(obj);

export type WorkerType = typeof obj;
