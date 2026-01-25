// API base URL - fetched from worker config endpoint
let apiBaseUrl: string | null = null;

export const getApiBaseUrl = async (): Promise<string> => {
	if (!apiBaseUrl) {
		try {
			const response = await fetch('/api/config');
			const config = await response.json();
			apiBaseUrl = config.apiBaseUrl;
		} catch (error) {
			apiBaseUrl = 'http://127.0.0.1:8787'; // fallback
		}
	}
	return apiBaseUrl;
};