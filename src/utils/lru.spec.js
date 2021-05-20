const AppConfig = require('../../app.config').AppConfig;

describe("Tests LRU", () => {
    
    test("dumps oldest entry", async() => {
        const lru = new AppConfig.LRU(3);
        lru.set('a', 1);
        lru.set('b', 2);
        lru.set('c', 3);
        lru.set('d', 4);
        expect(lru.get('a')).toBe(undefined);
        expect(lru.get('b')).toBe(2);
    });

    test("keeps oldest entry if requested", async() => {
        const lru = new AppConfig.LRU(3);
        lru.set('a', 1);
        lru.set('b', 2);
        lru.get('a');
        lru.set('c', 3);
        lru.set('d', 4);
        expect(lru.get('a')).toBe(1);
        expect(lru.get('b')).toBe(undefined);
    });

    test("size is accurate", async() => {
        const lru = new AppConfig.LRU(3);
        lru.set('a', 1);
        expect(lru.size).toBe(1);
    });

    test("reset works", async() => {
        const lru = new AppConfig.LRU(3);
        lru.set('a', 1);
        lru.reset();
        expect(lru.size).toBe(0);
    });
});