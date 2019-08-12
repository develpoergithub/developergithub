<script>
  import { fade } from "svelte/transition";
  import AuthRoute from "./AuthRoute.svelte";
</script>

<style>
  h1 {
    text-align: center;
  }
</style>

<AuthRoute />
<div in:fade={{ duration: 500 }}>
  <h1>Home Page</h1>
</div>
