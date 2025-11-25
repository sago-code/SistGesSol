// Servicio simple compartido para difundir la consulta de búsqueda en tiempo real
const listeners = new Set();
let query = '';

export const searchService = {
    setQuery(newQuery) {
        query = newQuery ?? '';
        listeners.forEach((cb) => {
            try { cb(query); } catch {}
        });
    },
    subscribe(cb) {
        listeners.add(cb);
        // emite estado actual al suscribirse
        try { cb(query); } catch {}
        return () => listeners.delete(cb);
    },
    getQuery() {
        return query;
    }
};