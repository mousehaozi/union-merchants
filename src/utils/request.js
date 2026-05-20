/**
 * 
 * @param {*} url 
 * @param {*} method 
 * @param {*} data 
 * @param {*} headers
 * @param {*} options { skipAuthRedirect: boolean, hideToast: boolean } 是否跳过认证重定向, 是否隐藏错误提示
 * @returns 返回一个promise
 */
import {
	baseUrl
} from './baseUrl.js';
import {
	getToken,
	setToken
} from './token.js';
import { ElMessage } from 'element-plus';
import router from '@/router';

const BASEURL = baseUrl();
const REQUEST_TIMEOUT = 5000;

console.log(BASEURL, 'BASEURL');

export function axios(url, method = 'GET', data = {}, headers = {}, options = {}) {
	// 合并默认headers和传入的headers  
	const defaultHeaders = {
		'Content-Type': 'application/json',
	};
	headers = Object.assign({}, defaultHeaders, headers);

	const token = getToken();
	// 如果存在token，则添加到headers中  
	if (token) {
		headers['token'] = `${token}`;
		headers['Authorization'] = 'Bearer ' + token;
	}

	let requestUrl = url.includes('http://') || url.includes('https://') ? url : `${BASEURL}${url}`;
	const fetchOptions = {
		method: method.toUpperCase(),
		headers: headers,
	};

	if (fetchOptions.method === 'GET') {
		const queryParams = new URLSearchParams();
		Object.keys(data).forEach(key => {
			if (data[key] !== undefined && data[key] !== null) {
				queryParams.append(key, data[key]);
			}
		});
		const queryString = queryParams.toString();
		if (queryString) {
			requestUrl += (requestUrl.includes('?') ? '&' : '?') + queryString;
		}
	} else {
		fetchOptions.body = JSON.stringify(data);
	}

	// 设置超时
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
	fetchOptions.signal = controller.signal;

	return fetch(requestUrl, fetchOptions)
		.then(async (response) => {
			clearTimeout(timeoutId);
			const statusCode = response.status;
			let responseData;
			try {
				responseData = await response.json();
			} catch (e) {
				responseData = null;
			}

			if (statusCode === 200 && responseData && (responseData.code === 200 || responseData.code === 0)) {
				return responseData;
			} else if (
				(responseData && (responseData.code === 401 || responseData.code === 403)) || 
				statusCode === 401 || 
				statusCode === 403
			) {
				// 根据options决定是否自动跳转
				if (!options.skipAuthRedirect) {
					ElMessage({
						message: (responseData && (responseData.msg || responseData.message)) ? (responseData.msg || responseData.message) : '登录已失效，请重新登录',
						type: 'error',
						duration: 3000
					});
					setTimeout(() => {
						router.push('/login');
						localStorage.clear();
					}, 2000);
				}
				throw new Error('AUTH_ERROR');
			} else {
				if (responseData && responseData.code !== 200 && responseData.code !== 0) {
					if (!options.hideToast) {
						ElMessage({
							message: responseData.msg || responseData.message || '请求出错',
							type: 'error',
							duration: 3000
						});
					}
				}
				return responseData;
			}
		})
		.catch((error) => {
			clearTimeout(timeoutId);
			if (error.name === 'AbortError') {
				ElMessage({
					message: '请求超时，请稍后再试',
					type: 'error'
				});
				throw new Error('TIMEOUT');
			}
			
			if (error.message === 'AUTH_ERROR' || error.message === 'TIMEOUT') {
				throw error;
			}

			ElMessage({
				message: '网络请求失败',
				type: 'error'
			});
			throw error;
		});
}
