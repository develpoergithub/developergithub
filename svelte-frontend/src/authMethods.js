import { push, pop, replace } from "svelte-spa-router";
import { getClient, query, mutate } from "svelte-apollo";
import {
  refreshToken,
  keepMeLoggedIn,
  lastLoggedIn,
  isLoggedIn,
  user
} from "./store.js";
import {
  CREATE_USER,
  ACTIVATE_USER,
  LOGIN_USER,
  REFRESH_TOKEN
} from "./queries.js";

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
  if (localStorage.getItem("startedTimeout") === null) {
    localStorage.setItem("startedTimeout", JSON.stringify(false));
  }

  if (sessionStorage.getItem("startedTimeoutSession") === null) {
    sessionStorage.setItem("startedTimeoutSession", JSON.stringify(false));
  }

  const isStartedTimeout = JSON.parse(localStorage.getItem("startedTimeout"));
  const isSessionTimeout = JSON.parse(
    sessionStorage.getItem("startedTimeoutSession")
  );

  if (isStartedTimeout === true && isSessionTimeout === false) {
    return console.log("Already started Timeout, exiting function!!!");
  }

  const prevLoggedInDate = JSON.parse(localStorage.getItem("lastLoggedIn"));
  const oldToken = JSON.parse(localStorage.getItem("refreshToken"));
  const refreshExpirationTime = 15 * 60000;

  let timeDifference = Math.abs(Date.now() - prevLoggedInDate);

  if (timeDifference > refreshExpirationTime) {
    console.log(timeDifference / 60000 + " > " + refreshExpirationTime / 60000);
    tokenRefresh(client, oldToken);
  } else {
    console.log(timeDifference / 60000 + " < " + refreshExpirationTime / 60000);
    let remainingTime = refreshExpirationTime - timeDifference;
    let remainingTimeMinusTenPercent = remainingTime - remainingTime * 0.1;
    clearTokenRefreshTimeout();
    tokenRefreshTimeout = setTimeout(
      tokenRefresh,
      remainingTimeMinusTenPercent,
      client,
      oldToken
    );

    if (isStartedTimeout === false) {
      localStorage.setItem("startedTimeout", JSON.stringify(true));
    }

    if (isSessionTimeout === false) {
      sessionStorage.setItem("startedTimeoutSession", JSON.stringify(true));
    }

    console.log("Fetch token in : " + remainingTimeMinusTenPercent / 60000);
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
    push("/verifyaccount");
  });
}

export async function activateAccount(client, email, code) {
  await mutate(client, {
    mutation: ACTIVATE_USER,
    variables: { email, code }
  }).then(() => {
    push("/login");
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
    localStorage.setItem("login-event", "login" + Math.random());
    // tokenRefreshTimeoutFunc(client);
    // push("/dashboard/");
  });
}

export function logout() {
  refreshToken.set("");
  lastLoggedIn.set(0);
  keepMeLoggedIn.set(false);
  isLoggedIn.set(false);
  user.set({});
  sessionStorage.setItem("startedTimeoutSession", JSON.stringify(false));
  localStorage.setItem("startedTimeout", JSON.stringify(false));
  localStorage.setItem("logout-event", "logout" + Math.random());
}
