<script context="module">
  import Notification from "./Notification.svelte";
  export let notifications;
</script>

<Notification bind:this={notifications} />
