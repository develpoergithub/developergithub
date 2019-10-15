<script context="module">
  export let notification;
</script>

<script>
  import { onMount, afterUpdate, beforeUpdate, setContext } from "svelte";
  import Router, { push, pop, replace, location } from "svelte-spa-router";
  import { routes } from "./Routes.svelte";
  import Header from "./Header.svelte";
  import { ApolloClient } from "apollo-client";
  import { InMemoryCache } from "apollo-cache-inmemory";
  import { HttpLink } from "apollo-link-http";
  import { WebSocketLink } from "apollo-link-ws";
  import { getMainDefinition } from "apollo-utilities";
  import { onError } from "apollo-link-error";
  import { split } from "apollo-link";
  import { SubscriptionClient } from "subscriptions-transport-ws";
  import { setClient, getClient, query, mutate } from "svelte-apollo";
  import {
    keepMeLoggedIn,
    isLoggedIn,
    lastLoggedIn,
    refreshToken,
    user,
    menuDisplayed
  } from "./store.js";
  import { useLocalStorage, useSessionStorage } from "./storage.js";
  import { REFRESH_TOKEN } from "./queries.js";
  import {
    fetchUser,
    fetchConnections,
    tokenRefreshTimeoutFunc,
    clearTokenRefreshTimeout
  } from "./authMethods.js";
  import Noto, { notifications } from "./Noto.svelte";

  let client;

  function setGraphQLClient() {
    const HTTP_GRAPHQL_ENDPOINT =
      (window.location.protocol === "https" ? "https" : "http") +
      "://" +
      window.location.host +
      "/graphql";

    const WS_GRAPHQL_ENDPOINT =
      (window.location.protocol === "https" ? "wss" : "ws") +
      "://" +
      window.location.host +
      "/graphql";

    console.log("WS : " + WS_GRAPHQL_ENDPOINT);

    const httpLink = new HttpLink({
      uri: HTTP_GRAPHQL_ENDPOINT
      // credentials: 'same-origin'
    });

    const wsLink = new WebSocketLink({
      uri: WS_GRAPHQL_ENDPOINT,
      options: {
        reconnect: true
      }
    });

    const link = split(
      ({ query }) => {
        const { kind, operation } = getMainDefinition(query);
        return kind === "OperationDefinition" && operation === "subscription";
      },
      wsLink,
      httpLink
    );

    client = new ApolloClient({
      link,
      cache: new InMemoryCache()
    });
  }

  setTimeout(() => {
    setGraphQLClient();
    setClient(client);
  }, 3000);

  useSessionStorage(isLoggedIn, "isLoggedIn");
  useLocalStorage(keepMeLoggedIn, "keepMeLoggedIn");
  useLocalStorage(refreshToken, "refreshToken");
  useLocalStorage(lastLoggedIn, "lastLoggedIn");
  useLocalStorage(user, "user");

  window.addEventListener("storage", function(event) {
    if (event.key == "login-event") {
      setTimeout(() => {
        isLoggedIn.set(true);
        push("/dashboard/shifts");
      }, Math.random() * (2000 - 1000) + 1000);
      // localStorage.removeItem("login-event");
    } else if (event.key == "logout-event") {
      sessionStorage.setItem("startedTimeoutSession", JSON.stringify(false));
      isLoggedIn.set(false);
      // localStorage.removeItem("logout-event");
    } else if (event.key == "new-tab-event") {
      if ($isLoggedIn === true) {
        localStorage.setItem(
          "currently-logged-in-event",
          "true" + Math.random()
        );
        // localStorage.removeItem("new-tab-event");
      }
    } else if (event.key == "currently-logged-in-event") {
      if ($isLoggedIn === false) {
        isLoggedIn.set(true);
        push("/dashboard/shifts");
        tokenRefreshTimeoutFunc(client);
        fetchUser(client);
        fetchConnections(client);
      }
      // localStorage.removeItem("currently-logged-in-event");
    } else if (event.key == "start-timeout-event") {
      setTimeout(() => {
        tokenRefreshTimeoutFunc(client);
      }, Math.random() * (10000 - 5000) + 5000);
    }
  });

  window.addEventListener("beforeunload", function(event) {
    if (sessionStorage.getItem("startedTimeoutSession") === null) {
      return;
    }

    if (JSON.parse(sessionStorage.getItem("startedTimeoutSession")) === true) {
      sessionStorage.setItem("startedTimeoutSession", JSON.stringify(false));
      localStorage.setItem("startedTimeout", JSON.stringify(false));
      localStorage.setItem("start-timeout-event", "timeout" + Math.random());
    }
  });

  if ($keepMeLoggedIn === true && $isLoggedIn === false) {
    isLoggedIn.set(true);
    menuDisplayed.set(true);
    tokenRefreshTimeoutFunc(client);
    fetchUser(client);
    fetchConnections(client);
  } else if ($isLoggedIn === true) {
    menuDisplayed.set(true);
    tokenRefreshTimeoutFunc(client);
    fetchUser(client);
    fetchConnections(client);
  } else {
    localStorage.setItem("new-tab-event", "newtab" + Math.random());
  }

  $: if ($isLoggedIn === false) {
    // tokenRefreshTimeoutFunc(client);
    // if (!$location.includes("/confirminvitation/")) {
    //   push("/dashboard/");
    // }
    clearTokenRefreshTimeout();
    push("/login");
  }

  $: if (window.screen.availWidth < 640) {
    menuDisplayed.set(false);
  }
</script>

<style>
  #wrapper {
    margin-top: 55px;
  }
  /* Sidebar */
  #sidebar-wrapper {
    z-index: 1;
    position: fixed;
    width: 0px;
    height: 100%;
    overflow-y: hidden;
    background: grey;
    opacity: 0.9;
  }

  /* Always take up entire screen */
  #page-content-wrapper {
    width: 100%;
    position: absolute;
    padding: 15px;
  }

  /* Change with of sidebar from 0 to 250px */
  #wrapper.menuDisplayed #sidebar-wrapper {
    width: 250px;
  }

  /* Since we added left padding, we need to shrink the width by 250px */
  #wrapper.menuDisplayed #page-content-wrapper {
    padding-left: 260px;
  }

  /* Sidebar styling - the entire ul list */
  .sidebar-nav {
    padding: 0;
    list-style: none;
  }

  .sidebar-nav li {
    text-indent: 20px;
    line-height: 40px;
  }

  .sidebar-nav li a {
    display: block;
    text-decoration: none;
    color: #ddd;
  }

  .sidebar-nav li a:hover {
    background: #16a085;
  }

  @media screen and (max-width: 640px) {
    #wrapper.menuDisplayed #sidebar-wrapper {
      display: none;
    }

    #wrapper.menuDisplayed #page-content-wrapper {
      padding-left: 0px;
    }
  }
</style>

<main>
  <Header />
  <div id="wrapper" class={$menuDisplayed ? 'menuDisplayed' : ''}>

    <div id="sidebar-wrapper" class="">

      <ul class="sidebar-nav">
        {#if !$user.isCompany}
          <li>
            <a href="#/dashboard/postshift">Post Shift</a>
          </li>
        {/if}
        <li>
          <a href="#/dashboard/shifts">Shift</a>
        </li>
        <li>
          {#if $user.isCompany}
            <a href="#/dashboard/invite">Invite</a>
          {:else}
            <a href="#/dashboard/invitations">Invitations</a>
          {/if}
        </li>
      </ul>
    </div>
    <div id="page-content-wrapper">
      <Noto />

      <Router {routes} />
    </div>
  </div>
</main>
