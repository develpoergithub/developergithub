<script context="module">
  import InviteEmployee from "./dashboard/InviteEmployee.svelte";
  import Invitations from "./dashboard/Invitations.svelte";
  import Shifts from "./dashboard/Shifts.svelte";
  import PostShift from "./dashboard/PostShift.svelte";
  export const routes = {
    "/dashboard/invite": InviteEmployee,
    "/dashboard/invitations": Invitations,
    "/dashboard/shifts": Shifts,
    "/dashboard/postshift": PostShift
  };
</script>
