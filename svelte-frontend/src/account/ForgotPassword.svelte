<script>
  import { fade } from "svelte/transition";
</script>

<style>
  h1 {
    text-align: center;
  }
</style>

<div in:fade={{ duration: 500 }}>
  <h1>Forgot Password Page</h1>
</div>
