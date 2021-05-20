class LRU {
    constructor(max=10) {
        this.max = max;
        this.cache = new Map();
        this.lastUpdate = new Date();
    }

    get(key) {
        let item = this.cache.get(key);
        if (item) // refresh key
        {
            this.cache.delete(key);
            this.cache.set(key, item);
        }
        return item;
    }

    set(key, val) {
        if (this.cache.has(key)){ // refresh key
            this.cache.delete(key);
        }
        else if (this.cache.size == this.max){ // evict oldest
            this.cache.delete(this._first());
        }
        this.cache.set(key, val);
        this.lastUpdate = new Date();
    }

    has(hey){
        return this.cache.has(key);
    }

    _first(){
        return this.cache.keys().next().value;
    }

    get size(){
        return this.cache.size;
    }

    /**
     * Empties the cache
     */
    reset(){
        this.cache.clear();
    }
}

module.exports = LRU;