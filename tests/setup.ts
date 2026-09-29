import "@testing-library/jest-dom/vitest";
// Polyfills jsdom
if (!("structuredClone" in globalThis)) (globalThis as any).structuredClone = (v: unknown) => JSON.parse(JSON.stringify(v));
Object.defineProperty(window, "confirm", { value: () => true });
(globalThis as any).URL.createObjectURL = () => "blob:test";
(globalThis as any).URL.revokeObjectURL = () => {};
