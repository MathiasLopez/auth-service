
class UrlUtils {
    /**
     * Builds a URL by appending or merging query parameters.
     *
     * Supports both absolute (e.g. "https://site.com/path") and relative (e.g. "/path") URLs.
     * Automatically preserves existing parameters and encodes all values.
     *
     * @param {string} baseUrl - The base URL (absolute or relative).
     * @param {string|Object} [query] - Query parameters to append.
     *                                 Can be a string ("key=value") or an object ({ key: "value" }).
     * @returns {string} The resulting URL with merged query parameters.
     *
     * @example
     * buildUrlWithQuery('https://app.example.com/login', { redirect: '/dashboard' });
     * // → "https://app.example.com/login?redirect=%2Fdashboard"
     *
     * @example
     * buildUrlWithQuery('/search?q=books', { page: 2 });
     * // → "/search?q=books&page=2"
     *
     * @example
     * buildUrlWithQuery('http://algo.com/api/users?limit=10', 'offset=20');
     * // → "http://algo.com/api/users?limit=10&offset=20"
     */
    buildUrlWithQuery(baseUrl, query) {
        // Use current origin as fallback for relative URLs
        const isAbsolute = /^https?:\/\//i.test(baseUrl);
        const url = new URL(baseUrl, isAbsolute ? undefined : 'http://localhost');

        if (!query) return isAbsolute ? url.href : url.pathname + url.search;

        // Add or merge query params
        if (typeof query === 'string') {
            const params = new URLSearchParams(query);
            for (const [key, value] of params.entries()) {
                if (value !== undefined && value !== null) {
                    url.searchParams.set(key, value);
                }
            }
        } else if (typeof query === 'object') {
            Object.entries(query).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    url.searchParams.set(key, value);
                }
            });
        }

        // Return absolute or relative form depending on input
        return isAbsolute ? url.href : url.pathname + url.search;
    }
}

export default new UrlUtils();