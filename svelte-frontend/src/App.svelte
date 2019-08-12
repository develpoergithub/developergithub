<script>
  import { onMount } from "svelte";
  import Router, { push, pop, replace } from "svelte-spa-router";
  import { routes } from "./Routes.svelte";
  import Header from "./Header.svelte";
  import ApplloClient from "apollo-boost";
  import { setClient, getClient, query, mutate } from "svelte-apollo";
  import {
    keepMeLoggedIn,
    isLoggedIn,
    lastLoggedIn,
    refreshToken
  } from "./store.js";
  import { useLocalStorage, useSessionStorage } from "./storage.js";
  import { REFRESH_TOKEN } from "./queries.js";
  import {
    tokenRefreshTimeoutFunc,
    clearTokenRefreshTimeout
  } from "./authMethods.js";

  const client = new ApplloClient({
    uri: "http://localhost:8000/graphql"
  });

  setClient(client);

  useSessionStorage(isLoggedIn, "isLoggedIn");
  useLocalStorage(keepMeLoggedIn, "keepMeLoggedIn");
  useLocalStorage(refreshToken, "refreshToken");
  useLocalStorage(lastLoggedIn, "lastLoggedIn");

  window.addEventListener("storage", function(event) {
    if (event.key == "login-event") {
      isLoggedIn.set(true);
      // window.location.reload();
      // localStorage.removeItem("login-event");
    } else if (event.key == "logout-event") {
      isLoggedIn.set(false);
      // window.location.reload();
      // localStorage.removeItem("logout-event");
      //window.location.href = "/";
    } else if (event.key == "new-tab-event") {
      if ($isLoggedIn === true) {
        localStorage.setItem(
          "currently-logged-in-event",
          "true" + Math.random()
        );
        // localStorage.removeItem("new-tab-event");
      }
    } else if (event.key == "currently-logged-in-event") {
      isLoggedIn.set(true);
      // push("/dashboard/");
      // localStorage.removeItem("currently-logged-in-event");
    } else if (event.key == "startedTimeout") {
      if (JSON.parse(event.newValue) === false) {
        setTimeout(() => {
          tokenRefreshTimeoutFunc(client);
        }, Math.random() * (10000 - 5000) + 5000);
      } else {
        sessionStorage.setItem("startedTimeout-session", JSON.stringify(false));
      }
    }
  });

  window.addEventListener("beforeunload", function(event) {
    if (sessionStorage.getItem("startedTimeout-session") === null) {
      return;
    }

    if (JSON.parse(sessionStorage.getItem("startedTimeout-session")) === true) {
      localStorage.setItem("startedTimeout", JSON.stringify(false));
      sessionStorage.setItem("startedTimeout-session", JSON.stringify(false));
    }
  });

  onMount(() => {
    localStorage.setItem("new-tab-event", "newtab" + Math.random());
    if ($keepMeLoggedIn === true) {
      isLoggedIn.set(true);
    }

    if ($isLoggedIn === false) {
      return push("/login");
    }

    if ($refreshToken !== "") {
      //tokenRefreshTimeoutFunc(client);
    }
  });

  $: if ($isLoggedIn === true) {
    tokenRefreshTimeoutFunc(client);
    push("/dashboard/");
  } else {
    clearTokenRefreshTimeout();
    push("/login");
  }
</script>

<style>

</style>

<main>
  <Header />
  <Router {routes} />
</main>
