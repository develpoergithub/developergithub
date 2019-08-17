<script>
  import { onMount } from "svelte";
  import { fade } from "svelte/transition";
  import Router, { push, pop, replace } from "svelte-spa-router";
  import { routes } from "../DashBoardRoutes.svelte";
  import { isLoggedIn, refreshToken, user } from "../store.js";
  import { getClient, query, mutate } from "svelte-apollo";
  import { GET_USER } from "../queries.js";
  import { tokenRefreshTimeoutFunc } from "../authMethods.js";

  const client = getClient();
  let pingCount = 0;

  const getUser = query(client, {
    query: GET_USER
  });

  async function fetchUser() {
    try {
      await getUser.refetch().then(result => {
        pingCount = 0;
        user.set(result.data.me);
      });
    } catch (error) {
      // console.log(error);
      if (pingCount < 3) {
        pingCount += 1;
        setTimeout(() => {
          fetchUser();
        }, 1000);
      }
    }
  }

  onMount(async () => {
    // Set timeout only for testing
    setTimeout(() => {
      fetchUser();
    }, 2000);
  });
</script>

<style>
  p {
    text-align: center;
  }
  div {
    display: flex;
    justify-content: center;
  }
</style>

<div in:fade={{ duration: 500 }}>
  <p>This is a work in progress check back later!</p>
</div>
<Router {routes} />
