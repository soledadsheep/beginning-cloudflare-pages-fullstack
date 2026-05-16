// API base URL - fetched from worker config endpoint
let apiBaseUrl: string | null = null;

export const getApiBaseUrl = async (): Promise<string> => {
	if (!apiBaseUrl) {
		try {
			const response = await fetch('/api/config');
			const config = await response.json();
			apiBaseUrl = config.apiBaseUrl;
		} catch (error) {
			apiBaseUrl = 'https://127.0.0.1:8787'; // fallback to local HTTPS for dev
		}
	}
	return apiBaseUrl || 'https://127.0.0.1:8787';
};

// JWT token utilities
export const decodeJWT = (token: string): any => {
	try {
		const payload = token.split('.')[1];
		const decoded = atob(payload);
		return JSON.parse(decoded);
	} catch (error) {
		console.error('Failed to decode JWT:', error);
		return null;
	}
};

export const isTokenExpired = (token: string): boolean => {
	const decoded = decodeJWT(token);
	if (!decoded || !decoded.exp) return true;
	return Date.now() >= decoded.exp * 1000;
};