import { getClient, query, mutate } from "svelte-apollo";
import { refreshToken, lastLoggedIn, isLoggedIn } from "./store.js";
import { REFRESH_TOKEN } from "./queries.js";

let tokenRefreshTimeout;

export async function tokenRefresh(client, oldToken) {
  console.log("At token refresh");
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
    // push("/login");
  }
}

export function tokenRefreshTimeoutFunc(client) {
  const prevLoggedInDate = JSON.parse(localStorage.getItem("lastLoggedIn"));
  const oldToken = JSON.parse(localStorage.getItem("refreshToken"));
  const refreshExpirationTime = 15 * 60000;
  let timeDifference = Math.abs(Date.now() - prevLoggedInDate);

  if (timeDifference > refreshExpirationTime) {
    console.log(timeDifference / 60000 + " > " + refreshExpirationTime / 60000);
    tokenRefresh(client, oldToken);
  } else {
    let remainingTime = refreshExpirationTime - timeDifference;

    if (localStorage.getItem("startedTimeout") === null) {
      localStorage.setItem("startedTimeout", JSON.stringify(false));
    }

    if (sessionStorage.getItem("startedTimeout-session") === null) {
      sessionStorage.setItem("startedTimeout-session", JSON.stringify(false));
    }

    if (
      JSON.parse(localStorage.getItem("startedTimeout")) === false ||
      JSON.parse(sessionStorage.getItem("startedTimeout-session")) === true
    ) {
      console.log(
        timeDifference / 60000 + " < " + refreshExpirationTime / 60000
      );
      let remainingTimeMinusTenPercent = remainingTime - remainingTime * 0.1;
      tokenRefreshTimeout = setTimeout(
        tokenRefresh,
        remainingTimeMinusTenPercent,
        client,
        oldToken
      );
      localStorage.setItem("startedTimeout", JSON.stringify(true));
      sessionStorage.setItem("startedTimeout-session", JSON.stringify(true));
      console.log("Timeout " + remainingTimeMinusTenPercent);
    } else {
      console.log("Already started timeout!!!");
    }
  }
}

export function clearTokenRefreshTimeout() {
  clearTimeout(tokenRefreshTimeout);
  console.log("Cleared timeout!!!");
}
