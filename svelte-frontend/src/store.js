import { writable } from 'svelte/store';

export const isLoggedIn = writable(false);
export const keepMeLoggedIn = writable(false);
export const lastLoggedIn = writable(33128064978);
export const refreshToken = writable('');
export const user = writable({});
export const invitations = writable([]);
export const connections = writable([]);
export const shifts = writable([]);
export const myShifts = writable([]);
export const menuDisplayed = writable(false);
