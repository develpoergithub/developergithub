<script>
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import Router, { push, pop, replace } from "svelte-spa-router";
  import { routes } from "../DashBoardRoutes.svelte";
  import { isLoggedIn, refreshToken, user, connections } from "../store.js";
  import { getClient, query, mutate } from "svelte-apollo";
  import { GET_USER, GET_CONNECTIONS } from "../queries.js";

  // function timeout(ns) {
  //   return new Promise(resolve => setTimeout(resolve, ns));
  // }

  const client = getClient();

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
