<script>
  import Router from "svelte-spa-router";
  import { routes } from "./Routes.svelte";
  //import Account from "./Account.svelte";
  // import ApplloClient from "apollo-boost";
  // import { setClient } from "svelte-apollo";
  // const client = new ApplloClient({
  //   uri: "https://swapboard.herokuapp.com/graphql"
  // });
  // setClient(client);
</script>

<style>

</style>

<main>
  <Router {routes} />
</main>
