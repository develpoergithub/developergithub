import { push, pop, replace } from 'svelte-spa-router';
import { getClient, query, mutate } from 'svelte-apollo';
import {
	refreshToken,
	keepMeLoggedIn,
	lastLoggedIn,
	isLoggedIn,
	user,
	connections,
	shifts,
	shiftConnections,
	menuDisplayed,
	myShifts
} from './store.js';
import {
	CREATE_USER,
	ACTIVATE_USER,
	LOGIN_USER,
	REFRESH_TOKEN,
	GET_USER,
	GET_SHIFTS,
	GET_MY_SHIFTS,
	GET_CONNECTIONS,
	GET_SHIFT_CONNECTIONS,
	ACCEPT_SHIFT_CONNECTION,
	CHECK_LOGIN
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
		console.log(error);
		isLoggedIn.set(false);
	}
}

export async function tokenRefreshTimeoutFunc(client) {
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

	const REFRESH_EXPIRATION_TIME_IN_MINUTES = 60;

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
		await tokenRefresh(client, oldToken);
	} else {
		//console.log(timeDifference + " < " + refreshExpirationTime);
		let remainingTime = refreshExpirationTime - timeDifference;
		clearTokenRefreshTimeout();
		tokenRefreshTimeout = setTimeout(
			tokenRefresh,
			// Must convert minutes to milliseconds
			remainingTime * 60000,
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
	menuDisplayed.set(false);
	isLoggedIn.set(false);
	user.set({});
	sessionStorage.setItem('startedTimeoutSession', JSON.stringify(false));
	localStorage.setItem('startedTimeout', JSON.stringify(false));
	localStorage.setItem('logout-event', 'logout' + Math.random());
}

export async function fetchUser(client) {
	let getUser = query(client, {
		query: GET_USER
	});

	try {
		await getUser.refetch().then(result => {
			user.set(result.data.me);
		});
	} catch (error) {
		console.log(error);
		isLoggedIn.set(false);
	}
}

export async function checkSession(client) {
	let checkLogin = query(client, {
		query: CHECK_LOGIN
	});

	try {
		await checkLogin.refetch().then(result => {
			isLoggedIn.set(result.data.checkLogin);
		});
	} catch (error) {
		console.log(error);
		isLoggedIn.set(false);
	}
}

export async function fetchConnections(client) {
	let getConnections = query(client, {
		query: GET_CONNECTIONS
	});
	try {
		await getConnections.refetch().then(result => {
			connections.set(result.data.connections);
			// console.log(result.data.connections);
		});
	} catch (error) {
		console.log(error);
		isLoggedIn.set(false);
	}
}

export async function fetchShifts(client, selectedCompanyId) {
	const getShifts = query(client, {
		query: GET_SHIFTS,
		variables: { companyId: selectedCompanyId }
	});

	try {
		console.log('Fetching Shifts');
		await getShifts.refetch().then(result => {
			shifts.set(result.data.shifts);
		});
	} catch (error) {
		console.log(error);
	}
}

export async function fetchMyShifts(client, selectedCompanyId) {
	const getMyShifts = query(client, {
		query: GET_MY_SHIFTS,
		variables: { companyId: selectedCompanyId }
	});

	try {
		console.log('Fetching My Shifts');
		await getMyShifts.refetch().then(result => {
			myShifts.set(result.data.myShifts);
		});
	} catch (error) {
		console.log(error);
	}
}

export async function fetchShiftConnections(client, companyId) {
	const getShiftConnections = query(client, {
		query: GET_SHIFT_CONNECTIONS,
		variables: { companyId: companyId }
	});

	try {
		await getShiftConnections.refetch().then(result => {
			shiftConnections.set(result.data.shiftConnections);
			// console.log(result.data.shiftConnections);
		});
	} catch (error) {
		console.log(error);
	}
}

export async function acceptShiftConnection(client, shiftConnectionId) {
	await mutate(client, {
		mutation: ACCEPT_SHIFT_CONNECTION,
		variables: { shiftConnectionId: shiftConnectionId }
	});
}

async function timeout(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}
