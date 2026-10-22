import { describe, expect, it } from 'vitest';
import { findPath } from '../src/sim/path';

const open = () => true;

describe('findPath', () => {
  it('finds a shortest path including both ends', () => {
    const p = findPath(5, 5, open, [0, 0], [3, 2])!;
    expect(p).toHaveLength(6); // manhattan 5 + start
    expect(p[0]).toEqual([0, 0]);
    expect(p.at(-1)).toEqual([3, 2]);
  });

  it('walks around obstacles', () => {
    const wall = (x: number, y: number) => !(x === 1 && y < 2);
    const p = findPath(3, 3, wall, [0, 0], [2, 0])!;
    expect(p.some(([x, y]) => x === 1 && y < 2)).toBe(false);
    expect(p.at(-1)).toEqual([2, 0]);
  });

  it('returns null without a connection', () => {
    const wall = (x: number) => x !== 1;
    expect(findPath(3, 3, wall, [0, 0], [2, 0])).toBeNull();
  });

  it('is deterministic', () => {
    expect(findPath(8, 8, open, [0, 0], [7, 7])).toEqual(findPath(8, 8, open, [0, 0], [7, 7]));
  });
});
