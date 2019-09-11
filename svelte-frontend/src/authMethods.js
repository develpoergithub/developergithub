import { push, pop, replace } from 'svelte-spa-router';
import { getClient, query, mutate } from 'svelte-apollo';
import {
	refreshToken,
	keepMeLoggedIn,
	lastLoggedIn,
	isLoggedIn,
	user
} from './store.js';
import {
	CREATE_USER,
	ACTIVATE_USER,
	LOGIN_USER,
	REFRESH_TOKEN
} from './queries.js';

let tokenRefreshTimeout;

async function tokenRefresh(client, oldToken) {
	try {
		await mutate(client, {
			mutation: REFRESH_TOKEN,
			variables: { refreshToken: oldToken }
		}).then(result => {
			const newToken = result.data.refreshToken.refreshToken;
			refreshToken.set(newToken);
			lastLoggedIn.set(Date.now());
			isLoggedIn.set(true);
			tokenRefreshTimeoutFunc(client);
			// push("/dashboard/");
		});
	} catch (error) {
		// console.log(error);
		isLoggedIn.set(false);
	}
}

export function tokenRefreshTimeoutFunc(client) {
	if (localStorage.getItem('startedTimeout') === null) {
		localStorage.setItem('startedTimeout', JSON.stringify(false));
	}

	if (sessionStorage.getItem('startedTimeoutSession') === null) {
		sessionStorage.setItem('startedTimeoutSession', JSON.stringify(false));
	}

	const isStartedTimeout = JSON.parse(localStorage.getItem('startedTimeout'));
	const isSessionTimeout = JSON.parse(
		sessionStorage.getItem('startedTimeoutSession')
	);

	if (isStartedTimeout === true && isSessionTimeout === false) {
		return console.log('Already started Timeout, exiting function!!!');
	}

	const REFRESH_EXPIRATION_TIME_IN_MINUTES = 15;

	let prevLoggedInDate = JSON.parse(localStorage.getItem('lastLoggedIn'));
	let oldToken = JSON.parse(localStorage.getItem('refreshToken'));

	// Must convert timeDifference to minutes
	let timeDifference = Math.abs(Date.now() - prevLoggedInDate) / 60000;
	// Must subtract 10% from the constant refresh expiration time
	let refreshExpirationTime =
		REFRESH_EXPIRATION_TIME_IN_MINUTES -
		REFRESH_EXPIRATION_TIME_IN_MINUTES * 0.1;

	if (timeDifference > refreshExpirationTime) {
		//console.log(timeDifference + " > " + refreshExpirationTime);
		tokenRefresh(client, oldToken);
	} else {
		//console.log(timeDifference + " < " + refreshExpirationTime);
		let remainingTime = refreshExpirationTime - timeDifference;
		clearTokenRefreshTimeout();
		tokenRefreshTimeout = setTimeout(
			remainingTime * 60000,
			// Must convert minutes to milliseconds
			tokenRefresh,
			client,
			oldToken
		);

		if (isStartedTimeout === false) {
			localStorage.setItem('startedTimeout', JSON.stringify(true));
		}

		if (isSessionTimeout === false) {
			sessionStorage.setItem('startedTimeoutSession', JSON.stringify(true));
		}

		console.log('Fetch token in : ' + remainingTime);
	}
}

export function clearTokenRefreshTimeout() {
	clearTimeout(tokenRefreshTimeout);
}

export async function register(client, isCompany, name, email, password) {
	await mutate(client, {
		mutation: CREATE_USER,
		variables: { isCompany, name, email, password }
	}).then(() => {
		push('/verifyaccount');
	});
}

export async function activateAccount(client, email, code) {
	await mutate(client, {
		mutation: ACTIVATE_USER,
		variables: { email, code }
	}).then(() => {
		push('/login');
	});
}

export async function login(client, email, password, isKeepMeLoggedIn) {
	await mutate(client, {
		mutation: LOGIN_USER,
		variables: { email, password }
	}).then(result => {
		refreshToken.set(result.data.tokenAuth.refreshToken);
		keepMeLoggedIn.set(isKeepMeLoggedIn);
		lastLoggedIn.set(Date.now());
		isLoggedIn.set(true);
		// This must be here!!!
		localStorage.setItem('login-event', 'login' + Math.random());
		// tokenRefreshTimeoutFunc(client);
		// push("/dashboard/");
	});
}

export function logout() {
	refreshToken.set('');
	lastLoggedIn.set(0);
	keepMeLoggedIn.set(false);
	isLoggedIn.set(false);
	user.set({});
	sessionStorage.setItem('startedTimeoutSession', JSON.stringify(false));
	localStorage.setItem('startedTimeout', JSON.stringify(false));
	localStorage.setItem('logout-event', 'logout' + Math.random());
}
