import { writable } from 'svelte/store';

export const refreshToken = writable('');
export const isLoggedIn = writable(false);
export const user = writable({});
