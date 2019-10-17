<script>
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import Router, { push, pop, replace } from "svelte-spa-router";
  import { routes } from "../DashBoardRoutes.svelte";
  import { isLoggedIn, refreshToken, user, connections } from "../store.js";
  import { getClient, query, mutate } from "svelte-apollo";
  import { GET_USER, GET_CONNECTIONS } from "../queries.js";

  function timeout(ns) {
    return new Promise(resolve => setTimeout(resolve, ns));
  }

  const client = getClient();
  let pingCount = 0;

  const getUser = query(client, {
    query: GET_USER
  });

  const getConnections = query(client, {
    query: GET_CONNECTIONS
  });

  async function fetchUser() {
    try {
      await getUser.refetch().then(result => {
        user.set(result.data.me);
      });
    } catch (error) {
      // console.log(error);
      await timeout(3000);
      fetchUser();
    }
  }

  async function fetchConnections() {
    try {
      await getConnections.refetch().then(result => {
        connections.set(result.data.connections);
        // console.log($connections);
      });
    } catch (error) {
      // console.log(error);
      await timeout(3000);
      fetchConnections();
    }
  }

  onMount(async () => {
    // Set timeout only for testing
    push("/dashboard/shifts");
  });
</script>

<style>
  div {
    display: flex;
    justify-content: center;
  }
</style>

<div in:fade={{ duration: 500 }} />
